/// Op-log offline: semua mutasi lapangan dicatat dulu sebagai op tertunda,
/// dikirim saat ada koneksi, status server HANYA ditampilkan setelah
/// konfirmasi sukses (tidak pernah optimistis "berhasil").
///
/// Alur:
/// - Online + sukses  -> langsung tampil hasil server.
/// - Offline / gagal  -> op disimpan (PENDING_SYNC), UI tampil
///   "Tersimpan offline, menunggu sinkron" + banner retry.
/// - Reconnect        -> sync otomatis FIFO, idempotency key per op mencegah
///   duplikasi (key dikirim sebagai bagian payload/note).
library;

import 'dart:convert';
import 'dart:math';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum OpState { pendingSync, syncing, synced, failed }

enum OpType {
  eventTransition,
  taskToggle,
  packedQty,
  transportUpdate,
  attendance,
  reconciliation,
  handover,
}

String _newIdempotencyKey() {
  final r = Random.secure();
  final bytes = List<int>.generate(16, (_) => r.nextInt(256));
  final hex =
      bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  return '${hex.substring(0, 8)}-${hex.substring(8, 12)}-'
      '${hex.substring(12, 16)}-${hex.substring(16, 20)}-'
      '${hex.substring(20)}';
}

class PendingOp {
  final String key;
  final OpType type;
  final String label;
  final Map<String, dynamic> payload;
  final OpState state;
  final int attempts;
  final String? error;
  final String createdAt;

  PendingOp({
    required this.key,
    required this.type,
    required this.label,
    required this.payload,
    this.state = OpState.pendingSync,
    this.attempts = 0,
    this.error,
    String? createdAt,
  }) : createdAt = createdAt ?? DateTime.now().toIso8601String();

  PendingOp copyWith({OpState? state, int? attempts, String? error}) =>
      PendingOp(
        key: key,
        type: type,
        label: label,
        payload: payload,
        state: state ?? this.state,
        attempts: attempts ?? this.attempts,
        error: error,
        createdAt: createdAt,
      );

  Map<String, dynamic> toJson() => {
        'key': key,
        'type': type.name,
        'label': label,
        'payload': payload,
        'state': state.name,
        'attempts': attempts,
        'error': error,
        'created_at': createdAt,
      };

  factory PendingOp.fromJson(Map<String, dynamic> j) => PendingOp(
        key: j['key'] as String,
        type: OpType.values.byName(j['type'] as String),
        label: (j['label'] ?? '') as String,
        payload: Map<String, dynamic>.from(j['payload'] as Map),
        state: OpState.values.byName((j['state'] ?? 'pendingSync') as String),
        attempts: (j['attempts'] ?? 0) as int,
        error: j['error'] as String?,
        createdAt: j['created_at'] as String?,
      );
}

typedef OpExecutor = Future<void> Function(PendingOp op);

class OfflineStore extends ChangeNotifier {
  OfflineStore._();
  static final OfflineStore instance = OfflineStore._();

  static const _prefsKey = 'offline_oplog_v1';

  final List<PendingOp> _ops = [];
  bool _online = true;
  bool _syncing = false;

  List<PendingOp> get ops => List.unmodifiable(_ops);
  bool get isOnline => _online;
  bool get isSyncing => _syncing;

  List<PendingOp> get pending =>
      _ops.where((o) => o.state != OpState.synced).toList();
  List<PendingOp> get failed =>
      _ops.where((o) => o.state == OpState.failed).toList();
  int get pendingCount => pending.length;

  Future<void> init() async {
    await _load();
    final results = await Connectivity().checkConnectivity();
    _online = !results.contains(ConnectivityResult.none);
    Connectivity().onConnectivityChanged.listen((results) {
      final nowOnline = !results.contains(ConnectivityResult.none);
      if (nowOnline && !_online) {
        _online = true;
        notifyListeners();
        syncAll();
      } else if (nowOnline != _online) {
        _online = nowOnline;
        notifyListeners();
      }
    });
    notifyListeners();
  }

  OpExecutor? executor;

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_prefsKey);
    if (raw == null || raw.isEmpty) return;
    try {
      final list = (jsonDecode(raw) as List).cast<Map<String, dynamic>>();
      _ops
        ..clear()
        ..addAll(list.map(PendingOp.fromJson));
      // Op yang macet di SYNCING saat app mati → kembalikan ke PENDING.
      for (var i = 0; i < _ops.length; i++) {
        if (_ops[i].state == OpState.syncing) {
          _ops[i] = _ops[i].copyWith(state: OpState.pendingSync);
        }
      }
    } catch (_) {
      _ops.clear();
    }
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    // Simpan 100 op terakhir agar storage tidak membengkak.
    final keep = _ops.length > 100 ? _ops.sublist(_ops.length - 100) : _ops;
    await prefs.setString(
      _prefsKey,
      jsonEncode(keep.map((o) => o.toJson()).toList()),
    );
  }

  /// Catat op baru. Kembalikan op agar pemanggil bisa menampilkan statusnya.
  Future<PendingOp> enqueue(
    OpType type,
    String label,
    Map<String, dynamic> payload,
  ) async {
    final op = PendingOp(
      key: _newIdempotencyKey(),
      type: type,
      label: label,
      payload: {...payload, 'idempotency_key': _newIdempotencyKey()},
    );
    _ops.add(op);
    await _persist();
    notifyListeners();
    return op;
  }

  /// Jalankan aksi: coba langsung bila online; bila gagal/offline → antrekan.
  /// Kembalikan true HANYA jika server mengonfirmasi sukses.
  Future<bool> runOrQueue(
    OpType type,
    String label,
    Map<String, dynamic> payload,
  ) async {
    final exec = executor;
    if (_online && exec != null) {
      final probe = PendingOp(
        key: _newIdempotencyKey(),
        type: type,
        label: label,
        payload: {...payload, 'idempotency_key': _newIdempotencyKey()},
      );
      try {
        await exec(probe);
        _ops.add(probe.copyWith(state: OpState.synced));
        await _persist();
        notifyListeners();
        return true;
      } catch (_) {
        _ops.add(probe.copyWith(state: OpState.pendingSync));
        await _persist();
        notifyListeners();
        return false;
      }
    }
    await enqueue(type, label, payload);
    return false;
  }

  Future<void> syncAll() async {
    final exec = executor;
    if (_syncing || exec == null || !_online) return;
    final queue =
        _ops.where((o) => o.state != OpState.synced).toList();
    if (queue.isEmpty) return;
    _syncing = true;
    notifyListeners();
    for (final op in queue) {
      final idx = _ops.indexWhere((o) => o.key == op.key);
      if (idx < 0) continue;
      _ops[idx] = op.copyWith(state: OpState.syncing);
      notifyListeners();
      try {
        await exec(op);
        _ops[idx] = op.copyWith(state: OpState.synced, attempts: op.attempts + 1);
      } catch (e) {
        _ops[idx] = op.copyWith(
          state: OpState.failed,
          attempts: op.attempts + 1,
          error: e.toString(),
        );
      }
      await _persist();
      notifyListeners();
    }
    // Bersihkan yang sudah SYNCED agar banner hilang.
    _ops.removeWhere((o) => o.state == OpState.synced);
    await _persist();
    _syncing = false;
    notifyListeners();
  }

  Future<void> retryFailed() async {
    for (var i = 0; i < _ops.length; i++) {
      if (_ops[i].state == OpState.failed) {
        _ops[i] = _ops[i].copyWith(state: OpState.pendingSync, error: null);
      }
    }
    await _persist();
    notifyListeners();
    await syncAll();
  }

  Future<void> setOnlineForTest(bool value) async {
    _online = value;
    notifyListeners();
  }
}
