'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

// QR operasional: dipindai aplikasi lapangan → buka event / lacak.
// Otorisasi tetap berlaku (login).
export default function QrTag({ value, label }: { value: string; label: string }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { width: 160, margin: 1 })
      .then((u) => {
        if (alive) setSrc(u);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [value]);

  if (!src) return null;
  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-line p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`QR ${label}`} width={96} height={96} />
      <div>
        <p className="font-semibold text-[14px]">{label}</p>
        <p className="muted text-[12px] break-all">{value}</p>
      </div>
    </div>
  );
}
