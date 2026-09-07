// Cart-lite: pilihan add-on paket tersimpan di localStorage, diteruskan ke form booking.
// Self-contained (tanpa dependensi).

export interface CartSelection {
  packageId: string;
  packageName: string;
  pax: number;
  addonIds: string[];
  updatedAt: string;
}

const KEY = "rn-cart-v1";

export function readCart(): CartSelection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CartSelection;
    if (!parsed || typeof parsed.packageId !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCart(cart: CartSelection): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cart));
  } catch {
    // storage penuh/diblokir: abaikan, booking tetap bisa manual
  }
}

export function clearCart(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // abaikan
  }
}
