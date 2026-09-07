/// Daftar event + pemindai QR premium.
library;

import 'package:flutter/material.dart';

import '../api.dart';
import '../widgets/status_pill.dart';
import '../widgets/sync_banner.dart';
import '../offline.dart';
import 'qr_scan_screen.dart';

class EventsListScreen extends StatefulWidget {
  final void Function(String eventId) openEvent;
  const EventsListScreen({super.key, required this.openEvent});

  @override
  State<EventsListScreen> createState() => _EventsListScreenState();
}

class _EventsListScreenState extends State<EventsListScreen> {
  List<Map<String, dynamic>> _events = [];
  bool _loading = true;
  String? _error;
  String _filter = 'SEMUA';

  static const _filters = ['SEMUA', 'HARI INI', 'AKTIF', 'SELESAI'];

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
      final events = await ApiService.instance.fetchUpcomingEvents(limit: 50);
      if (!mounted) return;
      setState(() {
        _events = events;
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

  List<Map<String, dynamic>> get _visible {
    final today = DateTime.now().toIso8601String().substring(0, 10);
    switch (_filter) {
      case 'HARI INI':
        return _events
            .where((e) => (e['event_date'] as String?) == today)
            .toList();
      case 'AKTIF':
        return _events
            .where((e) => !{'COMPLETED', 'CLOSED'}.contains(e['status']))
            .toList();
      case 'SELESAI':
        return _events
            .where((e) => {'COMPLETED', 'CLOSED'}.contains(e['status']))
            .toList();
      default:
        return _events;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SyncBanner(
          store: OfflineStore.instance,
          onRetry: () => OfflineStore.instance.retryFailed(),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Row(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      for (final f in _filters)
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(f),
                            selected: _filter == f,
                            onSelected: (_) =>
                                setState(() => _filter = f),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              IconButton.filledTonal(
                tooltip: 'Scan QR event',
                icon: const Icon(Icons.qr_code_scanner),
                onPressed: () async {
                  final id = await Navigator.of(context).push<String>(
                    MaterialPageRoute(
                      builder: (_) => const QrScanScreen(),
                    ),
                  );
                  if (id != null && id.isNotEmpty && context.mounted) {
                    widget.openEvent(id);
                  }
                },
              ),
            ],
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.cloud_off, size: 44),
                            const SizedBox(height: 8),
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
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _visible.length,
                        itemBuilder: (context, i) {
                          final e = _visible[i];
                          return Card(
                            child: ListTile(
                              title: Text(
                                (e['title'] ?? '-') as String,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              subtitle: Text(
                                '${e['event_no'] ?? ''} • '
                                '${e['event_date'] ?? ''}\n'
                                '${(e['venue_text'] ?? '') as String} • '
                                'Pax ${e['pax_confirmed'] ?? e['pax_final'] ?? '-'} • '
                                '${e['payment_status'] ?? ''}',
                              ),
                              isThreeLine: true,
                              trailing: StatusPill(
                                status: (e['status'] ?? '') as String,
                              ),
                              onTap: () => widget.openEvent(
                                (e['id'] ?? '') as String,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
        ),
      ],
    );
  }
}
