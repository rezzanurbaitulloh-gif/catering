// Vendored dari packages/config/src/capabilities.ts
// (disalin agar apps/admin-web mandiri — JANGAN import @catering-os/*).
// Capability hilang = route 404, tanpa banner upsell.

export const BASIC_CAPABILITIES = [
  'basic_orders',
  'customer_management',
  'package_management',
  'event_management',
  'basic_finance',
  'basic_staff',
  'basic_checklists',
  'basic_notifications',
  'basic_incidents',
] as const;

export const PREMIUM_CAPABILITIES = [
  'crm',
  'advanced_quotation',
  'quotation_versioning',
  'quote_approval',
  'change_request',
  'customer_accounts',
  'online_payment',
  'dynamic_pricing',
  'promotions',
  'coupons',
  'production_planning',
  'recipe_bom',
  'inventory',
  'procurement',
  'suppliers',
  'workforce_management',
  'vehicle_management',
  'equipment_tracking',
  'resource_capacity',
  'venue_management',
  'transport_management',
  'advanced_event_control',
  'risk_engine',
  'advanced_incident_management',
  'advanced_finance',
  'costing',
  'profitability',
  'advanced_analytics',
  'exports',
  'offline_sync',
  'qr_scanning',
  'digital_handover',
] as const;

export type ProductMode = 'BASIC' | 'PREMIUM' | 'CUSTOM';

/** Tentukan mode produk dari kapabilitas aktif. */
export function detectMode(caps: Array<{ capability: string; enabled: boolean }>): ProductMode {
  const on = new Set(caps.filter((c) => c.enabled).map((c) => c.capability));
  const premOn = (PREMIUM_CAPABILITIES as readonly string[]).filter((c) => on.has(c));
  if (premOn.length === 0) return 'BASIC';
  if (premOn.length === PREMIUM_CAPABILITIES.length) return 'PREMIUM';
  return 'CUSTOM';
}

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
  '/notifications': 'basic_notifications',
  '/analytics': 'advanced_analytics',
};

export function canAccess(route: string, caps: Record<string, boolean>): boolean {
  const need = ROUTE_CAPABILITIES[route];
  if (!need) return true;
  return caps[need] === true;
}
