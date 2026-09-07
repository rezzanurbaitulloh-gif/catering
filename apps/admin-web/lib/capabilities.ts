// Vendored dari packages/config/src/capabilities.ts
// (disalin agar apps/admin-web mandiri — JANGAN import @catering-os/*).
// Capability hilang = route 404, tanpa banner upsell.

export const ROUTE_CAPABILITIES: Record<string, string> = {
  '/dashboard': 'event_management',
  '/orders': 'basic_orders',
  '/customers': 'customer_management',
  '/packages': 'package_management',
  '/menu': 'package_management',
  '/events': 'event_management',
  '/control': 'advanced_event_control',
  '/risks': 'risk_engine',
  '/leads': 'crm',
  '/quotations': 'advanced_quotation',
  '/change-requests': 'change_request',
  '/production': 'production_planning',
  '/inventory': 'inventory',
  '/procurement': 'procurement',
  '/workforce': 'workforce_management',
  '/vehicles': 'vehicle_management',
  '/equipment': 'equipment_tracking',
  '/venues': 'venue_management',
  '/transport': 'transport_management',
  '/finance': 'basic_finance',
  '/incidents': 'basic_incidents',
  '/analytics': 'advanced_analytics',
};

export function canAccess(route: string, caps: Record<string, boolean>): boolean {
  const need = ROUTE_CAPABILITIES[route];
  if (!need) return true;
  return caps[need] === true;
}
