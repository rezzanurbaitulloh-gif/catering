// Vendored dari packages/business-logic/src/risk.ts
// (disalin agar apps/admin-web mandiri — JANGAN import @catering-os/*).
// Bahasa netral operasional — tidak menyalahkan staf.

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Shortage {
  ingredient_name: string;
  shortage: number;
  unit: string;
}

export interface EventRisk {
  event_id: string;
  event_no: string;
  level: RiskLevel;
  reasons: string[];
  checked_at: string;
}

export interface RiskInput {
  event: {
    id: string;
    event_no: string;
    event_date: string;
    pax_final: number | null;
    pax_locked: boolean;
    payment_status: string;
    status: string;
  };
  ingredientShortages: Shortage[];
  vehicleAssigned: boolean;
  staffAssigned: number;
  staffRequired: number;
  equipmentMissing: number;
  incidentOpen: number;
  hoursToEvent: number;
}

export function evaluateRisk(input: RiskInput): EventRisk {
  const reasons: string[] = [];
  const { event } = input;

  if (!event.pax_locked && event.status === 'PLANNING')
    reasons.push('Pax final belum dikunci — jumlah produksi masih perkiraan');
  if (input.ingredientShortages.length > 0) {
    const s = input.ingredientShortages
      .map((x) => `${x.ingredient_name} kurang ${x.shortage}${x.unit}`)
      .join('; ');
    reasons.push(`Kekurangan bahan: ${s}`);
  }
  if (!input.vehicleAssigned) reasons.push('Armada belum ditetapkan');
  if (input.staffAssigned < input.staffRequired)
    reasons.push(`Kekurangan tim: ${input.staffAssigned}/${input.staffRequired} ditugaskan`);
  if (input.equipmentMissing > 0) reasons.push(`${input.equipmentMissing} unit peralatan belum rekonsiliasi`);
  if (event.payment_status !== 'PAID')
    reasons.push(`Status bayar: ${event.payment_status} — konfirmasi sebelum kirim`);
  if (input.hoursToEvent < 24 && event.status === 'PLANNING')
    reasons.push('Acara <24 jam masih tahap perencanaan — percepat penguncian');
  if (input.incidentOpen > 0) reasons.push(`${input.incidentOpen} insiden terbuka perlu penyelesaian`);

  const level: RiskLevel =
    reasons.length >= 3 ||
    input.ingredientShortages.length > 0 ||
    (input.hoursToEvent < 24 && event.status === 'PLANNING')
      ? 'HIGH'
      : reasons.length >= 1
        ? 'MEDIUM'
        : 'LOW';

  return {
    event_id: event.id,
    event_no: event.event_no,
    level,
    reasons,
    checked_at: new Date().toISOString(),
  };
}

export function detectResourceConflict(
  events: { id: string; staff_need: number }[],
  available: number,
): { conflict: boolean; message: string } {
  const total = events.reduce((a, e) => a + e.staff_need, 0);
  if (total <= available)
    return { conflict: false, message: `Tim cukup: butuh ${total}, tersedia ${available}` };
  return {
    conflict: true,
    message: `KONFLIK SUMBER DAYA: butuh ${total} staf untuk ${events.length} acara, tersedia ${available}`,
  };
}

export function packingDiscrepancy(
  packed: number,
  required: number,
  label: string,
): string | null {
  if (packed >= required) return null;
  return `SELISIH — ${label}: terk packing ${packed}/${required}, kurang ${required - packed}`;
}

/** Kebutuhan staf kasar dari pax (heuristik operasional, bukan kontrak). */
export function staffNeedForPax(pax: number): number {
  return Math.max(4, Math.ceil(pax / 35));
}
