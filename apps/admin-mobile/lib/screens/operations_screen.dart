/// Layar Operasi: alur lapangan per event — produksi, muat, berangkat,
/// tiba, kehadiran tim, rekonsiliasi peralatan. Satu ketuk per langkah.
library;

import 'package:flutter/material.dart';

import '../api.dart';
import '../offline.dart';
import '../widgets/big_action_button.dart';
import '../widgets/status_pill.dart';
import '../widgets/sync_banner.dart';

class OperationsScreen extends StatefulWidget {
  final String eventId;
  final String eventTitle;
  const OperationsScreen({
    super.key,
    required this.eventId,
    this.eventTitle = '',
  });

  @override
  State<OperationsScreen> createState() => _OperationsScreenState();
}

class _OperationsScreenState extends State<OperationsScreen> {
  List<Map<String, dynamic>> _batches = [];
  List<Map<String, dynamic>> _transport = [];
  List<Map<String, dynamic>> _assign = [];
  List<Map<String, dynamic>> _recon = [];
  bool _loading = true;
  String? _error;
  String? _notice;
  bool _acting = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = ApiService.instance;
      final batches = await api.fetchBatchesForEvent(widget.eventId);
      final transport = await api.fetchTransportTasks(widget.eventId);
      final assign = await api.fetchAssignments(widget.eventId);
      final recon = await api.fetchReconciliation(widget.eventId);
      if (!mounted) return;
      setState(() {
        _batches = batches;
        _transport = transport;
        _assign = assign;
        _recon = recon;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _op(String label, OpType type, Map<String, dynamic> payload,
      {Future<void> Function()? after}) async {
    setState(() {
      _acting = true;
      _notice = null;
    });
    final ok = await OfflineStore.instance.runOrQueue(type, label, payload);
    if (!mounted) return;
    setState(() {
      _acting = false;
      _notice = ok
          ? 'Tersimpan di server ✓'
          : 'Tersimpan offline, menunggu sinkron.';
    });
    await _load();
    await after?.call();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Operasi — ${widget.eventTitle}')),
      body: Column(
        children: [
          SyncBanner(
            store: OfflineStore.instance,
            onRetry: () => OfflineStore.instance.retryFailed(),
          ),
          if (_notice != null)
            Container(
              width: double.infinity,
              color: const Color(0xFF15803D),
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              child: Text(
                _notice!,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(_error!),
                            const SizedBox(height: 12),
                            FilledButton(
                              onPressed: _load,
                              child: const Text('Muat Ulang'),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView(
                          padding: const EdgeInsets.all(14),
                          children: [
                            _SectionTitle('Produksi (${_batches.length} batch)'),
                            if (_batches.isEmpty)
                              const Card(
                                child: Padding(
                                  padding: EdgeInsets.all(14),
                                  child: Text('Belum ada batch produksi.'),
                                ),
                              ),
                            for (final b in _batches)
                              Card(
                                child: ListTile(
                                  title: Text(
                                    (b['name'] ?? '') as String,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  subtitle: Text(
                                    'Target ${b['target_qty']} · aktual ${b['actual_qty'] ?? '—'}',
                                  ),
                                  trailing: StatusPill(
                                    status:
                                        (b['status'] ?? '') as String,
                                  ),
                                ),
                              ),
                            const SizedBox(height: 10),
                            _SectionTitle('Transport'),
                            if (_transport.isEmpty)
                              const Card(
                                child: Padding(
                                  padding: EdgeInsets.all(14),
                                  child:
                                      Text('Belum ada tugas transport.'),
                                ),
                              ),
                            for (final t in _transport)
                              Card(
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              (t['kind'] ?? 'Pengiriman')
                                                  as String,
                                              style: const TextStyle(
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                          ),
                                          StatusPill(
                                            status:
                                                (t['status'] ?? '') as String,
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      Row(
                                        children: [
                                          Expanded(
                                            child: BigActionButton(
                                              label: 'Berangkat',
                                              subtitle: 'Catat waktu',
                                              icon: Icons
                                                  .local_shipping_outlined,
                                              loading: _acting,
                                              onPressed: (t['departed_at'] !=
                                                      null)
                                                  ? null
                                                  : () => _op(
                                                        'Berangkat ${widget.eventTitle}',
                                                        OpType.transportUpdate,
                                                        {
                                                          'transport_id':
                                                              t['id'],
                                                          'patch': {
                                                            'departed_at': DateTime
                                                                    .now()
                                                                .toIso8601String(),
                                                            'status':
                                                                'DEPARTED',
                                                          },
                                                        },
                                                      ),
                                            ),
                                          ),
                                          const SizedBox(width: 10),
                                          Expanded(
                                            child: BigActionButton(
                                              label: 'Tiba',
                                              subtitle: 'Catat waktu',
                                              icon: Icons
                                                  .location_on_outlined,
                                              loading: _acting,
                                              onPressed: (t['departed_at'] ==
                                                          null ||
                                                      t['arrived_at'] !=
                                                          null)
                                                  ? null
                                                  : () => _op(
                                                        'Tiba ${widget.eventTitle}',
                                                        OpType.transportUpdate,
                                                        {
                                                          'transport_id':
                                                              t['id'],
                                                          'patch': {
                                                            'arrived_at': DateTime
                                                                    .now()
                                                                .toIso8601String(),
                                                            'status':
                                                                'ARRIVED',
                                                          },
                                                        },
                                                      ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            const SizedBox(height: 10),
                            _SectionTitle(
                                'Kehadiran tim (${_assign.length})'),
                            if (_assign.isEmpty)
                              const Card(
                                child: Padding(
                                  padding: EdgeInsets.all(14),
                                  child: Text('Belum ada penugasan.'),
                                ),
                              ),
                            for (final a in _assign)
                              Card(
                                child: ListTile(
                                  title: Text(
                                    ((a['staff'] as Map?)?['name'] ?? '—')
                                        as String,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  subtitle: Text(
                                      (a['role'] ?? '') as String),
                                  trailing: FilledButton(
                                    onPressed: _acting
                                        ? null
                                        : () => _op(
                                              'Hadir ${(a['staff'] as Map?)?['name']}',
                                              OpType.attendance,
                                              {
                                                'assignment_id': a['id'],
                                                'present': true,
                                              },
                                            ),
                                    child: const Text('Hadir'),
                                  ),
                                ),
                              ),
                            const SizedBox(height: 10),
                            _SectionTitle('Peralatan (rekonsiliasi)'),
                            if (_recon.isEmpty)
                              const Card(
                                child: Padding(
                                  padding: EdgeInsets.all(14),
                                  child: Text('Belum ada data rekonsiliasi.'),
                                ),
                              ),
                            for (final r in _recon)
                              Card(
                                child: ListTile(
                                  title: Text(
                                    (((r['equipment'] as Map?)?['name']) ??
                                            'Peralatan') as String,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  subtitle: Text(
                                    'Dibawa ${r['assigned']} · kembali ${r['returned']}',
                                  ),
                                  trailing: GenericPill(
                                    text: (r['missing'] ?? 0) as int > 0
                                        ? 'Hilang ${r['missing']}'
                                        : 'Lengkap ✓',
                                    good: ((r['missing'] ?? 0) as int) == 0,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6, top: 4),
      child: Text(
        text,
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
      ),
    );
  }
}
