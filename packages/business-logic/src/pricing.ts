// Server-side financial truth. Clients display; they never decide.
import type { QuoteItemInput } from '@catering-os/types';

export interface Totals { subtotal: number; discount: number; total: number; }

export function roundRp(n: number): number {
  return Math.round(n);
}

/** Sum of qty × unit_price. per_pax items are multiplied by pax. */
export function calcSubtotal(items: QuoteItemInput[], pax: number): number {
  if (!Number.isInteger(pax) || pax <= 0) throw new Error('pax must be a positive integer');
  let sum = 0;
  for (const it of items) {
    if (it.qty < 0 || it.unit_price < 0) throw new Error('negative qty/price not allowed');
    sum += it.qty * it.unit_price * (it.per_pax ? pax : 1);
  }
  return roundRp(sum);
}

export interface PromotionRule {
  kind: 'PERCENT' | 'FIXED';
  value: number; // percent 0-100 or rupiah
  min_order?: number;
  starts_at?: string; ends_at?: string;
  usage_limit?: number; used_count?: number;
}

export function validatePromotion(rule: PromotionRule, subtotal: number, now = new Date()): { ok: boolean; reason?: string } {
  if (rule.min_order != null && subtotal < rule.min_order)
    return { ok: false, reason: `Minimum order Rp${rule.min_order}` };
  if (rule.starts_at && now < new Date(rule.starts_at)) return { ok: false, reason: 'Promotion not started' };
  if (rule.ends_at && now > new Date(rule.ends_at)) return { ok: false, reason: 'Promotion expired' };
  if (rule.usage_limit != null && (rule.used_count ?? 0) >= rule.usage_limit)
    return { ok: false, reason: 'Promotion usage limit reached' };
  if (rule.kind === 'PERCENT' && (rule.value <= 0 || rule.value > 100))
    return { ok: false, reason: 'Invalid percent value' };
  if (rule.kind === 'FIXED' && rule.value < 0) return { ok: false, reason: 'Invalid fixed value' };
  return { ok: true };
}

export function applyPromotion(subtotal: number, rule: PromotionRule): Totals {
  const v = validatePromotion(rule, subtotal);
  if (!v.ok) throw new Error(v.reason);
  const discount = rule.kind === 'PERCENT' ? roundRp((subtotal * rule.value) / 100) : Math.min(rule.value, subtotal);
  return { subtotal, discount, total: subtotal - discount };
}

/** required = recipe requirement × production quantity (never trust client math). */
export function ingredientRequirement(qtyPerPax: number, productionQty: number): number {
  if (qtyPerPax < 0 || productionQty < 0) throw new Error('negative quantity');
  return qtyPerPax * productionQty;
}

export interface CostBreakdown {
  revenue: number; food: number; labor: number; transport: number; vendor: number; other: number;
}
export function profitability(c: CostBreakdown): { profit: number; margin_pct: number } {
  const cost = c.food + c.labor + c.transport + c.vendor + c.other;
  const profit = c.revenue - cost;
  // Floor 1 desimal (konservatif, cth §33: 9.5/30jt → 31.6%, bukan 31.7%).
  const margin_pct = c.revenue > 0 ? Math.floor((profit / c.revenue) * 1000) / 10 : 0;
  return { profit, margin_pct };
}

export function paymentProgress(total: number, paid: number): 'UNPAID' | 'DP' | 'PARTIAL' | 'PAID' | 'OVERPAID' {
  if (paid <= 0) return 'UNPAID';
  if (paid >= total) return paid > total ? 'OVERPAID' : 'PAID';
  // DP convention: >=30% counts as DP secured
  return paid >= total * 0.3 ? 'DP' : 'PARTIAL';
}
