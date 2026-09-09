import type { Metadata } from "next";
import InvoicePanel from "./InvoicePanel";

export const metadata: Metadata = { title: "Invoice" };

export default function InvoicePage({ params }: { params: { eventId: string } }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <InvoicePanel eventId={params.eventId} />
    </div>
  );
}
