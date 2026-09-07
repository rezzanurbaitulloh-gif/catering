# Alur Kerja Inti — Catering OS

Satu event, satu alur, semua peran. Setiap panah = aksi nyata di UI + API + DB + audit.

```
LEAD (sales catat)
 → INQUIRY (customer via /booking, atau sales)            [inquiries NEW]
 → QUOTATION DRAFT (admin, hitung SERVER)                 [POST /api/quotes]
 → SENT → CUSTOMER APPROVAL (/penawaran)                  [quote_approvals, versi terkunci]
 → BOOKING + DP (≥30%)                                    [bookings, POST /api/payments]
 → EVENT PLANNING                                         [events PLANNING]
 → FINAL PAX LOCK                                         [POST pax-lock → pax_revisions]
 → PRODUCTION PLAN (kebutuhan = resep × pax, SERVER)      [production_plans/batches]
 → SHORTAGE CHECK (stok − cadangan vs kebutuhan)          [risk engine]
 → PROCUREMENT (PO → receiving)                           [purchase_orders]
 → PRODUKSI → QC → PACKING (required vs packed)           [event_items]
 → LOADING → TRANSPORT (berangkat/ETA/tiba + penerima)   [transport_tasks]
 → SETUP → SERVICE → BREAKDOWN (checklist + foto)         [setup/service/breakdown_tasks]
 → REKONSILIASI PERALATAN (dibawa vs kembali)             [equipment_reconciliation]
 → PELUNASAN → FEEDBACK → INSIDEN (bila ada) → CLOSED     [payments, incidents]
 → LAPORAN LABA (estimasi vs aktual)                      [profitability]
```

## Aturan kegagalan per tahap (ringkas)

| Tahap | Bisa salah | Cegah | Deteksi | Bukti |
|---|---|---|---|---|
| Inquiry | lead hilang | form + status NEW wajib | dashboard inquiry baru | row + timestamp |
| Quotation | harga beda omongan | hitung server, versi tak ditimpa | approval tercatat | quote_approvals |
| Pax | masak kurang | kunci final, revisi tercatat | RED ALERT packing | pax_revisions |
| Produksi | takaran salah | BOM per porsi | aktual vs target | production_batches |
| Stok | bahan kurang | min-stock + reservasi | shortage 15 kg ayam | inventory_transactions |
| Armada/tim | tabrakan jadwal | assignment per event | conflict detector | vehicle/staff_assignments |
| Venue | akses sulit | venue book + foto | risk venue | venues + foto |
| Uang | DP macet | status PARTIAL/PENDING | dashboard belum lunas | payments + audit |
| Serah terima | selisih klaim | hitung + foto + penerima | rekonsiliasi | transport_tasks + foto |
| Insiden | tak tertangani | severity + owner | risk center | incident_evidence |

## Peran & kepemilikan

Owner: laba & risiko · Admin: konfigurasi · Sales: lead→booking ·
Finance: DP/pelunasan/refund · Kitchen: produksi/QC · Operations: logistik/venue/tim ·
Driver: berangkat/tiba · Staff: checklist · Supervisor: eskalasi · Customer: setuju & bayar.
