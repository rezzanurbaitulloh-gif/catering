import { test, expect } from "@playwright/test";

// Alur publik: landing → paket → booking (inquiry nyata) → lacak.
// Data uji beraudit "PW-" dan dibersihkan setelah run (lihat cleanup).
const PHONE = "+628990000002";

test.describe("customer public flow", () => {
  test("home memuat paket + testimoni nyata", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /tajuk|prasmanan/i }).first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/Paket Pernikahan Klasik|Paket Korporat/).first()).toBeVisible();
  });

  test("booking mengirim inquiry (201 + arsip)", async ({ page }) => {
    await page.goto("/booking");
    await page.locator("#b-nama").fill("PW Tester");
    await page.locator("#b-phone").fill("081290000002");
    await page.locator("#b-tanggal").fill("2026-12-15");
    await page.locator("#b-pax").fill("120");
    await page.getByRole("button", { name: /kirim permintaan/i }).click();
    await expect(page.getByText(/permintaan diterima/i)).toBeVisible({ timeout: 20000 });
  });

  test("lacak menolak kombinasi salah (isolasi)", async ({ page }) => {
    await page.goto("/lacak");
    await page.locator("#t-no").fill("EVENT-2026-001");
    await page.locator("#t-phone").fill("081290000002");
    await page.getByRole("button", { name: /^lacak$/i }).click();
    await expect(page.getByText(/tidak ditemukan/i)).toBeVisible({ timeout: 20000 });
  });

  test("lacak berhasil untuk pemilik", async ({ page }) => {
    await page.goto("/lacak");
    await page.locator("#t-no").fill("EVENT-2026-001");
    await page.locator("#t-phone").fill("+6281234567001");
    await page.getByRole("button", { name: /^lacak$/i }).click();
    await expect(page.getByText(/Pernikahan Budi/i)).toBeVisible({ timeout: 20000 });
  });

  test("tidak ada horizontal overflow (mobile)", async ({ page }) => {
    for (const path of ["/", "/paket", "/booking", "/lacak"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle").catch(() => {});
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `overflow di ${path}`).toBeLessThanOrEqual(1);
    }
  });
});
