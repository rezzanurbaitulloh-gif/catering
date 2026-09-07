library;

import 'package:flutter/material.dart';

import '../api.dart';
import '../config.dart';

/// Pil status event berbahasa Indonesia.
class StatusPill extends StatelessWidget {
  final String status;
  const StatusPill({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final Color bg;
    final Color fg;
    switch (status) {
      case 'SERVICE':
        bg = const Color(0xFFDCFCE7);
        fg = AppColors.success;
      case 'SETUP':
      case 'IN_TRANSIT':
        bg = const Color(0xFFFEF3C7);
        fg = AppColors.warn;
      case 'BREAKDOWN':
      case 'IN_PREPARATION':
        bg = const Color(0xFFFFEDD5);
        fg = AppColors.goldDark;
      case 'COMPLETED':
      case 'CLOSED':
        bg = const Color(0xFFE7E5E4);
        fg = const Color(0xFF57534E);
      default:
        bg = const Color(0xFFF5F5F4);
        fg = AppColors.muted;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        EventFlow.labelOf(status),
        style: TextStyle(
          color: fg,
          fontWeight: FontWeight.w700,
          fontSize: 12,
        ),
      ),
    );
  }
}

/// Pil status generik (tugas checklist, pembayaran, dsb).
class GenericPill extends StatelessWidget {
  final String text;
  final bool good;
  const GenericPill({super.key, required this.text, this.good = true});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: good ? const Color(0xFFDCFCE7) : const Color(0xFFF5F5F4),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: good ? AppColors.success : AppColors.muted,
          fontWeight: FontWeight.w700,
          fontSize: 12,
        ),
      ),
    );
  }
}
