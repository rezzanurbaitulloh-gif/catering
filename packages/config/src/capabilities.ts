// Capability registry: single source of truth for Basic vs Premium gating.
// Server derives the map per business; clients gate routes/nav AND server re-checks.

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

export type Capability = (typeof BASIC_CAPABILITIES)[number] | (typeof PREMIUM_CAPABILITIES)[number];

export const PREMIUM_SET = new Set<string>(PREMIUM_CAPABILITIES as readonly string[]);

export function isPremiumCapability(cap: string): boolean {
  return PREMIUM_SET.has(cap);
}

/** Route → required capability. Missing capability = route does not exist (404, no upsell UI). */
export const ROUTE_CAPABILITIES: Record<string, string> = {
  // admin web
  '/dashboard': 'event_management',
  '/orders': 'basic_orders',
  '/customers': 'customer_management',
  '/packages': 'package_management',
  '/events': 'event_management',
  '/control': 'advanced_event_control',
  '/risks': 'risk_engine',
  '/leads': 'crm',
  '/quotations': 'advanced_quotation',
  '/change-requests': 'change_request',
  '/production': 'production_planning',
  '/recipes': 'recipe_bom',
  '/inventory': 'inventory',
  '/procurement': 'procurement',
  '/workforce': 'workforce_management',
  '/vehicles': 'vehicle_management',
  '/equipment': 'equipment_tracking',
  '/venues': 'venue_management',
  '/transport': 'transport_management',
  '/finance': 'basic_finance',
  '/costing': 'costing',
  '/profitability': 'profitability',
  '/analytics': 'advanced_analytics',
  '/incidents': 'basic_incidents',
  // customer web
  '/track': 'basic_orders',
  '/quote': 'advanced_quotation',
  '/account': 'customer_accounts',
};

export function canAccess(route: string, caps: Record<string, boolean>): boolean {
  const need = ROUTE_CAPABILITIES[route];
  if (!need) return true;
  return caps[need] === true;
}

export const ROLE_CAPABILITIES: Record<string, string[]> = {
  owner: [...BASIC_CAPABILITIES, ...PREMIUM_CAPABILITIES],
  admin: [...BASIC_CAPABILITIES, ...PREMIUM_CAPABILITIES],
  sales: ['basic_orders', 'customer_management', 'package_management', 'event_management', 'crm', 'advanced_quotation', 'quotation_versioning', 'quote_approval', 'change_request', 'basic_notifications'],
  finance: ['basic_finance', 'advanced_finance', 'costing', 'profitability', 'basic_orders', 'event_management', 'exports'],
  kitchen: ['event_management', 'production_planning', 'recipe_bom', 'basic_checklists', 'basic_incidents', 'basic_notifications'],
  operations: ['event_management', 'basic_staff', 'workforce_management', 'vehicle_management', 'equipment_tracking', 'transport_management', 'venue_management', 'advanced_event_control', 'basic_checklists', 'digital_handover', 'qr_scanning', 'offline_sync'],
  driver: ['transport_management', 'basic_checklists', 'digital_handover', 'offline_sync', 'basic_notifications'],
  staff: ['basic_checklists', 'basic_notifications', 'offline_sync'],
  supervisor: [...BASIC_CAPABILITIES, 'advanced_event_control', 'risk_engine', 'advanced_incident_management', 'workforce_management', 'digital_handover'],
  customer: ['basic_orders'],
};
