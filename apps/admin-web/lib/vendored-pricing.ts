// Vendored dari packages/business-logic/src/pricing.ts
// (disalin agar apps/admin-web mandiri — JANGAN import @catering-os/*).
// Kebenaran finansial milik server (API routes); klien hanya menampilkan.

export interface Totals {
  subtotal: number;
  discount: number;
  total: number;
}

export interface QuoteItemInput {
  name: string;
  qty: number;
  unit_price: number;
  per_pax: boolean;
}

export function roundRp(n: number): number {
  return Math.round(n);
}

/** Sum qty × unit_price; item per_pax dikali pax. */
export function calcSubtotal(items: QuoteItemInput[], pax: number): number {
  if (!Number.isInteger(pax) || pax <= 0) throw new Error('pax harus bilangan bulat positif');
  let sum = 0;
  for (const it of items) {
    if (it.qty < 0 || it.unit_price < 0) throw new Error('qty/harga negatif tidak diizinkan');
    sum += it.qty * it.unit_price * (it.per_pax ? pax : 1);
  }
  return roundRp(sum);
}

export interface CostBreakdown {
  revenue: number;
  food: number;
  labor: number;
  transport: number;
  vendor: number;
  other: number;
}

export function profitability(c: CostBreakdown): { profit: number; margin_pct: number } {
  const cost = c.food + c.labor + c.transport + c.vendor + c.other;
  const profit = c.revenue - cost;
  // Floor 1 desimal (konservatif, cth §33: 9.5/30jt → 31.6%).
  const margin_pct = c.revenue > 0 ? Math.floor((profit / c.revenue) * 1000) / 10 : 0;
  return { profit, margin_pct };
}

/** Status pembayaran turunan dari total tagihan vs total dibayar. */
export function paymentProgress(
  total: number,
  paid: number,
): 'UNPAID' | 'DP' | 'PARTIAL' | 'PAID' | 'OVERPAID' {
  if (paid <= 0) return 'UNPAID';
  if (paid >= total) return paid > total ? 'OVERPAID' : 'PAID';
  return paid >= total * 0.3 ? 'DP' : 'PARTIAL';
}

/** Status payment_status kolom events dari total & terbayar (dipakai server saat terima pembayaran). */
export function derivePaymentStatus(total: number, paid: number): string {
  if (total <= 0) return paid > 0 ? 'PARTIAL' : 'PENDING';
  if (paid <= 0) return 'PENDING';
  if (paid >= total) return 'PAID';
  return 'PARTIAL';
}
