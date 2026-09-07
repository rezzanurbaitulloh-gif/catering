/// Detail event: tab seksi + tombol aksi besar yang hanya menawarkan
/// transisi VALID (guard mirror DB trigger; server tetap menolak sisanya).
library;

import 'package:flutter/material.dart';

import '../api.dart';
import '../offline.dart';
import '../widgets/big_action_button.dart';
import '../widgets/status_pill.dart';
import 'handover_screen.dart';
import 'operations_screen.dart';
import 'tasks_screen.dart';

class EventDetailScreen extends StatefulWidget {
  final String eventId;
  const EventDetailScreen({super.key, required this.eventId});

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  Map<String, dynamic>? _event;
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  String? _error;
  bool _acting = false;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
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
      final event = await ApiService.instance.fetchEvent(widget.eventId);
      final items =
          await ApiService.instance.fetchEventItems(widget.eventId);
      if (!mounted) return;
      setState(() {
        _event = event;
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

  Future<void> _doTransition(String to) async {
    final from = (_event?['status'] ?? '') as String;
    if (!EventFlow.canTransition(from, to)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Transisi $from → $to tidak valid.')),
      );
      return;
    }
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(EventFlow.labelOf(to)),
        content: Text(
          'Ubah status "${_event?['title']}" dari '
          '${EventFlow.labelOf(from)} ke ${EventFlow.labelOf(to)}?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('BATAL'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('YA, LANJUT'),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    setState(() => _acting = true);
    final ok = await OfflineStore.instance.runOrQueue(
      OpType.eventTransition,
      'Status ${_event?['event_no']}: $from → $to',
      {'event_id': widget.eventId, 'from': from, 'to': to},
    );
    if (!mounted) return;
    setState(() => _acting = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          ok
              ? 'Status server: ${EventFlow.labelOf(to)} ✓'
              : 'Tersimpan offline — terkirim otomatis saat online.',
        ),
      ),
    );
    if (ok) await _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text((_event?['title'] ?? 'Detail Event') as String),
        bottom: TabBar(
          controller: _tabs,
          tabs: const [
            Tab(text: 'Ringkasan', icon: Icon(Icons.info, size: 20)),
            Tab(text: 'Menu', icon: Icon(Icons.restaurant, size: 20)),
            Tab(text: 'Aksi', icon: Icon(Icons.bolt, size: 20)),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
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
              : TabBarView(
                  controller: _tabs,
                  children: [
                    _SummaryTab(
                      event: _event!,
                      onOpenTasks: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => TasksScreen(
                            eventId: widget.eventId,
                            eventTitle:
                                (_event?['title'] ?? '') as String,
                          ),
                        ),
                      ),
                      onOpenOps: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => OperationsScreen(
                            eventId: widget.eventId,
                            eventTitle:
                                (_event?['title'] ?? '') as String,
                          ),
                        ),
                      ),
                      onOpenHandover: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => HandoverScreen(
                            eventId: widget.eventId,
                            eventTitle:
                                (_event?['title'] ?? '') as String,
                          ),
                        ),
                      ),
                    ),
                    _MenuTab(items: _items),
                    _ActionsTab(
                      status: (_event?['status'] ?? '') as String,
                      acting: _acting,
                      onGo: _doTransition,
                    ),
                  ],
                ),
    );
  }
}

class _SummaryTab extends StatelessWidget {
  final Map<String, dynamic> event;
  final VoidCallback onOpenTasks;
  final VoidCallback onOpenOps;
  final VoidCallback onOpenHandover;
  const _SummaryTab({
    required this.event,
    required this.onOpenTasks,
    required this.onOpenOps,
    required this.onOpenHandover,
  });

  @override
  Widget build(BuildContext context) {
    String v(String k) => '${event[k] ?? '-'}';
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        v('title'),
                        style: Theme.of(context)
                            .textTheme
                            .titleLarge
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                    ),
                    StatusPill(status: v('status')),
                  ],
                ),
                const SizedBox(height: 8),
                Text('${v('event_no')} • ${v('event_type')}'),
                Text('Tanggal: ${v('event_date')} • ${v('start_at')}'),
                Text('Venue: ${v('venue_text')}'),
                Text(
                  'Pax: ${event['pax_final'] ?? event['pax_confirmed'] ?? '-'} '
                  '• Bayar: ${v('payment_status')}',
                ),
                if ((event['special_instructions'] ?? '') != '') ...[
                  const SizedBox(height: 8),
                  Text(
                    'Instruksi: ${event['special_instructions']}',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ],
                if ((event['dietary_notes'] ?? '') != '') ...[
                  Text('Diet: ${event['dietary_notes']}'),
                ],
                if ((event['allergies'] as List?)?.isNotEmpty ?? false) ...[
                  Text(
                    '⚠ Alergi: ${(event['allergies'] as List).join(', ')}',
                    style: const TextStyle(
                      color: Colors.red,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        BigActionButton(
          label: 'Checklist Tugas',
          subtitle: 'Setup • layanan • breakdown',
          icon: Icons.checklist,
          onPressed: onOpenTasks,
        ),
        const SizedBox(height: 8),
        BigActionButton(
          label: 'Operasi Lapangan',
          subtitle: 'Produksi → absensi → rekonsiliasi',
          icon: Icons.local_shipping,
          onPressed: onOpenOps,
        ),
        const SizedBox(height: 8),
        BigActionButton(
          label: 'Serah Terima',
          subtitle: 'Penerima + foto + jumlah',
          icon: Icons.handshake,
          onPressed: onOpenHandover,
        ),
      ],
    );
  }
}

class _MenuTab extends StatelessWidget {
  final List<Map<String, dynamic>> items;
  const _MenuTab({required this.items});

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const Center(
        child: Text('Belum ada item menu untuk event ini.'),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      itemBuilder: (context, i) {
        final it = items[i];
        return Card(
          child: ListTile(
            title: Text(
              (it['name'] ?? '-') as String,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            subtitle: Text(
              'Butuh: ${it['required_qty'] ?? it['qty'] ?? '-'} ${it['unit'] ?? ''} • '
              'Terkemas: ${it['packed_qty'] ?? 0}',
            ),
            trailing: GenericPill(
              text: '${it['category'] ?? ''}',
              good: true,
            ),
          ),
        );
      },
    );
  }
}

class _ActionsTab extends StatelessWidget {
  final String status;
  final bool acting;
  final void Function(String to) onGo;
  const _ActionsTab({
    required this.status,
    required this.acting,
    required this.onGo,
  });

  @override
  Widget build(BuildContext context) {
    final actions = eventActions[status] ?? const [];
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Status saat ini: ${EventFlow.labelOf(status)}',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
        ),
        const SizedBox(height: 12),
        if (actions.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Text(
                'Tidak ada aksi lanjutan untuk status ini. '
                'Tutup layar bila pekerjaan selesai.',
              ),
            ),
          )
        else
          for (final a in actions) ...[
            BigActionButton(
              label: a.label,
              subtitle: a.hint,
              loading: acting,
              onPressed: acting ? null : () => onGo(a.to),
            ),
            const SizedBox(height: 10),
          ],
        const SizedBox(height: 8),
        Text(
          'Setiap aksi meminta konfirmasi dan hanya terkirim '
          'bila server menerima (atau antre offline).',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}
