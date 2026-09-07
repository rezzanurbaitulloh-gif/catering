/// Lapisan akses data Supabase (REST via supabase_flutter).
///
/// Mirror kontrak di packages/api/src/index.ts:
/// POST /api/events/:id/transition, /production/:id/transition,
/// /incidents, /incidents/:id/transition, /events/:id/handover.
/// Tabel: events, event_items, transport_tasks, setup_tasks,
/// service_tasks, breakdown_tasks, production_batches,
/// incidents, incident_evidence, staff_attendance,
/// equipment_reconciliation, notifications.
library;

import 'dart:io';

import 'package:supabase_flutter/supabase_flutter.dart';

import 'config.dart';
import 'offline.dart';

/// Guard client-side yang mirror DB trigger `trg_event_transition`.
/// Transisi invalid tetap ditolak server; guard ini cegah tap sia-sia.
class EventFlow {
  static const Map<String, List<String>> allowed = {
    'PLANNING': ['LOCKED', 'IN_PREPARATION'],
    'LOCKED': ['IN_PREPARATION'],
    'IN_PREPARATION': ['IN_TRANSIT'],
    'IN_TRANSIT': ['SETUP'],
    'SETUP': ['SERVICE'],
    'SERVICE': ['BREAKDOWN'],
    'BREAKDOWN': ['COMPLETED'],
    'COMPLETED': ['CLOSED'],
  };

  static List<String> nextStatuses(String current) =>
      List.unmodifiable(allowed[current] ?? const []);

  static bool canTransition(String from, String to) =>
      (allowed[from] ?? const []).contains(to);

  static const labels = {
    'PLANNING': 'Perencanaan',
    'LOCKED': 'Pax Terkunci',
    'IN_PREPARATION': 'Persiapan',
    'IN_TRANSIT': 'Di Jalan',
    'SETUP': 'Setup',
    'SERVICE': 'Layanan',
    'BREAKDOWN': 'Beres-beres',
    'COMPLETED': 'Selesai',
    'CLOSED': 'Ditutup',
  };

  static String labelOf(String status) => labels[status] ?? status;
}

/// Aksi besar per status — tombol utama di detail event.
/// (label, statusTujuan, ikon)
class EventAction {
  final String label;
  final String to;
  final String hint;
  const EventAction(this.label, this.to, this.hint);
}

const Map<String, List<EventAction>> eventActions = {
  'IN_PREPARATION': [
    EventAction('Berangkat ke Venue', 'IN_TRANSIT',
        'Armada + tim + peralatan sudah dimuat?'),
  ],
  'IN_TRANSIT': [
    EventAction(
        'Tiba di Venue', 'SETUP', 'Foto kondisi venue sebelum setup.'),
  ],
  'SETUP': [
    EventAction(
        'Setup Selesai', 'SERVICE', 'Semua checklist setup centang hijau?'),
  ],
  'SERVICE': [
    EventAction('Layanan Selesai', 'BREAKDOWN',
        'Prasmanan ditutup & tamu selesai?'),
  ],
  'BREAKDOWN': [
    EventAction('Breakdown Selesai', 'COMPLETED',
        'Peralatan terhitung & venue bersih?'),
  ],
  'COMPLETED': [
    EventAction('Tutup Event', 'CLOSED', 'Rekonsiliasi & pembayaran beres?'),
  ],
};

class ApiService {
  ApiService._();
  static final ApiService instance = ApiService._();

  SupabaseClient get _db => Supabase.instance.client;
  bool get isConfigured => Config.isConfigured;
  bool get isSignedIn => _db.auth.currentUser != null;

  // ---------- events ----------

  Future<List<Map<String, dynamic>>> fetchTodayEvents() async {
    final now = DateTime.now();
    final start = DateTime(now.year, now.month, now.day);
    final end = start.add(const Duration(days: 1));
    final rows = await _db
        .from('events')
        .select('id, event_no, title, event_type, event_date, start_at, '
            'venue_text, pax_confirmed, pax_final, status, payment_status')
        .gte('event_date', start.toIso8601String().substring(0, 10))
        .lt('event_date', end.toIso8601String().substring(0, 10))
        .order('start_at', ascending: true);
    return List<Map<String, dynamic>>.from(rows);
  }

  Future<List<Map<String, dynamic>>> fetchUpcomingEvents({int limit = 30}) async {
    final today = DateTime.now().toIso8601String().substring(0, 10);
    final rows = await _db
        .from('events')
        .select('id, event_no, title, event_type, event_date, start_at, '
            'venue_text, pax_confirmed, pax_final, status, payment_status')
        .gte('event_date', today)
        .order('event_date', ascending: true)
        .limit(limit);
    return List<Map<String, dynamic>>.from(rows);
  }

  Future<Map<String, dynamic>?> fetchEvent(String id) async {
    final row =
        await _db.from('events').select().eq('id', id).maybeSingle();
    return row;
  }

  Future<void> transitionEvent(String eventId, String from, String to) async {
    if (!EventFlow.canTransition(from, to)) {
      throw StateError('Transisi tidak valid: $from → $to');
    }
    await _db.from('events').update({'status': to}).eq('id', eventId);
  }

  // ---------- checklist items ----------

  Future<List<Map<String, dynamic>>> fetchEventItems(String eventId) async {
    final rows = await _db
        .from('event_items')
        .select()
        .eq('event_id', eventId)
        .order('name', ascending: true);
    return List<Map<String, dynamic>>.from(rows);
  }

  Future<void> updatePackedQty(String itemId, num qty) async {
    await _db
        .from('event_items')
        .update({'packed_qty': qty}).eq('id', itemId);
  }

  Future<List<Map<String, dynamic>>> _fetchTasks(
      String table, String eventId) async {
    final rows = await _db
        .from(table)
        .select()
        .eq('event_id', eventId)
        .order('label', ascending: true);
    return List<Map<String, dynamic>>.from(rows);
  }

  Future<List<Map<String, dynamic>>> fetchSetupTasks(String eventId) =>
      _fetchTasks('setup_tasks', eventId);
  Future<List<Map<String, dynamic>>> fetchServiceTasks(String eventId) =>
      _fetchTasks('service_tasks', eventId);
  Future<List<Map<String, dynamic>>> fetchBreakdownTasks(String eventId) =>
      _fetchTasks('breakdown_tasks', eventId);

  Future<void> toggleTask(String table, String id, bool done) async {
    await _db.from(table).update({
      'done': done,
      'done_at': done ? DateTime.now().toIso8601String() : null,
    }).eq('id', id);
  }

  Future<void> toggleTaskPhoto(String table, String id, String photoUrl) async {
    await _db.from(table).update({'photo_url': photoUrl}).eq('id', id);
  }

  // ---------- transport / handover ----------

  Future<List<Map<String, dynamic>>> fetchTransportTasks(
      String eventId) async {
    final rows = await _db
        .from('transport_tasks')
        .select()
        .eq('event_id', eventId);
    return List<Map<String, dynamic>>.from(rows);
  }

  Future<void> updateTransport(String id, Map<String, dynamic> patch) async {
    await _db.from('transport_tasks').update(patch).eq('id', id);
  }

  /// POST /api/events/:id/handover — serah terima ke penerima venue.
  Future<void> handover({
    required String eventId,
    required String transportId,
    required String receiverName,
    required String photoUrl,
    required String note,
  }) async {
    await _db.from('transport_tasks').update({
      'receiver_name': receiverName,
      'photo_url': photoUrl,
      'note': note,
      'arrived_at': DateTime.now().toIso8601String(),
      'status': 'ARRIVED',
    }).eq('id', transportId);
  }

  // ---------- production ----------

  Future<List<Map<String, dynamic>>> fetchBatchesForEvent(
      String eventId) async {
    final plans = await _db
        .from('production_plans')
        .select('id')
        .eq('event_id', eventId);
    final planIds =
        List<Map<String, dynamic>>.from(plans).map((p) => p['id']).toList();
    if (planIds.isEmpty) return [];
    final rows = await _db
        .from('production_batches')
        .select()
        .inFilter('plan_id', planIds)
        .order('name', ascending: true);
    return List<Map<String, dynamic>>.from(rows);
  }

  Future<void> transitionBatch(String batchId, String to) async {
    await _db.from('production_batches').update({'status': to}).eq('id', batchId);
  }

  // ---------- attendance ----------

  Future<List<Map<String, dynamic>>> fetchAssignments(String eventId) async {
    final rows = await _db
        .from('staff_assignments')
        .select('id, role, staff:staff_id (id, name, role, phone)')
        .eq('event_id', eventId);
    return List<Map<String, dynamic>>.from(rows);
  }

  Future<void> markAttendance({
    required String assignmentId,
    required bool present,
    String? note,
  }) async {
    await _db.from('staff_attendance').insert({
      'assignment_id': assignmentId,
      'present': present,
      'note': note,
    });
  }

  // ---------- equipment reconciliation ----------

  Future<List<Map<String, dynamic>>> fetchReconciliation(
      String eventId) async {
    final rows = await _db
        .from('equipment_reconciliation')
        .select('*, equipment:equipment_id (id, name)')
        .eq('event_id', eventId);
    return List<Map<String, dynamic>>.from(rows);
  }

  Future<void> updateReconciliation(
      String id, Map<String, dynamic> patch) async {
    await _db.from('equipment_reconciliation').update(patch).eq('id', id);
  }

  // ---------- incidents ----------

  Future<List<Map<String, dynamic>>> fetchIncidents({int limit = 30}) async {
    final rows = await _db
        .from('incidents')
        .select('id, incident_no, title, category, severity, status, '
            'event_id, created_at')
        .order('created_at', ascending: false)
        .limit(limit);
    return List<Map<String, dynamic>>.from(rows);
  }

  /// POST /api/incidents — nomor dibuat server-side sederhana (timestamp).
  Future<String> createIncident({
    String? eventId,
    required String category,
    required String severity,
    required String title,
    required String description,
    required String businessId,
  }) async {
    final row = await _db.from('incidents').insert({
      'business_id': businessId,
      'event_id': eventId,
      'incident_no':
          'INC-${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}',
      'category': category,
      'severity': severity,
      'title': title,
      'description': description,
    }).select('id').single();
    return (row['id'] ?? '').toString();
  }

  Future<void> addIncidentEvidence({
    required String incidentId,
    required String photoUrl,
    String? caption,
  }) async {
    await _db.from('incident_evidence').insert({
      'incident_id': incidentId,
      'photo_url': photoUrl,
      'caption': caption,
    });
  }

  // ---------- notifications ----------

  Future<List<Map<String, dynamic>>> fetchNotifications(
      {int limit = 30}) async {
    final uid = _db.auth.currentUser?.id;
    var query = _db.from('notifications').select();
    if (uid != null) query = query.eq('user_id', uid);
    final rows = await query
        .order('created_at', ascending: false)
        .limit(limit);
    return List<Map<String, dynamic>>.from(rows);
  }

  Future<void> markNotificationRead(String id) async {
    await _db.from('notifications').update(
        {'read_at': DateTime.now().toIso8601String()}).eq('id', id);
  }

  // ---------- storage ----------

  /// Upload foto ke bucket 'evidence', kembalikan public URL.
  Future<String> uploadEvidence(File file, String name) async {
    final path =
        '${DateTime.now().toIso8601String().substring(0, 10)}/$name';
    await _db.storage.from(Config.evidenceBucket).upload(
          path,
          file,
          fileOptions: const FileOptions(upsert: true),
        );
    return _db.storage.from(Config.evidenceBucket).getPublicUrl(path);
  }

  // ---------- offline executor ----------

  /// Eksekusi satu op offline yang tertunda. Dipanggil OfflineStore saat sync.
  /// Hanya melempar jika server benar-benar gagal — pemanggil yang
  /// mengubah status op menjadi SYNCED/FAILED.
  Future<void> executeOp(PendingOp op) async {
    final p = op.payload;
    switch (op.type) {
      case OpType.eventTransition:
        await transitionEvent(
          p['event_id'] as String,
          p['from'] as String,
          p['to'] as String,
        );
      case OpType.taskToggle:
        await toggleTask(
          p['table'] as String,
          p['row_id'] as String,
          p['done'] as bool,
        );
      case OpType.packedQty:
        await updatePackedQty(
          p['item_id'] as String,
          p['qty'] as num,
        );
      case OpType.transportUpdate:
        await updateTransport(
          p['transport_id'] as String,
          Map<String, dynamic>.from(p['patch'] as Map),
        );
      case OpType.attendance:
        await markAttendance(
          assignmentId: p['assignment_id'] as String,
          present: p['present'] as bool,
          note: p['note'] as String?,
        );
      case OpType.reconciliation:
        await updateReconciliation(
          p['recon_id'] as String,
          Map<String, dynamic>.from(p['patch'] as Map),
        );
      case OpType.handover:
        await handover(
          eventId: p['event_id'] as String,
          transportId: p['transport_id'] as String,
          receiverName: p['receiver_name'] as String,
          photoUrl: (p['photo_url'] ?? '') as String,
          note: (p['note'] ?? '') as String,
        );
    }
  }
}
