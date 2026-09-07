// Skenario kritis §65: risk engine, konflik resource, selisih packing.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRisk, detectResourceConflict, packingDiscrepancy } from './risk.js';
import type { RiskInput } from './risk.js';

function base(over: Partial<RiskInput> = {}): RiskInput {
  return {
    event: {
      id: 'e1', event_no: 'EVENT-2026-002', event_date: '2026-09-12',
      pax_final: null, pax_locked: false,
      payment_status: 'PARTIAL', status: 'PLANNING',
    },
    ingredientShortages: [], vehicleAssigned: true,
    staffAssigned: 8, staffRequired: 8,
    equipmentMissing: 0, incidentOpen: 0, hoursToEvent: 200,
    ...over,
  };
}

describe('risk engine', () => {
  it('event sehat = LOW tanpa alasan', () => {
    const r = evaluateRisk(base({
      event: { ...base().event, pax_locked: true, payment_status: 'PAID', status: 'LOCKED' },
    }));
    assert.equal(r.level, 'LOW');
    assert.deepEqual(r.reasons, []);
  });
  it('kekurangan bahan + belum kunci + belum assign = HIGH', () => {
    const r = evaluateRisk(base({
      ingredientShortages: [{ ingredient_id: 'a', ingredient_name: 'Ayam Kampung', required: 35, available: 20, shortage: 15, unit: 'kg' }],
      vehicleAssigned: false,
    }));
    assert.equal(r.level, 'HIGH');
    assert.ok(r.reasons.join(' ').includes('15kg'));
    assert.ok(r.reasons.join(' ').includes('Vehicle not assigned'));
  });
  it('bahasa netral — tidak menyalahkan staf', () => {
    const r = evaluateRisk(base({ staffAssigned: 5, staffRequired: 12 }));
    assert.ok(r.reasons.join(' ').match(/Staffing gap/));
    assert.ok(!r.reasons.join(' ').match(/lalai|malas|salahmu/i));
  });
  it('konflik resource dua event satu hari', () => {
    const ok = detectResourceConflict(
      [{ id: 'a', staff_need: 6 }, { id: 'b', staff_need: 6 }], 16);
    assert.equal(ok.conflict, false);
    const bad = detectResourceConflict(
      [{ id: 'a', staff_need: 12 }, { id: 'b', staff_need: 10 }], 16);
    assert.equal(bad.conflict, true);
    assert.ok(bad.message.includes('HIGH RESOURCE CONFLICT'));
  });
  it('selisih packing memicu RED ALERT', () => {
    assert.equal(packingDiscrepancy(500, 500, 'Nasi'), null);
    assert.equal(
      packingDiscrepancy(480, 500, 'Nasi'),
      'RED ALERT — Nasi: packed 480/500, short 20'
    );
  });
});
