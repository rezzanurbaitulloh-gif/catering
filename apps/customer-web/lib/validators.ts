import { z } from "zod";

// Skema validasi bersama (pesan Bahasa Indonesia). Dipakai client form + route API.

const phoneSchema = z
  .string()
  .trim()
  .min(1, "Nomor WhatsApp wajib diisi.")
  .regex(/^(\+62|62|0)8[\d\s\-.()]{7,15}$/, "Nomor WhatsApp tidak valid. Contoh: 081234567890.");

export const inquirySchema = z.object({
  nama: z.string().trim().min(3, "Nama minimal 3 huruf.").max(120, "Nama maksimal 120 huruf."),
  phone: phoneSchema,
  tanggal: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid.")
    .optional()
    .or(z.literal("")),
  tipeAcara: z.string().trim().min(3, "Tipe acara wajib diisi.").max(80, "Tipe acara maksimal 80 huruf."),
  pax: z.coerce.number().int("Jumlah tamu harus bilangan bulat.").min(1, "Jumlah tamu minimal 1.").max(20000, "Jumlah tamu maksimal 20.000."),
  venue: z.string().trim().max(200, "Lokasi maksimal 200 huruf.").optional().default(""),
  catatan: z.string().trim().max(2000, "Catatan maksimal 2000 huruf.").optional().default(""),
  vegetarian: z.coerce.number().int().min(0, "Tidak boleh negatif.").max(20000).optional().default(0),
  vegan: z.coerce.number().int().min(0, "Tidak boleh negatif.").max(20000).optional().default(0),
  allergies: z.array(z.string().trim().min(1).max(40)).max(20).optional().default([]),
  dietaryNotes: z.string().trim().max(500, "Catatan diet maksimal 500 huruf.").optional().default(""),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

export const trackSchema = z.object({
  no: z.string().trim().min(3, "Nomor acara wajib diisi.").max(40),
  phone: phoneSchema,
});

export const approveSchema = z.object({
  approverName: z
    .string()
    .trim()
    .min(3, "Nama penyetuju minimal 3 huruf.")
    .max(120, "Nama penyetuju maksimal 120 huruf."),
});

export const accountSchema = z.object({ phone: phoneSchema });
