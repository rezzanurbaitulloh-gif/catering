import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import { BUSINESS_ID, CONTACT_FALLBACK } from "@/lib/constants";
import { waLink } from "@/lib/format";
import { createAnonServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Kontak",
  description: "Hubungi Rasa Nusantara Catering: alamat, telepon, WhatsApp, email, dan jam operasional.",
};

export const dynamic = "force-dynamic";

async function getContact() {
  const fallback = {
    whatsapp: CONTACT_FALLBACK.whatsapp,
    address: CONTACT_FALLBACK.address,
    phone: CONTACT_FALLBACK.phone,
    email: CONTACT_FALLBACK.email,
    hours: CONTACT_FALLBACK.hours,
  };
  const sb = createAnonServerClient();
  if (!sb) return fallback;
  try {
    const [contactRes, settingsRes] = await Promise.all([
      sb.from("website_content").select("value").eq("business_id", BUSINESS_ID).eq("key", "contact").maybeSingle(),
      sb.from("business_settings").select("*").eq("business_id", BUSINESS_ID).maybeSingle(),
    ]);
    const c = (contactRes.data?.value ?? {}) as Record<string, unknown>;
    const s = (settingsRes.data ?? {}) as Record<string, unknown>;
    const hours = s.operating_hours as Record<string, string> | undefined;
    return {
      whatsapp: typeof c.whatsapp === "string" ? c.whatsapp : typeof s.whatsapp === "string" ? s.whatsapp : fallback.whatsapp,
      address: typeof c.address === "string" ? c.address : typeof s.address === "string" ? s.address : fallback.address,
      phone: typeof s.phone === "string" ? s.phone : fallback.phone,
      email: typeof s.email === "string" ? s.email : fallback.email,
      hours: hours ? Object.entries(hours).map(([k, v]) => `${k}: ${v}`).join(" · ") : fallback.hours,
    };
  } catch {
    return fallback;
  }
}

export default async function KontakPage() {
  const c = await getContact();
  const wa = waLink(c.whatsapp, "Halo Rasa Nusantara Catering, saya ingin bertanya.");
  return (
    <div className="container-x py-10">
      <p className="kicker">Sapa Kami</p>
      <h1 className="mt-2 font-display text-4xl font-bold">Kontak</h1>
      <div className="rule-gold my-4" aria-hidden="true" />

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="info-kontak" className="card h-fit">
          <h2 id="info-kontak" className="font-display text-2xl font-bold">Informasi</h2>
          <address className="mt-4 space-y-3 text-sm not-italic leading-relaxed">
            <p><strong>Alamat</strong><br />{c.address}</p>
            <p><strong>Telepon</strong><br />{c.phone}</p>
            <p><strong>WhatsApp</strong><br />
              <a href={wa} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold-deep underline">{c.whatsapp}</a>
            </p>
            <p><strong>Email</strong><br />{c.email}</p>
            <p><strong>Jam operasional</strong><br />{c.hours}</p>
          </address>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-gold mt-5 w-full text-sm">Chat WhatsApp Sekarang</a>
        </section>

        <section aria-labelledby="form-tanya" className="card h-fit">
          <h2 id="form-tanya" className="font-display text-2xl font-bold">Formulir Tanya-Jawab</h2>
          <p className="mt-1 text-sm text-ink/70">
            Tulis pertanyaan Anda — tersimpan sebagai arsip tanya-jawab dan dibalas tim kami via WhatsApp.
          </p>
          <ContactForm />
        </section>
      </div>
    </div>
  );
}
