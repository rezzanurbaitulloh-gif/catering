# RasaOps — aplikasi lapangan Rasa Nusantara Catering (Flutter, Android-first)

Field-operations app: aksi cepat, checklist, update status, foto bukti,
lapor insiden, serah terima digital. Bukan miniatur Admin Web.

## Prasyarat

- Flutter 3.35+ (`flutter doctor`)
- Android SDK + JDK 17 (atau pakai setup portable di bawah)

## Jalan cepat (debug)

```bash
cd apps/admin-mobile
flutter pub get
flutter run \
  --dart-define=SUPABASE_URL=https://okrnrxqojlugzwsdkczv.supabase.co \
  --dart-define=SUPABASE_ANON=<anon-key>
```

Kredensial tidak di-hardcode: tanpa `--dart-define` aplikasi menampilkan
halaman "Server belum dikonfigurasi" (jujur, tanpa data palsu).

## Build APK rilis

Tanpa root (SDK portable):

```bash
# 1. JDK 17 + Android cmdline-tools (sekali saja)
export JAVA_HOME=~/jdk17 ANDROID_HOME=~/android-sdk
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
flutter config --android-sdk ~/android-sdk

# 2. Build
flutter build apk --release \
  --dart-define=SUPABASE_URL=https://okrnrxqojlugzwsdkczv.supabase.co \
  --dart-define=SUPABASE_ANON=<anon-key>
# hasil: build/app/outputs/flutter-apk/app-release.apk
```

APK resmi didistribusikan via **GitHub Releases**
(lihat halaman `/aplikasi` di Customer Web).

## Navigasi

Beranda · Event · Tugas · Operasi · Notifikasi · Lainnya (sinkron + scan QR).

## Offline

Semua mutasi lewat `OfflineStore` (`lib/offline.dart`):
`PENDING_SYNC → SYNCING → SYNCED`, gagal → `FAILED → RETRY` (tombol Coba Lagi).
Sukses server tidak pernah ditampilkan sebelum konfirmasi. Tiap op punya
idempotency key. Banner status selalu terlihat saat ada antrean.

## Tes

```bash
flutter analyze   # harus: No issues found
flutter test      # EventFlow + PendingOp roundtrip
```
