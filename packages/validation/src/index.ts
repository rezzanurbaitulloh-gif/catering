import { z } from 'zod';

export const id = z.string().uuid().or(z.string().min(1));
export const phoneID = z.string().regex(/^(\+62|62|0)8\d{8,11}$/, 'Nomor WhatsApp Indonesia tidak valid');
export const rupiah = z.number().int().min(0);

export const inquirySchema = z.object({
  event_type: z.string().min(2).max(80),
  event_date: z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'Tanggal tidak valid'),
  venue_text: z.string().max(300).optional().nullable(),
  pax: z.number().int().min(20, 'Minimal 20 pax').max(10000),
  name: z.string().min(2).max(120),
  phone: phoneID,
  email: z.string().email().optional().nullable(),
  menu_notes: z.string().max(2000).optional().nullable(),
  // Structured dietary — never buried in notes (spec §27)
  vegetarian: z.number().int().min(0).default(0),
  vegan: z.number().int().min(0).default(0),
  allergies: z.array(z.string().max(80)).default([]),
  dietary_notes: z.string().max(1000).optional().nullable(),
});

export const quoteItemSchema = z.object({
  name: z.string().min(1).max(160),
  qty: z.number().min(0),
  unit_price: rupiah,
  per_pax: z.boolean().optional(),
});

export const quoteCreateSchema = z.object({
  inquiry_id: id.optional().nullable(),
  customer_id: id.optional().nullable(),
  pax: z.number().int().min(1),
  items: z.array(quoteItemSchema).min(1),
  discount: rupiah.default(0),
  valid_until: z.string().optional().nullable(),
});

export const paxLockSchema = z.object({
  event_id: id,
  pax_final: z.number().int().min(1).max(10000),
});

export const paymentSchema = z.object({
  event_id: id,
  amount: z.number().int().min(1000),
  method: z.enum(['CASH', 'TRANSFER', 'QRIS', 'CARD', 'OTHER']),
  kind: z.enum(['DP', 'FINAL', 'FULL', 'REFUND', 'OTHER']),
  reference: z.string().max(120).optional().nullable(),
});

export const incidentSchema = z.object({
  event_id: id.optional().nullable(),
  category: z.string().min(2).max(80),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  title: z.string().min(4).max(160),
  description: z.string().min(10).max(5000),
});

export const statusTransitionSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

export type InquiryInput = z.infer<typeof inquirySchema>;
export type QuoteCreateInput = z.infer<typeof quoteCreateSchema>;
