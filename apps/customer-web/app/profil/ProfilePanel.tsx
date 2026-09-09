"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCustomerAuth } from "@/lib/auth";
import { supabaseBrowser } from "@/lib/supabase-browser";

interface Addr {
  id: string;
  label: string;
  address: string;
  maps_url: string | null;
}

// Profil + alamat milik sendiri (RLS). Alamat event dicatat per event
// (snapshot venue) — profil boleh berubah tanpa mengubah riwayat.
export default function ProfilePanel() {
  const { user, customer, loading, refresh } = useCustomerAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addrs, setAddrs] = useState<Addr[]>([]);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ label: "Rumah", address: "", maps_url: "" });

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
    }
  }, [customer]);

  useEffect(() => {
    if (!customer) return;
    (async () => {
      const { data } = await supabaseBrowser()!
        .from("customer_addresses")
        .select("id,label,address,maps_url")
        .eq("customer_id", customer.id)
        .order("label");
      setAddrs((data ?? []) as Addr[]);
    })();
  }, [customer]);

  if (loading) return <p className="text-sm text-muted">Memuat profil…</p>;
  if (!user) {
    return (
      <div className="rounded-brand border border-line bg-white p-5 text-center text-sm">
        <p className="font-bold">Masuk dulu untuk kelola profil.</p>
        <p className="mt-3 flex justify-center gap-3">
          <Link href="/masuk" className="btn-gold">Masuk</Link>
          <Link href="/daftar" className="btn-outline">Daftar</Link>
        </p>
      </div>
    );
  }
  if (!customer) {
    return (
      <p className="rounded-brand border border-[#B45309]/40 bg-[#B45309]/5 p-4 text-sm" role="status">
        Akun Auth terdaftar, tetapi data pelanggan belum tertaut. Pesan sekali via{" "}
        <Link href="/booking" className="font-bold underline">Booking</Link> dengan nomor WhatsApp yang sama,
        lalu hubungi admin untuk penautan — atau daftar ulang dengan email lain.
      </p>
    );
  }

  async function save() {
    if (!customer) return;
    if (name.trim().length < 3) return setMsg({ kind: "err", text: "Nama minimal 3 huruf." });
    if (!/^(\+62|62|0)8[\d\s\-.()]{7,15}$/.test(phone.trim())) return setMsg({ kind: "err", text: "Nomor WhatsApp tidak valid." });
    setBusy(true);
    setMsg(null);
    const { error } = await supabaseBrowser()!
      .from("customers")
      .update({ name: name.trim(), phone: phone.trim() })
      .eq("id", customer.id);
    setBusy(false);
    if (error) setMsg({ kind: "err", text: error.message });
    else {
      setMsg({ kind: "ok", text: "Profil tersimpan ✓" });
      refresh();
    }
  }

  async function addAddr() {
    if (!customer) return;
    if (f.address.trim().length < 10) return setMsg({ kind: "err", text: "Alamat minimal 10 huruf." });
    setBusy(true);
    setMsg(null);
    const { error } = await supabaseBrowser()!.from("customer_addresses").insert({
      business_id: customer.business_id,
      customer_id: customer.id,
      label: f.label.trim() || "Rumah",
      address: f.address.trim(),
      maps_url: f.maps_url.trim() || null,
    });
    setBusy(false);
    if (error) setMsg({ kind: "err", text: error.message });
    else {
      setF({ label: "Rumah", address: "", maps_url: "" });
      setMsg({ kind: "ok", text: "Alamat ditambahkan ✓" });
      const { data } = await supabaseBrowser()!.from("customer_addresses").select("id,label,address,maps_url").eq("customer_id", customer.id).order("label");
      setAddrs((data ?? []) as Addr[]);
    }
  }

  async function delAddr(id: string) {
    const { error } = await supabaseBrowser()!.from("customer_addresses").delete().eq("id", id);
    if (!error) setAddrs(addrs.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-5">
      {msg ? (
        <p role={msg.kind === "err" ? "alert" : "status"} className={`rounded-brand border p-3 text-sm ${msg.kind === "err" ? "border-[#B91C1C]/40 bg-[#B91C1C]/5 text-[#B91C1C]" : "border-[#15803D]/40 bg-[#15803D]/5 text-[#15803D]"}`}>
          {msg.text}
        </p>
      ) : null}
      <section className="rounded-brand border border-line bg-white p-4">
        <h2 className="font-display text-lg font-bold">Data diri</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="p-nama" className="label">Nama lengkap</label>
            <input id="p-nama" className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
          <div>
            <label htmlFor="p-phone" className="label">WhatsApp</label>
            <input id="p-phone" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">Email: {customer.email ?? user.email} (tidak dapat diubah di sini)</p>
        <button type="button" onClick={save} disabled={busy} className="btn-gold mt-3">
          {busy ? "Menyimpan…" : "Simpan Profil"}
        </button>
      </section>

      <section className="rounded-brand border border-line bg-white p-4">
        <h2 className="font-display text-lg font-bold">Alamat saya ({addrs.length})</h2>
        <p className="text-xs text-muted">Untuk pengiriman & referensi. Lokasi tiap acara dicatat terpisah dan tidak ikut berubah.</p>
        <ul className="mt-3 space-y-2">
          {addrs.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 rounded-lg border border-line p-3 text-sm">
              <div>
                <p className="font-bold">{a.label}</p>
                <p className="text-ink/70">{a.address}</p>
                {a.maps_url ? <a href={a.maps_url} target="_blank" rel="noreferrer" className="font-bold text-gold-deep underline">Lihat peta</a> : null}
              </div>
              <button type="button" onClick={() => delAddr(a.id)} className="text-sm font-bold text-[#B91C1C] underline">Hapus</button>
            </li>
          ))}
          {addrs.length === 0 ? <li className="text-sm text-muted">Belum ada alamat tersimpan.</li> : null}
        </ul>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <input className="field" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="Label (Rumah/Kantor)" aria-label="Label alamat" />
          <input className="field sm:col-span-2" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Jalan, desa, kecamatan, kota" aria-label="Alamat" />
          <input className="field sm:col-span-2" value={f.maps_url} onChange={(e) => setF({ ...f, maps_url: e.target.value })} placeholder="Link Google Maps (opsional)" aria-label="Link peta" />
          <button type="button" onClick={addAddr} disabled={busy} className="btn-outline">+ Alamat</button>
        </div>
      </section>
    </div>
  );
}
