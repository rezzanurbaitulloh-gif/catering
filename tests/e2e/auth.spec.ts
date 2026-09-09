import { test, expect, request } from "@playwright/test";

// Auth pelanggan via browser. User dibuat lewat Auth Admin API (tanpa email,
// menghindari rate-limit SMTP) — yang diuji browser: login, sesi, dashboard,
// profil, alamat, logout, dan penolakan jujur.
const stamp = Date.now().toString(36).toUpperCase();
const EMAIL = `pw-${stamp}@test.id`.toLowerCase();
const PASS = "PwAuth2026!";
const PHONE = "081290000003";

test.describe("customer auth", () => {
  test.beforeAll(async () => {
    const ctx = await request.newContext();
    const create = await ctx.post(`${process.env.SUPABASE_URL}/auth/v1/admin/users`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE!}`,
        "Content-Type": "application/json",
      },
      data: { email: EMAIL, password: PASS, email_confirm: true },
    });
    expect(create.status()).toBe(200);
    const uid = (await create.json()).id as string;
    const ins = await ctx.post(`${process.env.SUPABASE_URL}/rest/v1/customers`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE!}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      data: {
        business_id: "11111111-1111-1111-1111-111111111111",
        auth_user_id: uid,
        name: "PW Auth",
        phone: PHONE,
        email: EMAIL,
        source: "Playwright",
      },
    });
    expect(ins.status()).toBe(201);
    await ctx.dispose();
  });

  test("masuk → dashboard → profil + alamat → keluar", async ({ page }) => {
    await page.goto("/masuk");
    await page.locator("#m-email").fill(EMAIL);
    await page.locator("#m-pass").fill(PASS);
    await page.getByRole("button", { name: /^masuk$/i }).click();
    await expect(page).toHaveURL(/akun/, { timeout: 25000 });
    // Bukan prompt login, melainkan dashboard asli:
    await expect(page.getByText(/acara aktif/i)).toBeVisible({ timeout: 20000 });

    await page.goto("/profil");
    await expect(page.getByText(/data diri/i)).toBeVisible({ timeout: 15000 });
    await page.getByPlaceholder(/jalan, desa/i).fill("Jl. PW No. 1, Nganjuk");
    await page.getByRole("button", { name: /\+ alamat/i }).click();
    await expect(page.getByText(/alamat ditambahkan/i)).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: "artifacts/profile.png" });

    await page.getByRole("button", { name: /^keluar$/i }).first().click();
    await page.goto("/akun");
    await expect(page.getByText(/masuk untuk melihat pesanan/i)).toBeVisible({ timeout: 15000 });
  });

  test("masuk dengan sandi salah ditolak jujur", async ({ page }) => {
    await page.goto("/masuk");
    await page.locator("#m-email").fill(EMAIL);
    await page.locator("#m-pass").fill("salah12345");
    await page.getByRole("button", { name: /^masuk$/i }).click();
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 15000 });
  });
});
