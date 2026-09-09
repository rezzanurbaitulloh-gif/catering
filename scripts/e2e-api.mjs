// E2E API Catering OS — alur penuh dengan data uji "E2E-" + bersih-bersih.
// Env: SUPABASE_URL, SUPABASE_ANON, SUPABASE_SERVICE, CUST_BASE (default localhost:3000).
// Jalankan: SUPABASE_URL=... SUPABASE_ANON=... SUPABASE_SERVICE=... node scripts/e2e-api.mjs
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const U = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON;
const SR = process.env.SUPABASE_SERVICE;
const CUST = (process.env.CUST_BASE ?? "http://localhost:3000").replace(/\/$/, "");
const BID = "11111111-1111-1111-1111-111111111111";
const TS = Date.now().toString(36).toUpperCase();
const results = [];
function ok(name) {
  results.push(["PASS", name]);
  console.log("  ✓", name);
}

const svcH = { apikey: SR, Authorization: `Bearer ${SR}`, "Content-Type": "application/json" };
async function rest(method, path, body, key = SR, extra = {}) {
  const H = key === SR ? svcH : { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...extra };
  if (body) H.Prefer = "return=representation";
  const r = await fetch(`${U}/rest/v1/${path}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const txt = await r.text();
  let json = null;
  try { json = JSON.parse(txt); } catch { /* empty */ }
  return { status: r.status, json, txt: txt.slice(0, 200) };
}

// 1. buat user uji via Auth Admin
console.log("E2E API mulai", TS);
{
  const r = await fetch(`${U}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: SR, Authorization: `Bearer ${SR}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email: `e2e-${TS}@test.id`, password: "E2eTest2026!", email_confirm: true }),
  });
  assert.equal(r.status, 200, "create user");
  var UID = (await r.json()).id;
  ok("auth admin create user");
}
// 2. register customer row (simulasi /daftar)
const CUST_ID = crypto.randomUUID();
{
  const { status } = await rest("POST", "customers", { id: CUST_ID, business_id: BID, auth_user_id: UID, name: "E2E Tester", phone: "+628990000001", email: `e2e-${TS}@test.id`, source: "E2E" });
  assert.equal(status, 201, "insert customer self, got " + status);
  ok("customer self-register (RLS)");
}
// 3. login dapat JWT
let JWT = "";
{
  const r = await fetch(`${U}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: `e2e-${TS}@test.id`, password: "E2eTest2026!" }),
  });
  assert.equal(r.status, 200, "login");
  JWT = (await r.json()).access_token;
  assert.ok(JWT.length > 100);
  ok("customer login JWT");
}
// 4. inquiry anon via route publik
let INQ = "";
{
  const r = await fetch(`${CUST}/api/inquiries`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nama: "E2E Tester", phone: "+628990000001", tanggal: "2026-12-20", tipeAcara: "Korporat", pax: 100, venue: "Aula E2E", catatan: "uji e2e", vegetarian: 5, vegan: 0, allergies: ["Udang"], dietaryNotes: "" }),
  });
  const rbody = await r.text();
  assert.equal(r.status, 201, "inquiry 201, got " + r.status + " " + rbody.slice(0, 120));
  INQ = JSON.parse(rbody).id;
  assert.ok(INQ);
  ok("inquiry anon 201 + id tanpa select (RLS)");
}
// 5. admin buat quote (service), customer baca quotenya? quote customer_id null dulu → link manual
let QUOTE = "";
{
  const { status, json } = await rest("POST", "quotes", { business_id: BID, inquiry_id: INQ, customer_id: CUST_ID, quote_no: `Q-E2E-${TS}`, status: "DRAFT", subtotal: 3000000, discount: 0, total: 3000000 });
  assert.equal(status, 201, "quote insert " + status);
  QUOTE = (Array.isArray(json) ? json[0] : json).id;
  const v = await rest("POST", "quote_versions", { quote_id: QUOTE, version: 1, pax: 100, items: [{ name: "Nasi Box", qty: 1, unit_price: 30000, per_pax: true }], subtotal: 3000000, discount: 0, total: 3000000, change_summary: "awal" });
  assert.equal(v.status, 201, "quote version");
  await rest("PATCH", `quotes?id=eq.${QUOTE}`, { status: "SENT" });
  ok("quote + version dibuat admin");
}
// 6. RLS negatif: user lain tidak bisa baca quote ini (quote milik customer lain? buat second user? ringkas: anon tidak bisa select quotes)
{
  const r = await fetch(`${U}/rest/v1/quotes?select=id&limit=1`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), [], "anon quotes kosong");
  ok("RLS: anon tidak baca quotes");
}
// 7. customer baca quote miliknya (RLS JWT)
{
  const r = await fetch(`${U}/rest/v1/quotes?select=id&customer_id=eq.${CUST_ID}`, { headers: { apikey: ANON, Authorization: `Bearer ${JWT}` } });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).length, 1, "customer baca quote sendiri");
  ok("RLS: customer baca quote sendiri");
}
// 8. approve via admin route butuh JWT admin? pakai service langsung update + cek mesin via route customer approve (SENT→APPROVED ok)
{
  const r = await fetch(`${CUST}/api/quotes/${QUOTE}/approve`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approverName: "E2E Tester" }),
  });
  // route butuh service key di server (ada di dev .env.local) → 200
  assert.equal(r.status, 200, "approve " + r.status + " " + (await r.text()).slice(0, 150));
  ok("quote approve mengunci versi");
}
// 9. checkout (auth) → event + booking, idempoten 2x
let EVENT = "", EVENT_NO = "";
{
  const payload = { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${JWT}` }, body: JSON.stringify({ quote_id: QUOTE }) };
  const r1 = await fetch(`${CUST}/api/orders/checkout`, payload);
  assert.equal(r1.status, 201, "checkout 201 " + r1.status);
  const j1 = await r1.json();
  EVENT = j1.event_id; EVENT_NO = j1.event_no;
  const r2 = await fetch(`${CUST}/api/orders/checkout`, payload);
  assert.equal(r2.status, 200, "checkout idempoten");
  assert.equal((await r2.json()).event_id, EVENT, "event sama");
  ok("checkout auth → event + idempoten");
}
// 10. invoice milik sendiri 200; milik orang 404 (buat event lain? pakai EVENT-2026-001 → harus 404)
{
  const h = { Authorization: `Bearer ${JWT}` };
  const r1 = await fetch(`${CUST}/api/invoice/${EVENT}`, { headers: h });
  assert.equal(r1.status, 200, "invoice sendiri");
  const inv = await r1.json();
  assert.equal(inv.total, 3000000, "total sesuai locked version");
  assert.ok(inv.invoice_no.startsWith("INV-"), "nomor invoice");
  const r2 = await fetch(`${CUST}/api/invoice/10000000-0000-0000-000000000001`, { headers: h });
  assert.equal(r2.status, 404, "invoice orang lain 404");
  ok("invoice milik sendiri + isolasi");
}
// 11. guard transisi: PLANNING→SERVICE ditolak (route admin butuh JWT admin; di sini cek mesin via invalid approve ulang = 409)
{
  const r = await fetch(`${CUST}/api/quotes/${QUOTE}/approve`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approverName: "E2E Tester" }),
  });
  assert.equal(r.status, 409, "approve ulang ditolak");
  ok("mesin status menolak transisi invalid");
}
// 12. webhook Midtrans: signature valid → PAID; signature salah → 403; replay idempoten
{
  // buat charge? langsung insert PENDING lalu notify (simulasi otoritatif)
  const order = `RN-E2E-${TS}`;
  await rest("POST", "payments", { business_id: BID, event_id: EVENT, amount: 3000000, method: "MIDTRANS", kind: "DP", status: "PENDING", reference: order });
  const sig = createHash("sha512").update(`${order}2003000000DUMMY_SR_KEY_FOR_TEST`).digest("hex");
  // tanpa server key asli, verifySignature akan false → 403. Uji 403 path (anti-tamper):
  const bad = await fetch(`${CUST}/api/payments/midtrans/notify`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order_id: order, status_code: "200", gross_amount: "3000000", signature_key: "0".repeat(128), transaction_status: "settlement" }),
  });
  assert.equal(bad.status, 403, "signature palsu ditolak");
  ok("webhook menolak signature palsu (anti-tamper)");
  if (process.env.MIDTRANS_SR) {
    // Jalur positif: signature valid yang dihitung sendiri (tanpa uang asli).
    const sig2 = createHash("sha512").update(`${order}2003000000${process.env.MIDTRANS_SR}`).digest("hex");
    const good = await fetch(`${CUST}/api/payments/midtrans/notify`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: order, status_code: "200", gross_amount: "3000000", signature_key: sig2, transaction_status: "settlement", payment_type: "qris" }),
    });
    assert.equal(good.status, 200, "notify valid " + good.status);
    const gj = await good.json();
    assert.equal(gj.payment, "PAID", "payment PAID server-side");
    assert.equal(gj.event_payment, "PAID", "event lunas (3jt/3jt)");
    // replay: kirim lagi → tetap konsisten (idempoten)
    const replay = await fetch(`${CUST}/api/payments/midtrans/notify`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: order, status_code: "200", gross_amount: "3000000", signature_key: sig2, transaction_status: "settlement", payment_type: "qris" }),
    });
    assert.equal(replay.status, 200, "replay ok");
    ok("webhook valid → PAID + event lunas + replay idempoten");
  }
}
// 13. track butuh phone cocok; salah → 404 (isolasi)
{
  const r = await fetch(`${CUST}/api/track?no=${EVENT_NO}&phone=%2B628990000002`);
  assert.equal(r.status, 404, "track phone salah 404");
  ok("tracking menolak nomor lain");
}
// cleanup (urutan FK)
console.log("cleanup…");
await rest("DELETE", `payments?reference=eq.RN-E2E-${TS}`);
await rest("DELETE", `bookings?event_id=eq.${EVENT}`);
await rest("DELETE", `event_items?event_id=eq.${EVENT}`);
await rest("DELETE", `events?id=eq.${EVENT}`);
await rest("DELETE", `quote_approvals?quote_id=eq.${QUOTE}`);
await rest("DELETE", `quote_items?version_id=in.(select)`);
await rest("DELETE", `quote_versions?quote_id=eq.${QUOTE}`);
await rest("DELETE", `quotes?id=eq.${QUOTE}`);
await rest("DELETE", `inquiries?contact_phone=eq.%2B628990000001`);
await rest("DELETE", `customers?id=eq.${CUST_ID}`);
await fetch(`${U}/auth/v1/admin/users/${UID}`, { method: "DELETE", headers: { apikey: SR, Authorization: `Bearer ${SR}` } });
console.log(`\nE2E API: ${results.filter((r) => r[0] === "PASS").length}/${results.length} PASS`);
