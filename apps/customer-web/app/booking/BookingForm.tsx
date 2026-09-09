"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ALLERGY_OPTIONS, BUSINESS_ID } from "@/lib/constants";
import { clearCart, readCart, type CartSelection } from "@/lib/cart";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { PackageRow } from "@/lib/types";

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

interface Props {
  tipeList: string[];
  paketAwal: PackageRow | null;
}

// Formulir inquiry -> POST /api/inquiries. Pilihan cart-lite (localStorage) otomatis terbawa ke catatan.
export default function BookingForm({ tipeList, paketAwal }: Props) {
  const [nama, setNama] = useState("");
  const [phone, setPhone] = useState("");
  const [tanggal, setTanggal] = useState(todayPlus(30));
  const [tipeAcara, setTipeAcara] = useState(tipeList[0] ?? "Pernikahan");
  const [pax, setPax] = useState("200");
  const [venue, setVenue] = useState("");
  const [catatan, setCatatan] = useState("");
  const [vegetarian, setVegetarian] = useState("0");
  const [vegan, setVegan] = useState("0");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [cart, setCart] = useState<CartSelection | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [failMsg, setFailMsg] = useState("");
  const [inquiryId, setInquiryId] = useState<string | null>(null);

  useEffect(() => {
    const c = readCart();
    setCart(c);
    if (c && Number.isFinite(c.pax) && c.pax > 0) setPax(String(c.pax));
  }, []);

  const cartSummary = useMemo(() => {
    if (!cart && !paketAwal) return "";
    const name = paketAwal?.name ?? cart?.packageName ?? "";
    if (!name) return "";
    return `Paket dipilih: ${name}${cart ? ` (${cart.pax} pax, add-on: ${cart.addonIds.length} item)` : ""}`;
  }, [cart, paketAwal]);

  function toggleAllergy(a: string) {
    setAllergies((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (nama.trim().length < 3) errs.nama = "Nama minimal 3 huruf.";
    if (!/^(\+62|62|0)8[\d\s\-.()]{7,15}$/.test(phone.trim())) errs.phone = "Nomor WhatsApp tidak valid. Contoh: 081234567890.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) errs.tanggal = "Pilih tanggal acara.";
    else if (tanggal < todayPlus(0)) errs.tanggal = "Tanggal acara tidak boleh di masa lalu.";
    const paxN = Number(pax);
    if (!Number.isInteger(paxN) || paxN < 1) errs.pax = "Jumlah tamu minimal 1.";
    else if (paxN > 20000) errs.pax = "Jumlah tamu maksimal 20.000.";
    const vegN = Number(vegetarian);
    const veganN = Number(vegan);
    if (!Number.isInteger(vegN) || vegN < 0) errs.vegetarian = "Isi angka 0 atau lebih.";
    if (!Number.isInteger(veganN) || veganN < 0) errs.vegan = "Isi angka 0 atau lebih.";
    if (vegN + veganN > paxN) errs.vegetarian = "Porsi vegetarian/vegan melebihi jumlah tamu.";
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById("form-error-ringkas")?.focus();
      return;
    }

    setState("sending");
    setFailMsg("");
    const catatanFull = [cartSummary, catatan.trim()].filter(Boolean).join("\n");
    const payload = {
      nama: nama.trim(),
      phone: phone.trim(),
      tanggal,
      tipeAcara,
      pax: paxN,
      venue: venue.trim(),
      catatan: catatanFull,
      vegetarian: vegN,
      vegan: veganN,
      allergies,
      dietaryNotes: dietaryNotes.trim(),
    };
    try {
      // Bila login + profil tertaut: catat sebagai inquiry milik akun (customer_id terisi).
      // Selain itu (anonim / belum tertaut): lewat API publik.
      const sb = supabaseBrowser();
      const { data: sess } = await sb?.auth.getSession() ?? { data: { session: null } };
      let linkedId: string | null = null;
      if (sess?.session && sb) {
        const { data: me } = await sb
          .from("customers")
          .select("id")
          .eq("auth_user_id", sess.session.user.id)
          .maybeSingle();
        linkedId = (me as { id: string } | null)?.id ?? null;
      }
      if (linkedId && sb) {
        const { data: ins, error: insErr } = await sb
          .from("inquiries")
          .insert({
            business_id: BUSINESS_ID,
            customer_id: linkedId,
            contact_name: payload.nama,
            contact_phone: payload.phone,
            event_type: payload.tipeAcara,
            event_date: tanggal || null,
            venue_text: payload.venue || null,
            pax: payload.pax,
            menu_notes: payload.catatan || null,
            vegetarian: payload.vegetarian,
            vegan: payload.vegan,
            allergies: payload.allergies,
            dietary_notes: payload.dietaryNotes || null,
            status: "NEW",
          })
          .select("id")
          .single();
        if (insErr || !ins) throw new Error("Gagal menyimpan. Coba lagi.");
        setInquiryId((ins as { id: string }).id);
        clearCart();
        setState("done");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { id?: string; error?: string; details?: Array<{ message?: string }> };
      if (!res.ok) {
        setFailMsg(data.details?.[0]?.message ?? data.error ?? "Gagal mengirim. Coba lagi.");
        setState("failed");
        return;
      }
      setInquiryId(data.id ?? null);
      clearCart();
      setState("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFailMsg("Jaringan bermasalah. Periksa koneksi lalu coba lagi.");
      setState("failed");
    }
  }

  if (state === "done") {
    return (
      <div className="p-2 text-center" role="status">
        <p className="kicker">Terkirim</p>
        <h2 className="mt-2 font-display text-3xl font-bold">Permintaan diterima ✓</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink/70">
          Terima kasih, <strong>{nama}</strong>. Tim kami akan menghubungi <strong>{phone}</strong> via
          WhatsApp beserta penawaran tertulis. Simpan nomor arsip berikut untuk melacak:
        </p>
        <p className="mx-auto mt-4 w-fit rounded-brand border border-gold/40 bg-gold-soft px-5 py-3 font-mono text-sm font-bold text-gold-deep" aria-label="Nomor arsip inquiry">
          {inquiryId ?? "—"}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/lacak" className="btn-gold">Lacak Pesanan</Link>
          <Link href="/" className="btn-outline">Kembali ke Beranda</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {Object.keys(errors).length ? (
        <p id="form-error-ringkas" tabIndex={-1} className="rounded-brand border border-[#B91C1C]/40 bg-[#B91C1C]/5 p-3 text-sm font-semibold text-[#B91C1C]" role="alert">
          Ada {Object.keys(errors).length} isian yang perlu diperbaiki di bawah.
        </p>
      ) : null}

      {cartSummary ? (
        <p className="rounded-brand border border-gold/40 bg-gold-soft p-3 text-sm" role="status">
          <strong>Ringkasan pilihan:</strong> {cartSummary}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="b-nama" className="label">Nama lengkap <span aria-hidden="true" className="text-clay">*</span></label>
          <input id="b-nama" className="field" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="cth: Budi Santoso" autoComplete="name" aria-invalid={Boolean(errors.nama)} />
          {errors.nama ? <p className="error-text" role="alert">{errors.nama}</p> : null}
        </div>
        <div>
          <label htmlFor="b-phone" className="label">Nomor WhatsApp <span aria-hidden="true" className="text-clay">*</span></label>
          <input id="b-phone" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="081234567890" inputMode="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} />
          {errors.phone ? <p className="error-text" role="alert">{errors.phone}</p> : null}
        </div>
        <div>
          <label htmlFor="b-tanggal" className="label">Tanggal acara <span aria-hidden="true" className="text-clay">*</span></label>
          <input id="b-tanggal" type="date" className="field" value={tanggal} min={todayPlus(0)} onChange={(e) => setTanggal(e.target.value)} aria-invalid={Boolean(errors.tanggal)} />
          {errors.tanggal ? <p className="error-text" role="alert">{errors.tanggal}</p> : null}
        </div>
        <div>
          <label htmlFor="b-tipe" className="label">Tipe acara <span aria-hidden="true" className="text-clay">*</span></label>
          <select id="b-tipe" className="field" value={tipeAcara} onChange={(e) => setTipeAcara(e.target.value)}>
            {tipeList.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor="b-pax" className="label">Jumlah tamu (pax) <span aria-hidden="true" className="text-clay">*</span></label>
          <input id="b-pax" type="number" inputMode="numeric" min={1} max={20000} className="field" value={pax} onChange={(e) => setPax(e.target.value)} aria-invalid={Boolean(errors.pax)} />
          {errors.pax ? <p className="error-text" role="alert">{errors.pax}</p> : null}
        </div>
        <div>
          <label htmlFor="b-venue" className="label">Lokasi / gedung</label>
          <input id="b-venue" className="field" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="cth: Gedung Serbaguna Nganjuk" autoComplete="off" />
        </div>
      </div>

      <fieldset className="rounded-brand border border-line p-4">
        <legend className="px-2 font-display text-lg font-bold">Kebutuhan diet tamu</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="b-veg" className="label">Porsi vegetarian</label>
            <input id="b-veg" type="number" inputMode="numeric" min={0} className="field" value={vegetarian} onChange={(e) => setVegetarian(e.target.value)} aria-invalid={Boolean(errors.vegetarian)} />
            {errors.vegetarian ? <p className="error-text" role="alert">{errors.vegetarian}</p> : null}
          </div>
          <div>
            <label htmlFor="b-vegan" className="label">Porsi vegan</label>
            <input id="b-vegan" type="number" inputMode="numeric" min={0} className="field" value={vegan} onChange={(e) => setVegan(e.target.value)} aria-invalid={Boolean(errors.vegan)} />
            {errors.vegan ? <p className="error-text" role="alert">{errors.vegan}</p> : null}
          </div>
        </div>
        <div className="mt-4">
          <span className="label" id="alergi-label">Alergi yang perlu diwaspadai</span>
          <ul aria-labelledby="alergi-label" className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ALLERGY_OPTIONS.map((a) => (
              <li key={a}>
                <label className="touch flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm has-[:checked]:border-gold has-[:checked]:bg-gold-soft">
                  <input type="checkbox" className="h-5 w-5 accent-[#B45309]" checked={allergies.includes(a)} onChange={() => toggleAllergy(a)} />
                  {a}
                </label>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4">
          <label htmlFor="b-diet-note" className="label">Catatan diet lain</label>
          <input id="b-diet-note" className="field" value={dietaryNotes} onChange={(e) => setDietaryNotes(e.target.value)} placeholder="cth: 3 tamu VIP meja 2 alergi udang" />
        </div>
      </fieldset>

      <div>
        <label htmlFor="b-catatan" className="label">Catatan tambahan</label>
        <textarea id="b-catatan" className="field min-h-[110px]" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="urutan acara, permintaan dekorasi, dan lain-lain…" />
      </div>

      {state === "failed" ? <p className="error-text" role="alert">{failMsg}</p> : null}
      <button type="submit" className="btn-gold w-full text-base" disabled={state === "sending"}>
        {state === "sending" ? "Mengirim…" : "Kirim Permintaan Penawaran"}
      </button>
      <p className="text-center text-xs text-muted">Dengan mengirim, Anda setuju dihubungi tim kami via WhatsApp.</p>
    </form>
  );
}
