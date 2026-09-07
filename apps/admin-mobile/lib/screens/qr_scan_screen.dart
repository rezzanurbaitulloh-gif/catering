/// Pemindai QR event: kembalikan `EVENT:<uuid>` atau nomor acara.
/// Dipakai dari daftar event & layar lainnya.
library;

import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class QrScanScreen extends StatefulWidget {
  const QrScanScreen({super.key});

  @override
  State<QrScanScreen> createState() => _QrScanScreenState();
}

class _QrScanScreenState extends State<QrScanScreen> {
  bool _busy = false;

  Future<void> _onCode(BuildContext context, String code) async {
    if (_busy) return;
    setState(() => _busy = true);
    String? id;
    if (code.startsWith('EVENT:')) {
      id = code.substring(6).trim();
    } else {
      try {
        final row = await Supabase.instance.client
            .from('events')
            .select('id')
            .eq('event_no', code.trim())
            .maybeSingle();
        final found = (row?['id'] ?? '') as String;
        if (found.isNotEmpty) id = found;
      } catch (_) {
        id = null;
      }
    }
    if (!context.mounted) return;
    if (id == null || id.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('QR tidak dikenali.')),
      );
      setState(() => _busy = false);
      return;
    }
    Navigator.of(context).pop(id);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scan QR Event')),
      body: MobileScanner(
        onDetect: (capture) {
          final code = capture.barcodes.firstOrNull?.rawValue ?? '';
          if (code.isNotEmpty) _onCode(context, code);
        },
      ),
    );
  }
}
