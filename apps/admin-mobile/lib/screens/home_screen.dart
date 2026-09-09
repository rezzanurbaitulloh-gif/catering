/// Beranda: ringkasan operasi hari ini + aksi cepat (minim ketik).
library;

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../api.dart';
import '../offline.dart';
import '../widgets/status_pill.dart';
import '../widgets/sync_banner.dart';

class HomeScreen extends StatefulWidget {
  final void Function(int tab) goTab;
  final void Function(String eventId) openEvent;
  const HomeScreen({super.key, required this.goTab, required this.openEvent});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Map<String, dynamic>> _events = [];
  bool _loading = true;
  String? _error;

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
      final events = await ApiService.instance.fetchTodayEvents();
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

  @override
  Widget build(BuildContext context) {
    final today = DateFormat('EEEE, d MMMM yyyy', 'id_ID').format(
      DateTime.now(),
    );
    return Column(
      children: [
        SyncBanner(
          store: OfflineStore.instance,
          onRetry: () => OfflineStore.instance.retryFailed(),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _load,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  'Hari ini',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                Text(
                  today,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.brown,
                      ),
                ),
                const SizedBox(height: 12),
                _QuickGrid(goTab: widget.goTab),
                const SizedBox(height: 16),
                Text(
                  "Event hari ini (${_events.length})",
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 8),
                if (_loading)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: CircularProgressIndicator(),
                    ),
                  )
                else if (_error != null)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          const Icon(Icons.cloud_off, size: 40),
                          const SizedBox(height: 8),
                          const Text(
                            'Tidak bisa memuat data. Periksa koneksi atau konfigurasi.',
                          ),
                          Text(
                            _error!,
                            style: const TextStyle(fontSize: 12),
                          ),
                          const SizedBox(height: 8),
                          FilledButton(
                            onPressed: _load,
                            child: const Text('Muat Ulang'),
                          ),
                        ],
                      ),
                    ),
                  )
                else if (_events.isEmpty)
                  const Card(
                    child: Padding(
                      padding: EdgeInsets.all(20),
                      child: Text(
                        'Tidak ada event hari ini. Nikmati persiapan esok hari ☕',
                      ),
                    ),
                  )
                else
                  ..._events.map(
                    (e) => Card(
                      child: ListTile(
                        title: Text(
                          (e['title'] ?? '-') as String,
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        subtitle: Text(
                          '${e['event_no'] ?? ''} • ${e['start_at'] ?? ''}\n'
                          'Pax: ${e['pax_confirmed'] ?? e['pax_final'] ?? '-'}',
                        ),
                        isThreeLine: true,
                        trailing: StatusPill(
                          status: (e['status'] ?? '') as String,
                        ),
                        onTap: () =>
                            widget.openEvent((e['id'] ?? '') as String),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _QuickGrid extends StatelessWidget {
  final void Function(int tab) goTab;
  const _QuickGrid({required this.goTab});

  @override
  Widget build(BuildContext context) {
    final items = [
      (Icons.event, 'Event', 1),
      (Icons.checklist, 'Tugas', 2),
      (Icons.local_shipping, 'Operasi', 3),
      (Icons.report_problem, 'Lapor Insiden', 2),
      (Icons.qr_code_scanner, 'Scan QR', 5),
      (Icons.notifications, 'Notifikasi', 4),
    ];
    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.15,
      children: [
        for (final (icon, label, tab) in items)
          Card(
            child: InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: () => goTab(tab),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, size: 30, color: Colors.brown[700]),
                  const SizedBox(height: 6),
                  Text(
                    label,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
