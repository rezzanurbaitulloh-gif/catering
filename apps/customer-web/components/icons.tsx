// Ikon garis cokelat ala mockup (SVG inline, tanpa emoji).
const P = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function ClocheIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...P} aria-hidden="true">
      <path d="M4 17h16" />
      <path d="M5 17a7 7 0 0 1 14 0" />
      <path d="M12 10V8.5" />
      <circle cx="12" cy="7.5" r="1" />
      <path d="M3 20h18" />
    </svg>
  );
}

export function WheatIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...P} aria-hidden="true">
      <path d="M12 22V8" />
      <path d="M12 8C12 4.5 9.5 2.5 6 2.5c0 3.5 2.5 5.5 6 5.5z" />
      <path d="M12 12c0-3.5 2.5-5.5 6-5.5 0 3.5-2.5 5.5-6 5.5z" />
      <path d="M12 16c0-3.5-2.5-5.5-6-5.5 0 3.5 2.5 5.5 6 5.5z" />
    </svg>
  );
}

export function ClockIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...P} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function ChefIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...P} aria-hidden="true">
      <path d="M8 21v-6a4 4 0 0 1 8 0v6" />
      <path d="M8 21h8" />
      <path d="M12 11V9" />
      <path d="M7 9a2.5 2.5 0 0 1-.6-4.9A4.5 4.5 0 0 1 12 3a4.5 4.5 0 0 1 5.6 1.1A2.5 2.5 0 0 1 17 9H7z" />
    </svg>
  );
}

export function ChatIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...P} aria-hidden="true">
      <path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z" />
      <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
    </svg>
  );
}

export function HeartIcon({ className = "h-5 w-5", filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20.5S3.5 15.4 3.5 9.6A4.6 4.6 0 0 1 8.2 5c1.6 0 3 .9 3.8 2.2A4.6 4.6 0 0 1 15.8 5a4.6 4.6 0 0 1 4.7 4.6c0 5.8-8.5 10.9-8.5 10.9z" />
    </svg>
  );
}

export function ShareIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...P} aria-hidden="true">
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="17.5" cy="5.5" r="2.5" />
      <circle cx="17.5" cy="18.5" r="2.5" />
      <path d="M8.2 10.8l7-4M8.2 13.2l7 4" />
    </svg>
  );
}
