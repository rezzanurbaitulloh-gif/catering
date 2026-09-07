// Skenario kritis §65: perhitungan uang & porsi — server-side truth.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcSubtotal, applyPromotion, validatePromotion,
  ingredientRequirement, profitability, paymentProgress,
} from './pricing.js';

describe('pricing', () => {
  it('subtotal per_pax × pax (Paket Klasik 500 pax)', () => {
    const sub = calcSubtotal([{ name: 'Paket Klasik', qty: 1, unit_price: 55000, per_pax: true }], 500);
    assert.equal(sub, 27_500_000);
  });
  it('menolak pax nol/negatif & harga negatif', () => {
    assert.throws(() => calcSubtotal([{ name: 'x', qty: 1, unit_price: 100 }], 0));
    assert.throws(() => calcSubtotal([{ name: 'x', qty: 1, unit_price: -5 }], 10));
  });
  it('promosi HAJATAN10: min order & persen', () => {
    assert.equal(validatePromotion({ kind: 'PERCENT', value: 10, min_order: 5_000_000 }, 4_000_000).ok, false);
    const t = applyPromotion(11_200_000, { kind: 'PERCENT', value: 10, min_order: 5_000_000 });
    assert.equal(t.discount, 1_120_000);
    assert.equal(t.total, 10_080_000);
  });
  it('promosi kedaluwarsa & over-limit ditolak', () => {
    assert.equal(validatePromotion({ kind: 'FIXED', value: 1000, ends_at: '2020-01-01T00:00:00Z' }, 99999).ok, false);
    assert.equal(validatePromotion({ kind: 'PERCENT', value: 150 }, 10000).ok, false);
  });
  it('kebutuhan bahan = resep × qty produksi (ayam 500 porsi)', () => {
    assert.equal(ingredientRequirement(0.07, 500), 35); // 35 kg
  });
  it('profitabilitas contoh §33: margin 31.6%', () => {
    const { profit, margin_pct } = profitability({
      revenue: 30_000_000, food: 11_000_000, labor: 5_000_000,
      transport: 2_000_000, vendor: 1_500_000, other: 1_000_000,
    });
    assert.equal(profit, 9_500_000);
    assert.equal(margin_pct, 31.6);
  });
  it('progres pembayaran: UNPAID → DP(≥30%) → PAID', () => {
    assert.equal(paymentProgress(10_000_000, 0), 'UNPAID');
    assert.equal(paymentProgress(10_000_000, 1_000_000), 'PARTIAL');
    assert.equal(paymentProgress(10_000_000, 3_000_000), 'DP');
    assert.equal(paymentProgress(10_000_000, 10_000_000), 'PAID');
    assert.equal(paymentProgress(10_000_000, 11_000_000), 'OVERPAID');
  });
});
