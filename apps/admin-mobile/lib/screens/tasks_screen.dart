/// Layar Tugas: checklist setup/service/breakdown + packing per event.
/// Minim ketik: centang, stepper jumlah, foto bukti. Semua mutasi lewat
/// OfflineStore (online → langsung; offline → antre + banner).
library;

import 'package:flutter/material.dart';

import '../api.dart';
import '../config.dart';
import '../offline.dart';
import '../widgets/photo_evidence_button.dart';
import '../widgets/status_pill.dart';
import '../widgets/sync_banner.dart';
import 'incident_report_screen.dart';

class TasksScreen extends StatefulWidget {
  final String? eventId;
  final String eventTitle;
  const TasksScreen({super.key, this.eventId, this.eventTitle = ''});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  String? _eventId;
  String _eventTitle = '';
  List<Map<String, dynamic>> _events = [];
  List<Map<String, dynamic>> _setup = [];
  List<Map<String, dynamic>> _service = [];
  List<Map<String, dynamic>> _breakdown = [];
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  String? _error;
  String? _notice;

  static const _tables = ['setup_tasks', 'service_tasks', 'breakdown_tasks'];

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 4, vsync: this);
    _eventId = widget.eventId;
    _eventTitle = widget.eventTitle;
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = ApiService.instance;
      final upcoming = await api.fetchUpcomingEvents(limit: 20);
      List<Map<String, dynamic>> setup = [];
      List<Map<String, dynamic>> service = [];
      List<Map<String, dynamic>> breakdown = [];
      List<Map<String, dynamic>> items = [];
      if (_eventId != null) {
        setup = await api.fetchSetupTasks(_eventId!);
        service = await api.fetchServiceTasks(_eventId!);
        breakdown = await api.fetchBreakdownTasks(_eventId!);
        items = await api.fetchEventItems(_eventId!);
        if (_eventTitle.isEmpty) {
          final ev = await api.fetchEvent(_eventId!);
          _eventTitle = (ev?['title'] ?? '') as String;
        }
      }
      if (!mounted) return;
      setState(() {
        _events = upcoming;
        _setup = setup;
        _service = service;
        _breakdown = breakdown;
        _items = items;
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

  Future<void> _toggle(String table, Map<String, dynamic> row) async {
    final id = (row['id'] ?? '') as String;
    final done = !(row['done'] == true);
    final ok = await OfflineStore.instance.runOrQueue(
      OpType.taskToggle,
      '${done ? 'Centang' : 'Batalkan'} ${row['label']}',
      {'table': table, 'row_id': id, 'done': done},
    );
    if (!mounted) return;
    setState(() {
      _notice = ok
          ? 'Tersimpan di server ✓'
          : 'Tersimpan offline, menunggu sinkron.';
    });
    await _load();
  }

  Future<void> _bumpItem(Map<String, dynamic> row, num delta) async {
    final id = (row['id'] ?? '') as String;
    final cur = (row['packed_qty'] ?? 0) as num;
    final next = (cur + delta).clamp(0, 1000000);
    final ok = await OfflineStore.instance.runOrQueue(
      OpType.packedQty,
      'Packing ${row['name']}: $next',
      {'item_id': id, 'qty': next},
    );
    if (!mounted) return;
    setState(() {
      _notice = ok
          ? 'Tersimpan di server ✓'
          : 'Tersimpan offline, menunggu sinkron.';
    });
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          _eventId == null ? 'Tugas' : 'Tugas — $_eventTitle',
        ),
      ),
      body: Column(
        children: [
          SyncBanner(
            store: OfflineStore.instance,
            onRetry: () => OfflineStore.instance.retryFailed(),
          ),
          if (_eventId == null)
            Expanded(child: _EventPicker(events: _events, onPick: (id, title) {
              setState(() {
                _eventId = id;
                _eventTitle = title;
              });
              _load();
            }, loading: _loading, error: _error))
          else if (_loading)
            const Expanded(
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_error != null)
            Expanded(
              child: Center(
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
              ),
            )
          else
            Expanded(
              child: Column(
                children: [
                  if (_notice != null)
                    Container(
                      width: double.infinity,
                      color: AppColors.success,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 8,
                      ),
                      child: Text(
                        _notice!,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  TabBar(
                    controller: _tabs,
                    labelColor: AppColors.ink,
                    tabs: const [
                      Tab(text: 'Setup'),
                      Tab(text: 'Layanan'),
                      Tab(text: 'Beres'),
                      Tab(text: 'Packing'),
                    ],
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(14, 8, 14, 0),
                    child: OutlinedButton.icon(
                      onPressed: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => IncidentReportScreen(
                            eventId: _eventId,
                            eventTitle: _eventTitle,
                          ),
                        ),
                      ),
                      icon: const Icon(Icons.report_problem_outlined),
                      label: const Text('Lapor insiden event ini'),
                    ),
                  ),
                  Expanded(
                    child: TabBarView(
                      controller: _tabs,
                      children: [
                        _TaskList(
                          table: _tables[0],
                          rows: _setup,
                          onToggle: _toggle,
                        ),
                        _TaskList(
                          table: _tables[1],
                          rows: _service,
                          onToggle: _toggle,
                        ),
                        _TaskList(
                          table: _tables[2],
                          rows: _breakdown,
                          onToggle: _toggle,
                        ),
                        _PackingList(items: _items, onBump: _bumpItem),
                      ],
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _EventPicker extends StatelessWidget {
  final List<Map<String, dynamic>> events;
  final void Function(String id, String title) onPick;
  final bool loading;
  final String? error;
  const _EventPicker({
    required this.events,
    required this.onPick,
    required this.loading,
    required this.error,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (error != null) {
      return Center(child: Text(error!));
    }
    if (events.isEmpty) {
      return const Center(child: Text('Tidak ada event mendatang.'));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(14),
      itemCount: events.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (context, i) {
        final e = events[i];
        return Card(
          child: ListTile(
            title: Text(
              '${e['event_no'] ?? ''} — ${e['title'] ?? ''}',
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            subtitle: Text('${e['event_date'] ?? ''}'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => onPick(
              (e['id'] ?? '') as String,
              (e['title'] ?? '') as String,
            ),
          ),
        );
      },
    );
  }
}

class _TaskList extends StatelessWidget {
  final String table;
  final List<Map<String, dynamic>> rows;
  final Future<void> Function(String table, Map<String, dynamic> row)
      onToggle;
  const _TaskList({
    required this.table,
    required this.rows,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    if (rows.isEmpty) {
      return const Center(child: Text('Belum ada tugas di seksi ini.'));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(14),
      itemCount: rows.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (context, i) {
        final r = rows[i];
        final done = r['done'] == true;
        return Card(
          child: CheckboxListTile(
            value: done,
            onChanged: (_) => onToggle(table, r),
            title: Text(
              (r['label'] ?? '') as String,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                decoration: done ? TextDecoration.lineThrough : null,
              ),
            ),
            subtitle: (r['photo_url'] ?? '') != ''
                ? const Text('Ada foto bukti ✓',
                    style: TextStyle(color: AppColors.success))
                : const Text('Belum ada foto bukti'),
            secondary: PhotoEvidenceButton(
              filePrefix: 'tugas',
              onUploaded: (url) async {
                await ApiService.instance
                    .toggleTaskPhoto(table, (r['id'] ?? '') as String, url);
              },
            ),
          ),
        );
      },
    );
  }
}

class _PackingList extends StatelessWidget {
  final List<Map<String, dynamic>> items;
  final Future<void> Function(Map<String, dynamic> row, num delta) onBump;
  const _PackingList({required this.items, required this.onBump});

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const Center(child: Text('Belum ada item packing.'));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(14),
      itemCount: items.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (context, i) {
        final r = items[i];
        final packed = (r['packed_qty'] ?? 0) as num;
        final req = r['required_qty'] as num?;
        final short = req != null && packed < req;
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        (r['name'] ?? '') as String,
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                    GenericPill(
                      text: short ? 'Kurang ${req - packed}' : 'Lengkap ✓',
                      good: !short,
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '$packed / ${req ?? '?'} ${r['unit'] ?? ''}',
                  style: const TextStyle(fontSize: 16),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => onBump(r, -1),
                        child: const Text('− Kurang', style: TextStyle(fontSize: 16)),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: FilledButton(
                        onPressed: () => onBump(r, 1),
                        child: const Text('+ Tambah', style: TextStyle(fontSize: 16)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
