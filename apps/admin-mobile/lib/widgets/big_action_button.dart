/// Tombol aksi lapangan ≥56px: mudah diketuk dengan sarung tangan.
library;

import 'package:flutter/material.dart';

class BigActionButton extends StatelessWidget {
  final String label;
  final String? subtitle;
  final IconData icon;
  final VoidCallback? onPressed;
  final bool danger;
  final bool loading;

  const BigActionButton({
    super.key,
    required this.label,
    this.subtitle,
    this.icon = Icons.check_circle,
    this.onPressed,
    this.danger = false,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    final child = loading
        ? const SizedBox(
            width: 26,
            height: 26,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              color: Colors.white,
            ),
          )
        : Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 26),
              const SizedBox(width: 10),
              Flexible(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      label,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    if (subtitle != null)
                      Text(
                        subtitle!,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          );
    final style = FilledButton.styleFrom(
      minimumSize: const Size(double.infinity, 60),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
    );
    if (danger) {
      return FilledButton.tonal(
        onPressed: loading ? null : onPressed,
        style: style,
        child: child,
      );
    }
    return FilledButton(
      onPressed: loading ? null : onPressed,
      style: style,
      child: child,
    );
  }
}
