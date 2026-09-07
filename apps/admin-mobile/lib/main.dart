/// RasaOps — aplikasi lapangan Rasa Nusantara Catering.
/// Beranda, Event, Tugas, Operasi, Notifikasi, Lainnya.
library;

import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'api.dart';
import 'config.dart';
import 'offline.dart';
import 'screens/event_detail_screen.dart';
import 'screens/events_list_screen.dart';
import 'screens/home_screen.dart';
import 'screens/more_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/operations_screen.dart';
import 'screens/tasks_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('id_ID');
  if (Config.isConfigured) {
    await Supabase.initialize(
      url: Config.supabaseUrl,
      publishableKey: Config.supabaseAnon,
    );
  }
  OfflineStore.instance.executor = ApiService.instance.executeOp;
  await OfflineStore.instance.init();
  runApp(const RasaOpsApp());
}

class RasaOpsApp extends StatelessWidget {
  const RasaOpsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'RasaOps',
      theme: buildTheme(),
      home: Config.isConfigured
          ? const OpsShell()
          : const _NotConfiguredPage(),
    );
  }
}

class _NotConfiguredPage extends StatelessWidget {
  const _NotConfiguredPage();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('RasaOps')),
      body: const Padding(
        padding: EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.cloud_off, size: 56),
            SizedBox(height: 12),
            Text(
              'Server belum dikonfigurasi.',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            SizedBox(height: 8),
            Text(
              'Jalankan dengan --dart-define=SUPABASE_URL=... '
              '--dart-define=SUPABASE_ANON=...',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class OpsShell extends StatefulWidget {
  const OpsShell({super.key});

  @override
  State<OpsShell> createState() => _OpsShellState();
}

class _OpsShellState extends State<OpsShell> {
  int _tab = 0;

  void _goTab(int i) => setState(() => _tab = i);

  void _openEvent(String id) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => EventDetailScreen(eventId: id)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: IndexedStack(
          index: _tab,
          children: [
            HomeScreen(goTab: _goTab, openEvent: _openEvent),
            EventsListScreen(openEvent: _openEvent),
            const TasksScreen(),
            _OpsPicker(openEvent: _openEvent),
            const NotificationsScreen(),
            MoreScreen(openEvent: _openEvent),
          ],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: _goTab,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Beranda',
          ),
          NavigationDestination(
            icon: Icon(Icons.event_outlined),
            selectedIcon: Icon(Icons.event),
            label: 'Event',
          ),
          NavigationDestination(
            icon: Icon(Icons.checklist_outlined),
            selectedIcon: Icon(Icons.checklist),
            label: 'Tugas',
          ),
          NavigationDestination(
            icon: Icon(Icons.local_shipping_outlined),
            selectedIcon: Icon(Icons.local_shipping),
            label: 'Operasi',
          ),
          NavigationDestination(
            icon: Icon(Icons.notifications_outlined),
            selectedIcon: Icon(Icons.notifications),
            label: 'Notifikasi',
          ),
          NavigationDestination(
            icon: Icon(Icons.more_horiz),
            selectedIcon: Icon(Icons.more_horiz),
            label: 'Lainnya',
          ),
        ],
      ),
    );
  }
}

/// Tab Operasi: pilih event dulu (dengan aksi cepat), lalu buka alur operasi.
class _OpsPicker extends StatefulWidget {
  final void Function(String eventId) openEvent;
  const _OpsPicker({required this.openEvent});

  @override
  State<_OpsPicker> createState() => _OpsPickerState();
}

class _OpsPickerState extends State<_OpsPicker> {
  List<Map<String, dynamic>> _events = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final rows = await ApiService.instance.fetchUpcomingEvents(limit: 20);
      if (!mounted) return;
      setState(() {
        _events = rows;
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
    return Scaffold(
      appBar: AppBar(title: const Text('Operasi')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _events.isEmpty
                  ? const Center(child: Text('Tidak ada event mendatang.'))
                  : ListView.separated(
                      padding: const EdgeInsets.all(14),
                      itemCount: _events.length,
                      separatorBuilder: (_, _) =>
                          const SizedBox(height: 8),
                      itemBuilder: (context, i) {
                        final e = _events[i];
                        return Card(
                          child: ListTile(
                            title: Text(
                              '${e['event_no'] ?? ''} — ${e['title'] ?? ''}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            subtitle:
                                Text('${e['event_date'] ?? ''}'),
                            trailing:
                                const Icon(Icons.chevron_right),
                            onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => OperationsScreen(
                                  eventId: (e['id'] ?? '') as String,
                                  eventTitle:
                                      (e['title'] ?? '') as String,
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
    );
  }
}
