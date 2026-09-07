import { NextResponse } from "next/server";
import { BUSINESS_ID } from "@/lib/constants";
import { createAnonServerClient } from "@/lib/supabase-server";
import { inquirySchema } from "@/lib/validators";

// POST /api/inquiries — inquiry pelanggan baru (anon, policy inquiries_anon_insert).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Isian belum valid.", details: parsed.error.errors },
      { status: 400 }
    );
  }
  const v = parsed.data;
  const sb = createAnonServerClient();
  if (!sb) {
    return NextResponse.json(
      { error: "Layanan belum terkonfigurasi. Hubungi kami via WhatsApp." },
      { status: 503 }
    );
  }
  const tanggal = v.tanggal || null;
  const { data, error } = await sb
    .from("inquiries")
    .insert({
      business_id: BUSINESS_ID,
      contact_name: v.nama,
      contact_phone: v.phone,
      event_type: v.tipeAcara,
      event_date: tanggal,
      venue_text: v.venue || null,
      pax: v.pax,
      menu_notes: v.catatan || null,
      vegetarian: v.vegetarian,
      vegan: v.vegan,
      allergies: v.allergies,
      dietary_notes: v.dietaryNotes || null,
      status: "NEW",
    })
    .select("id")
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "Gagal menyimpan. Coba lagi.", code: error?.code }, { status: 500 });
  }
  return NextResponse.json({ id: (data as { id: string }).id }, { status: 201 });
}
