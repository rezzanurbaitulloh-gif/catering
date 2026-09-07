/// Notifikasi: daftar peringatan operasional + tandai dibaca.
library;

import 'package:flutter/material.dart';

import '../api.dart';
import '../offline.dart';
import '../widgets/sync_banner.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<Map<String, dynamic>> _rows = [];
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
      final rows = await ApiService.instance.fetchNotifications();
      if (!mounted) return;
      setState(() {
        _rows = rows;
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
      appBar: AppBar(title: const Text('Notifikasi')),
      body: Column(
        children: [
          SyncBanner(
            store: OfflineStore.instance,
            onRetry: () => OfflineStore.instance.retryFailed(),
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
                    : _rows.isEmpty
                        ? const Center(
                            child: Text('Belum ada notifikasi.'),
                          )
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.separated(
                              padding: const EdgeInsets.all(14),
                              itemCount: _rows.length,
                              separatorBuilder: (_, _) =>
                                  const SizedBox(height: 8),
                              itemBuilder: (context, i) {
                                final n = _rows[i];
                                final read = n['read_at'] != null;
                                return Card(
                                  color: read ? null : const Color(0xFFFFFBEB),
                                  child: ListTile(
                                    title: Text(
                                      (n['title'] ?? '') as String,
                                      style: TextStyle(
                                        fontWeight: read
                                            ? FontWeight.w500
                                            : FontWeight.w800,
                                      ),
                                    ),
                                    subtitle: Text(
                                        (n['body'] ?? '') as String),
                                    trailing: read
                                        ? null
                                        : FilledButton(
                                            onPressed: () async {
                                              await ApiService.instance
                                                  .markNotificationRead(
                                                (n['id'] ?? '') as String,
                                              );
                                              await _load();
                                            },
                                            child: const Text('Baca'),
                                          ),
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}
