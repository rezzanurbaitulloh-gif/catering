import { Fraunces, Inter } from "next/font/google";

// Tipografi editorial: serif kontras-tinggi untuk display, grotesk bersih untuk bodi.
// Self-hosted oleh Next (tanpa CDN runtime).
export const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
});

export const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body",
});

// Aksen kaligrafi: Fraunces italic (tanpa dependensi font tambahan).
