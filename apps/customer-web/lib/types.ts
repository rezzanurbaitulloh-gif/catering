// Tipe baris Supabase (cerminan supabase/migrations/0001_init.sql). Ditulis lokal, tanpa import workspace.

export interface PackageRow {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  base_price_per_pax: number;
  min_pax: number;
  max_pax: number | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PackageItemRow {
  id: string;
  package_id: string;
  menu_item_id: string | null;
  name: string;
  qty_per_pax: number;
  unit: string;
}

export interface PackageAddonRow {
  id: string;
  package_id: string;
  name: string;
  price: number;
  per_pax: boolean;
}

export interface TestimonialRow {
  id: string;
  business_id: string;
  customer_name: string;
  rating: number;
  message: string;
  event_type: string | null;
  is_published: boolean;
}

export interface GalleryRow {
  id: string;
  business_id: string;
  image_url: string;
  caption: string | null;
  sort: number;
}

export interface WebsiteContentRow {
  business_id: string;
  key: string;
  value: Record<string, unknown>;
}

export interface EventTypeRow {
  id: string;
  business_id: string | null;
  name: string;
  description: string | null;
}

export interface BusinessSettingsRow {
  business_id: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  operating_hours: Record<string, string>;
  payment_info: Record<string, string>;
}

export interface QuoteRow {
  id: string;
  business_id: string;
  customer_id: string | null;
  quote_no: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  valid_until: string | null;
  created_at: string;
}

export interface QuoteVersionRow {
  id: string;
  quote_id: string;
  version: number;
  pax: number;
  items: Array<{ name: string; qty: number; unit_price: number; per_pax: boolean }>;
  subtotal: number;
  discount: number;
  total: number;
  change_summary: string | null;
  created_at: string;
  approved_at: string | null;
}

export interface EventRow {
  id: string;
  business_id: string;
  event_no: string;
  customer_id: string | null;
  title: string;
  event_type: string;
  event_date: string;
  start_at: string | null;
  venue_text: string | null;
  pax_estimated: number;
  pax_quoted: number;
  pax_confirmed: number;
  pax_final: number | null;
  pax_locked: boolean;
  status: string;
  payment_status: string;
  vegetarian: number;
  vegan: number;
  allergies: string[];
  dietary_notes: string | null;
  special_instructions: string | null;
}

export interface PaymentRow {
  id: string;
  business_id: string;
  event_id: string;
  amount: number;
  method: string;
  kind: string;
  status: string;
  received_at: string | null;
  reference: string | null;
}

export interface TimelineRow {
  id: string;
  event_id: string;
  label: string;
  planned_at: string;
  done_at: string | null;
  owner: string | null;
}

export interface CustomerRow {
  id: string;
  business_id: string;
  name: string;
  phone: string;
}
