"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "@/lib/auth";

// Area akun di header: login bila anonim, nama + keluar bila masuk.
export default function AuthArea() {
  const { user, customer, loading, signOut } = useCustomerAuth();
  const router = useRouter();

  if (loading) return <span className="px-3 text-sm text-muted">…</span>;
  if (!user) {
    return (
      <>
        <Link href="/masuk" className="touch hidden items-center px-3 text-sm font-semibold text-ink/80 hover:text-gold-deep sm:inline-flex">
          Masuk
        </Link>
        <Link href="/akun" className="touch hidden items-center px-3 text-sm font-semibold text-ink/80 hover:text-gold-deep sm:inline-flex">
          Akun Saya
        </Link>
      </>
    );
  }
  return (
    <>
      <Link href="/akun" className="touch hidden max-w-[140px] items-center truncate px-3 text-sm font-semibold text-ink/80 hover:text-gold-deep sm:inline-flex" title={customer?.name ?? user.email ?? ""}>
        {customer?.name ?? user.email}
      </Link>
      <button
        type="button"
        onClick={async () => {
          await signOut();
          router.push("/");
          router.refresh();
        }}
        className="touch hidden items-center px-3 text-sm font-semibold text-ink/80 hover:text-gold-deep sm:inline-flex"
      >
        Keluar
      </button>
    </>
  );
}
