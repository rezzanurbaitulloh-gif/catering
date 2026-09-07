/// Banner sinkronisasi: tampil bila ada op tertunda/gagal atau offline.
library;

import 'package:flutter/material.dart';

import '../config.dart';
import '../offline.dart';

class SyncBanner extends StatelessWidget {
  final OfflineStore store;
  final VoidCallback onRetry;
  const SyncBanner({super.key, required this.store, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: store,
      builder: (context, _) {
        final pending = store.pendingCount;
        final failed = store.failed.length;
        if (store.isOnline && pending == 0) {
          return const SizedBox.shrink();
        }
        final Color bg;
        final String text;
        if (!store.isOnline) {
          bg = const Color(0xFF44403C);
          text = 'Offline — $pending perubahan tersimpan, '
              'otomatis terkirim saat online.';
        } else if (store.isSyncing) {
          bg = AppColors.gold;
          text = 'Mengirim $pending perubahan…';
        } else if (failed > 0) {
          bg = AppColors.danger;
          text = '$failed perubahan gagal terkirim. Ketuk Coba Lagi.';
        } else {
          bg = AppColors.gold;
          text = '$pending perubahan menunggu sinkron.';
        }
        return Container(
          width: double.infinity,
          color: bg,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: SafeArea(
            bottom: false,
            child: Row(
              children: [
                if (store.isSyncing)
                  const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: Colors.white,
                    ),
                  )
                else
                  const Icon(Icons.sync, color: Colors.white, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    text,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                if (failed > 0 && !store.isSyncing)
                  TextButton(
                    onPressed: onRetry,
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.white,
                    ),
                    child: const Text(
                      'COBA LAGI',
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}
