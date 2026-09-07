// Risk engine — neutral operational language, never accusing staff.
import type { Event, RiskLevel, EventRisk, Shortage } from '@catering-os/types';

export interface RiskInput {
  event: Pick<Event, 'id' | 'event_no' | 'event_date' | 'pax_final' | 'pax_locked' | 'payment_status' | 'status'>;
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

  if (!event.pax_locked && ['PLANNING'].includes(event.status))
    reasons.push('Final pax not locked — production quantities are estimates');
  if (input.ingredientShortages.length > 0) {
    const s = input.ingredientShortages.map((x) => `${x.ingredient_name} short ${x.shortage}${x.unit}`).join('; ');
    reasons.push(`Ingredient shortage: ${s}`);
  }
  if (!input.vehicleAssigned) reasons.push('Vehicle not assigned');
  if (input.staffAssigned < input.staffRequired)
    reasons.push(`Staffing gap: ${input.staffAssigned}/${input.staffRequired} assigned`);
  if (input.equipmentMissing > 0) reasons.push(`${input.equipmentMissing} equipment units unreconciled`);
  if (event.payment_status !== 'PAID') reasons.push(`Payment status: ${event.payment_status} — confirm before dispatch`);
  if (input.hoursToEvent < 24 && event.status === 'PLANNING')
    reasons.push('Event within 24h still in planning — expedite lock');
  if (input.incidentOpen > 0) reasons.push(`${input.incidentOpen} open incident(s) need resolution`);

  const level: RiskLevel =
    reasons.length >= 3 || input.ingredientShortages.length > 0 || (input.hoursToEvent < 24 && event.status === 'PLANNING')
      ? 'HIGH'
      : reasons.length >= 1 ? 'MEDIUM' : 'LOW';

  return { event_id: event.id, event_no: event.event_no, level, reasons, checked_at: new Date().toISOString() };
}

export function detectResourceConflict(events: { id: string; staff_need: number }[], available: number): { conflict: boolean; message: string } {
  const total = events.reduce((a, e) => a + e.staff_need, 0);
  if (total <= available) return { conflict: false, message: `Staff OK: need ${total}, available ${available}` };
  return {
    conflict: true,
    message: `HIGH RESOURCE CONFLICT: need ${total} staff across ${events.length} events, available ${available}`,
  };
}

export function packingDiscrepancy(packed: number, required: number, label: string): string | null {
  if (packed >= required) return null;
  return `RED ALERT — ${label}: packed ${packed}/${required}, short ${required - packed}`;
}
