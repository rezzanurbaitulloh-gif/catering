// Konstanta bisnis + fallback konten bila Supabase belum terjangkau saat build/prerender.
// Nilai fallback disalin dari supabase/seed/demo.sql (sumber kebenaran tetap DB).

export const BUSINESS_ID = "11111111-1111-1111-1111-111111111111";

export const SITE = {
  name: "Rasa Nusantara Catering",
  short: "Rasa Nusantara",
  tagline: "Prasmanan yang bikin hajatan tenang",
  description:
    "Katering pernikahan, korporat, pengajian, dan aqiqah di Nganjuk, Jawa Timur. Terpantau, terdokumentasi, tepat waktu.",
  locale: "id_ID",
} as const;

// Foto kuliner terverifikasi (Unsplash, relevan konteks). image_url DB diutamakan.
export const HERO_IMG =
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=70";

export const CATEGORIES = [
  { label: "Prasmanan", match: ["nikah", "mantu", "premium", "prasmanan"] },
  { label: "Nasi Box", match: ["korporat", "box", "rapat", "kantor"] },
  { label: "Pengajian", match: ["pengajian", "tasyakur", "berkah"] },
  { label: "Premium", match: ["premium", "eksklusif"] },
] as const;

// Tipe acara untuk booking cepat (diselaraskan dengan event_types di DB).
export const EVENT_TYPES = ["Pernikahan", "Korporat", "Pengajian", "Aqiqah", "Khitanan", "Ulang Tahun", "Lainnya"] as const;

export const PAX_BANDS = [
  { label: "50–100 tamu", pax: 50 },
  { label: "100–200 tamu", pax: 100 },
  { label: "200–300 tamu", pax: 200 },
  { label: "300–500 tamu", pax: 300 },
  { label: "500+ tamu", pax: 500 },
] as const;

export const CONTACT_FALLBACK = {
  whatsapp: "+6281234567890",
  phone: "(0358) 321-456",
  address: "Jl. A. Yani No. 88, Nganjuk, Jawa Timur",
  email: "halo@rasanusantara.id",
  hours: "Senin–Sabtu 08.00–20.00 · Minggu 09.00–17.00",
} as const;

export const PAYMENT_INFO = {
  transfer: "BCA 1234567890 a.n. Rasa Nusantara",
  qris: "QRIS Rasa Nusantara",
  dp: "DP minimal 30%",
} as const;

export const HERO_FALLBACK = {
  title: "Prasmanan yang bikin hajatan tenang",
  subtitle: "Dari akad sampai beres-beres — terpantau, terdokumentasi, tepat waktu.",
  cta: "Minta Penawaran",
} as const;

// Info rilis aplikasi lapangan (APK admin). Diperbarui manual tiap rilis oleh tim mobile.
export const APK_RELEASE = {
  version: "1.2.0",
  updatedAt: "September 2026",
  size: "± 35 MB",
  minAndroid: "Android 8.0 (Oreo) ke atas",
  changelog: [
    "Checklist persiapan & serah terima digital dengan foto bukti",
    "Pelacakan status Armada & peralatan secara realtime",
    "Mode offline: data tersimpan lalu tersinkron otomatis",
    "Perbaikan stabilitas sinkronisasi jadwal acara",
  ],
} as const;

// Urutan baku lifecycle acara (cerminan docs + trigger assert_event_transition di DB).
export const EVENT_LIFECYCLE: Array<{ status: string; label: string }> = [
  { status: "PLANNING", label: "Perencanaan" },
  { status: "LOCKED", label: "Terkunci" },
  { status: "IN_PREPARATION", label: "Persiapan" },
  { status: "IN_TRANSIT", label: "Pengiriman" },
  { status: "SETUP", label: "Penataan" },
  { status: "SERVICE", label: "Penyajian" },
  { status: "BREAKDOWN", label: "Beres-beres" },
  { status: "COMPLETED", label: "Selesai" },
  { status: "CLOSED", label: "Ditutup" },
];

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu pembayaran",
  PARTIAL: "DP masuk, pelunasan menunggu",
  PAID: "Lunas",
  FAILED: "Gagal",
  REFUNDED: "Dikembalikan",
};

export const ALLERGY_OPTIONS = ["Udang", "Kacang", "Telur", "Susu", "Ikan", "Gluten"] as const;
