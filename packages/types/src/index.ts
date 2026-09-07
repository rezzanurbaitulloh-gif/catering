// Shared domain truth for Customer Web + Admin Web.
// Flutter consumes the same shapes via the REST contract (see packages/api).

export type ID = string;

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST' | 'CONVERTED';
export type QuoteStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'REVISION_REQUESTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
export type BookingStatus = 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type EventStatus =
  | 'PLANNING' | 'LOCKED' | 'IN_PREPARATION' | 'IN_TRANSIT'
  | 'SETUP' | 'SERVICE' | 'BREAKDOWN' | 'COMPLETED' | 'CLOSED';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'FAILED' | 'REFUNDED';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'ACTION_REQUIRED' | 'RESOLVED' | 'CLOSED';
export type ProductionStatus = 'PLANNED' | 'PREPARING' | 'PRODUCING' | 'QC' | 'COMPLETED';
export type SyncState = 'PENDING_SYNC' | 'SYNCING' | 'SYNCED' | 'FAILED';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type Role =
  | 'owner' | 'admin' | 'sales' | 'finance' | 'kitchen'
  | 'operations' | 'driver' | 'staff' | 'supervisor' | 'customer';

export interface Business { id: ID; name: string; slug: string; currency: string; created_at: string; }
export interface BusinessCapability { business_id: ID; capability: string; enabled: boolean; }

export interface Profile { id: ID; business_id: ID | null; role: Role; full_name: string; phone: string | null; }

export interface Customer {
  id: ID; business_id: ID; name: string; phone: string; email: string | null;
  address: string | null; source: string | null; notes: string | null;
  total_spent: number; event_count: number; last_event_at: string | null; created_at: string;
}

export interface Lead {
  id: ID; business_id: ID; name: string; phone: string; source: string | null;
  event_type: string | null; estimated_pax: number | null; estimated_date: string | null;
  status: LeadStatus; lost_reason: string | null; created_at: string;
}

export interface Inquiry {
  id: ID; business_id: ID; customer_id: ID | null; lead_id: ID | null;
  event_type: string; event_date: string; venue_text: string | null; venue_id: ID | null;
  pax: number; menu_notes: string | null; dietary_notes: string | null;
  status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'BOOKED' | 'CLOSED' | 'DROPPED';
  created_at: string;
}

export interface Package {
  id: ID; business_id: ID; name: string; description: string | null;
  base_price_per_pax: number; min_pax: number; max_pax: number | null;
  image_url: string | null; is_active: boolean;
  items?: PackageItem[]; addons?: PackageAddon[];
}
export interface PackageItem { id: ID; package_id: ID; menu_item_id: ID | null; name: string; qty_per_pax: number; unit: string; }
export interface PackageAddon { id: ID; package_id: ID; name: string; price: number; per_pax: boolean; }
export interface MenuItem { id: ID; business_id: ID; name: string; category: string; description: string | null; image_url: string | null; is_active: boolean; }

export interface Quote {
  id: ID; business_id: ID; inquiry_id: ID | null; customer_id: ID | null;
  quote_no: string; status: QuoteStatus; subtotal: number; discount: number;
  total: number; valid_until: string | null; created_by: ID | null; created_at: string;
  versions?: QuoteVersion[];
}
export interface QuoteVersion {
  id: ID; quote_id: ID; version: number; pax: number; items: QuoteItemInput[];
  subtotal: number; discount: number; total: number;
  change_summary: string | null; created_by: ID | null; created_at: string;
  approved_at: string | null; approved_by: ID | null;
}
export interface QuoteItemInput { name: string; qty: number; unit_price: number; per_pax?: boolean; }

export interface ChangeRequest {
  id: ID; business_id: ID; event_id: ID; type: 'PAX' | 'MENU' | 'DATE' | 'VENUE' | 'ADDON' | 'EQUIPMENT' | 'DECOR' | 'DURATION';
  payload: Record<string, unknown>; impact: ChangeImpact | null;
  status: 'PENDING' | 'QUOTED' | 'APPROVED' | 'REJECTED' | 'APPLIED'; created_at: string;
}
export interface ChangeImpact {
  price_delta: number; ingredient_delta: { ingredient_id: ID; delta_qty: number }[];
  staffing_delta: number; vehicle_ok: boolean; equipment_ok: boolean;
  timeline_ok: boolean; availability_ok: boolean; profit_delta: number;
}

export interface Booking { id: ID; business_id: ID; event_id: ID; quote_id: ID | null; status: BookingStatus; booked_at: string; }

export interface Venue {
  id: ID; business_id: ID; name: string; address: string; maps_url: string | null;
  contact_name: string | null; contact_phone: string | null; access_notes: string | null;
  parking_notes: string | null; power_notes: string | null; restrictions: string | null;
  setup_notes: string | null; photo_urls: string[];
}

export interface Event {
  id: ID; business_id: ID; event_no: string; customer_id: ID | null;
  title: string; event_type: string; event_date: string; start_at: string | null; end_at: string | null;
  setup_at: string | null; venue_id: ID | null; venue_text: string | null;
  pax_estimated: number; pax_quoted: number; pax_confirmed: number; pax_final: number | null;
  pax_locked: boolean; status: EventStatus; payment_status: PaymentStatus;
  approved_quote_version_id: ID | null; service_style: string | null;
  dietary: DietaryInfo; special_instructions: string | null; created_at: string;
}
export interface DietaryInfo {
  vegetarian: number; vegan: number; allergies: string[]; intolerances: string[];
  special_meals: string | null; notes: string | null; acknowledged_by: ID | null;
}

export interface EventBrief extends Record<string, unknown> {
  event_id: ID; generated_at: string; snapshot: Record<string, unknown>;
}

export interface ProductionPlan {
  id: ID; business_id: ID; event_id: ID; status: ProductionStatus;
  target_qty: number; actual_qty: number | null; scheduled_at: string | null;
}
export interface ProductionBatch {
  id: ID; plan_id: ID; recipe_id: ID | null; name: string; status: ProductionStatus;
  target_qty: number; actual_qty: number | null; waste_qty: number;
}
export interface Recipe { id: ID; business_id: ID; menu_item_id: ID | null; name: string; yield_qty: number; yield_unit: string; items: RecipeItem[]; }
export interface RecipeItem { ingredient_id: ID; qty_per_yield: number; unit: string; }

export interface InventoryItem {
  id: ID; business_id: ID; ingredient_id: ID; sku: string; unit: string;
  stock: number; reserved: number; min_stock: number; expires_at: string | null; location: string | null;
}
export interface Shortage { ingredient_id: ID; ingredient_name: string; required: number; available: number; shortage: number; unit: string; }

export interface Payment {
  id: ID; business_id: ID; event_id: ID; amount: number; method: string;
  kind: 'DP' | 'FINAL' | 'FULL' | 'REFUND' | 'OTHER'; status: PaymentStatus;
  received_at: string | null; reference: string | null;
}
export interface Expense { id: ID; business_id: ID; event_id: ID | null; category: string; amount: number; note: string | null; spent_at: string; }
export interface Profitability {
  event_id: ID; revenue: number; food_cost: number; labor_cost: number;
  transport_cost: number; vendor_cost: number; other_cost: number;
  estimated_profit: number; actual_profit: number | null; margin_pct: number | null;
}

export interface Incident {
  id: ID; business_id: ID; event_id: ID | null; category: string; severity: Severity;
  title: string; description: string; status: IncidentStatus;
  owner_id: ID | null; financial_impact: number; resolution_note: string | null;
  created_at: string; resolved_at: string | null;
}

export interface RiskItem { category: string; level: RiskLevel; message: string; event_id: ID; }
export interface EventRisk { event_id: ID; event_no: string; level: RiskLevel; reasons: string[]; checked_at: string; }

export interface NotificationItem {
  id: ID; business_id: ID; user_id: ID | null; kind: string; title: string;
  body: string; event_id: ID | null; read_at: string | null; created_at: string;
}

export interface AuditLog {
  id: ID; business_id: ID; actor_id: ID | null; action: string; entity: string;
  entity_id: ID; before: unknown; after: unknown; created_at: string;
}

export interface CapabilityMap { [capability: string]: boolean; }

export interface PackingLine { name: string; category: 'FOOD' | 'EQUIPMENT' | 'SUPPORT'; required: number; packed: number; }
export interface Handover {
  id: ID; event_id: ID; departed_at: string | null; arrived_at: string | null;
  receiver_name: string | null; photo_urls: string[]; delivered: PackingLine[]; note: string | null;
}
