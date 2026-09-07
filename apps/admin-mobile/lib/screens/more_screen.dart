/// Layar Lainnya: pusat sinkronisasi, scan QR, status konfigurasi,
/// info aplikasi. Tidak ada tombol mati — tiap item punya aksi nyata.
library;

import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config.dart';
import '../offline.dart';
import '../widgets/sync_banner.dart';

class MoreScreen extends StatelessWidget {
  final void Function(String eventId) openEvent;
  const MoreScreen({super.key, required this.openEvent});

  Future<void> _scanQr(BuildContext context) async {
    final code = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (_) => const _QrScanPage()),
    );
    if (code == null || code.isEmpty) return;
    // Format QR: EVENT:<uuid> atau event_no. Dukung keduanya.
    String? id;
    if (code.startsWith('EVENT:')) {
      id = code.substring(6);
    } else {
      try {
        final row = await Supabase.instance.client
            .from('events')
            .select('id')
            .eq('event_no', code.trim())
            .maybeSingle();
        id = (row?['id'] ?? '') as String;
        if (id.isEmpty) id = null;
      } catch (_) {
        id = null;
      }
    }
    if (!context.mounted) return;
    if (id == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('QR tidak dikenali.')),
      );
      return;
    }
    openEvent(id);
  }

  @override
  Widget build(BuildContext context) {
    final store = OfflineStore.instance;
    return Scaffold(
      appBar: AppBar(title: const Text('Lainnya')),
      body: Column(
        children: [
          SyncBanner(store: store, onRetry: () => store.retryFailed()),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(14),
              children: [
                const Text(
                  'Sinkronisasi',
                  style:
                      TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 6),
                ListenableBuilder(
                  listenable: store,
                  builder: (context, _) {
                    final ops = store.ops;
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              store.isOnline
                                  ? 'Online'
                                  : 'Offline — perubahan aman tersimpan',
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              '${store.pendingCount} menunggu · ${store.failed.length} gagal',
                            ),
                            if (ops.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              for (final op in ops.take(5))
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 2,
                                  ),
                                  child: Text(
                                    '• ${op.label} [${op.state.name}]',
                                    style: const TextStyle(fontSize: 13),
                                  ),
                                ),
                            ],
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(
                                  child: FilledButton(
                                    onPressed: () => store.syncAll(),
                                    child: const Text('Sinkron Sekarang'),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: OutlinedButton(
                                    onPressed: () => store.retryFailed(),
                                    child: const Text('Coba Lagi'),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 14),
                const Text(
                  'Alat lapangan',
                  style:
                      TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 6),
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.qr_code_scanner),
                    title: const Text('Scan QR Event'),
                    subtitle: const Text(
                        'Buka detail event dari kode QR / nomor acara'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => _scanQr(context),
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  'Akun & aplikasi',
                  style:
                      TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 6),
                Card(
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.cloud_outlined),
                        title: const Text('Koneksi server'),
                        subtitle: Text(
                          Config.isConfigured
                              ? Config.supabaseUrl
                              : 'Belum dikonfigurasi (isi SUPABASE_ANON)',
                        ),
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.logout),
                        title: const Text('Keluar'),
                        onTap: () async {
                          await Supabase.instance.client.auth.signOut();
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Berhasil keluar.'),
                            ),
                          );
                        },
                      ),
                      const Divider(height: 1),
                      const ListTile(
                        leading: Icon(Icons.info_outlined),
                        title: Text('RasaOps v1.2.0'),
                        subtitle: Text(
                            'Aplikasi lapangan Rasa Nusantara Catering'),
                      ),
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

class _QrScanPage extends StatelessWidget {
  const _QrScanPage();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scan QR')),
      body: MobileScanner(
        onDetect: (capture) {
          final code =
              capture.barcodes.firstOrNull?.rawValue ?? '';
          if (code.isNotEmpty) {
            Navigator.of(context).pop(code);
          }
        },
      ),
    );
  }
}
