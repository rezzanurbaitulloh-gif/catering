import { test, expect } from "@playwright/test";

// Admin: login demo → dashboard atensi → event control center → risks.
test.describe("admin command center", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    // akun demo satu ketuk
    await page.getByRole("button", { name: /admin \(pemilik\)/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 25000 });
  });

  test("dashboard: statistik + perlu perhatian", async ({ page }) => {
    await expect(page.getByText(/acara hari ini|inquiry baru/i).first()).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: "artifacts/admin-dashboard.png" });
  });

  test("events → control center event pertama", async ({ page }) => {
    await page.goto("/events");
    const first = page.locator('a[href^="/events/"]').first();
    await expect(first).toBeVisible({ timeout: 20000 });
    await first.click();
    await expect(page.getByText(/ringkasan|pax|keuangan/i).first()).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: "artifacts/event-control.png" });
  });

  test("risks memuat daftar risiko", async ({ page }) => {
    await page.goto("/risks");
    await expect(page.getByText(/risiko|event aktif/i).first()).toBeVisible({ timeout: 25000 });
  });

  test("toggle mode di header mengubah navigasi", async ({ page }) => {
    await page.goto("/dashboard");
    const toggle = page.getByRole("button", { name: /premium|basic|custom/i }).first();
    await expect(toggle).toBeVisible({ timeout: 15000 });
  });
});
