// Tipe baris Supabase (ringkas, mengikuti supabase/migrations/0001_init.sql).

export interface EventRow {
  id: string;
  business_id: string;
  event_no: string;
  customer_id: string | null;
  title: string;
  event_type: string;
  event_date: string;
  start_at: string | null;
  venue_id: string | null;
  venue_text: string | null;
  pax_estimated: number;
  pax_quoted: number;
  pax_confirmed: number;
  pax_final: number | null;
  pax_locked: boolean;
  status: string;
  payment_status: string;
  service_style: string | null;
  vegetarian: number;
  vegan: number;
  allergies: string[];
  dietary_notes: string | null;
  special_instructions: string | null;
}

export interface InquiryRow {
  id: string;
  business_id: string;
  customer_id: string | null;
  contact_name: string;
  contact_phone: string;
  event_type: string;
  event_date: string;
  venue_text: string | null;
  pax: number;
  menu_notes: string | null;
  status: string;
  created_at: string;
}

export interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  source: string | null;
  total_spent: number;
  event_count: number;
  last_event_at: string | null;
}

export interface QuoteRow {
  id: string;
  business_id: string;
  inquiry_id: string | null;
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
  items: { name: string; qty: number; unit_price: number; per_pax: boolean }[];
  subtotal: number;
  discount: number;
  total: number;
  change_summary: string | null;
  approved_at: string | null;
}

export interface IncidentRow {
  id: string;
  business_id: string;
  event_id: string | null;
  incident_no: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  financial_impact: number;
  created_at: string;
}

export interface LeadRow {
  id: string;
  name: string;
  phone: string;
  source: string | null;
  event_type: string | null;
  estimated_pax: number | null;
  estimated_date: string | null;
  status: string;
  created_at: string;
}

export interface ChangeRequestRow {
  id: string;
  business_id: string;
  event_id: string;
  type: string;
  payload: Record<string, number | string>;
  impact: Record<string, number | boolean | string> | null;
  status: string;
  created_at: string;
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
  created_at: string;
}

export interface ExpenseRow {
  id: string;
  business_id: string;
  event_id: string | null;
  category: string;
  amount: number;
  note: string | null;
  spent_at: string;
}
