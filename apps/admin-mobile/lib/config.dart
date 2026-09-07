/// Konfigurasi aplikasi + tema hangat "kertas".
///
/// Kredensial TIDAK di-hardcode. Isi lewat --dart-define:
///   flutter run --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON=...
library;

import 'package:flutter/material.dart';

class Config {
  static const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://okrnrxqojlugzwsdkczv.supabase.co',
  );
  static const supabaseAnon = String.fromEnvironment(
    'SUPABASE_ANON',
    defaultValue: '',
  );

  static bool get isConfigured => supabaseAnon.isNotEmpty;

  /// Bucket Storage untuk bukti foto lapangan.
  static const evidenceBucket = 'evidence';
}

class AppColors {
  static const paper = Color(0xFFFAF7F2);
  static const surface = Color(0xFFFFFFFF);
  static const gold = Color(0xFFB45309);
  static const goldDark = Color(0xFF92400E);
  static const ink = Color(0xFF1C1917);
  static const muted = Color(0xFF78716C);
  static const line = Color(0xFFE7E0D5);
  static const success = Color(0xFF15803D);
  static const danger = Color(0xFFB91C1C);
  static const warn = Color(0xFFB45309);
}

ThemeData buildTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: AppColors.gold,
    primary: AppColors.gold,
    surface: AppColors.surface,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: AppColors.paper,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.paper,
      foregroundColor: AppColors.ink,
      centerTitle: false,
    ),
    cardTheme: const CardThemeData(
      color: AppColors.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(14)),
        side: BorderSide(color: AppColors.line),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(48, 52),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(48, 52),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
        ),
      ),
    ),
    navigationBarTheme: const NavigationBarThemeData(
      backgroundColor: AppColors.surface,
      indicatorColor: Color(0xFFF5E6CC),
    ),
  );
}
