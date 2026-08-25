"use client";

import {
  MessageCircle,
  Printer,
} from "lucide-react";
import { useState } from "react";

type ReceiptQuickActionsProps = {
  guardianName: string;
  guardianPhone: string;
  receiptNumber: string;
  studentName: string;
  amountReceived: string;
  receiptId: string;
};

function normaliseWhatsAppNumber(
  value: string,
) {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (
    digits.length === 11 &&
    digits.startsWith("0")
  ) {
    digits = digits.slice(1);
  }

  if (digits.length === 10) {
    return `91${digits}`;
  }

  return digits;
}

export default function ReceiptQuickActions({
  guardianName,
  guardianPhone,
  receiptNumber,
  studentName,
  amountReceived,
  receiptId,
}: ReceiptQuickActionsProps) {
  const [sending, setSending] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const whatsappNumber =
    normaliseWhatsAppNumber(
      guardianPhone,
    );

  const message = [
    `Hello ${guardianName || "Parent"},`,
    "",
    `Your fee receipt ${receiptNumber} for ${studentName} is ready.`,
    `Amount received: ${amountReceived}`,
    "",
    "Please keep this receipt for your records.",
    "Kidzee Sector 12, Dwarka",
  ].join("\n");

  const whatsappUrl =
    whatsappNumber.length >= 10
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
      : "";

  async function sendReceiptPdf() {
    setSending(true);
    setDeliveryMessage("");
    try {
      const response = await fetch("/api/admin/whatsapp/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId }),
      });
      const result = await response.json() as { success?: boolean; message?: string };
      setDeliveryMessage(result.message ?? (result.success ? "Receipt sent." : "Receipt queued for retry."));
    } catch {
      setDeliveryMessage("The receipt could not be sent. Try again from the WhatsApp delivery log.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() =>
          window.print()
        }
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-4 text-sm font-black text-white transition hover:bg-[#472067] focus:outline-none focus:ring-4 focus:ring-[#DCCFE4]"
      >
        <Printer
          aria-hidden="true"
          size={17}
        />

        Print Receipt
      </button>

      {whatsappUrl ? (
        <button
          type="button"
          onClick={() => void sendReceiptPdf()}
          disabled={sending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 text-sm font-black text-white transition hover:bg-[#1EAE54] focus:outline-none focus:ring-4 focus:ring-emerald-200"
          aria-label={`Send receipt PDF by WhatsApp to ${guardianName || "the parent"}`}
        >
          <MessageCircle
            aria-hidden="true"
            size={18}
          />

          {sending ? "Sending…" : "Send PDF on WhatsApp"}
        </button>
      ) : (
        <button
          type="button"
          disabled
          title="Add a guardian phone number to enable WhatsApp"
          className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-slate-200 px-4 text-sm font-black text-slate-500"
        >
          <MessageCircle
            aria-hidden="true"
            size={18}
          />

          Phone Not Added
        </button>
      )}
      {deliveryMessage ? <p role="status" className="basis-full text-xs font-bold text-[#65596A]">{deliveryMessage}</p> : null}
    </>
  );
}
