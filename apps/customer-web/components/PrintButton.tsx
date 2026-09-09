"use client";

// Tombol cetak generik (butuh client karena window.print).
export default function PrintButton({ label = "Cetak", className = "btn-outline !px-4 !py-2 text-sm" }: { label?: string; className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={`${className} print-hide`}>
      {label}
    </button>
  );
}
