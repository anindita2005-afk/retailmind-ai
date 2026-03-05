"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Printer, ArrowLeft, CheckCircle, XCircle } from "lucide-react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function BillDetail({ bill, items, profile }: { bill: any; items: any[]; profile: any }) {
  const router = useRouter()
  const [status, setStatus] = useState(bill.status)

  async function markStatus(s: string) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/bills/${bill.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s }),
    })
    setStatus(s)
  }

  const STATUS_COLOR: Record<string, string> = { draft: "#94a3b8", paid: "#34d399", cancelled: "#f87171" }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      {/* Actions bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1" />
        {status === "draft" && (
          <button
            onClick={() => markStatus("paid")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "rgba(52,211,153,0.2)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}
          >
            <CheckCircle className="w-4 h-4" /> Mark Paid
          </button>
        )}
        {status !== "cancelled" && (
          <button
            onClick={() => markStatus("cancelled")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <XCircle className="w-4 h-4" /> Cancel
          </button>
        )}
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "rgba(0,212,255,0.9)", color: "#060d1f" }}
        >
          <Printer className="w-4 h-4" /> Print / PDF
        </button>
      </div>

      {/* Invoice card */}
      <div
        id="invoice-print"
        className="rounded-xl border p-8 text-sm"
        style={{ background: "rgba(6,13,31,0.9)", borderColor: "rgba(0,212,255,0.12)" }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{profile?.business_name || "Your Business"}</h1>
            {profile?.gst_number && <p className="text-xs font-mono mt-1 text-muted-foreground">GSTIN: {profile.gst_number}</p>}
            {profile?.address && <p className="text-xs text-muted-foreground mt-0.5">{profile.address}{profile.city ? `, ${profile.city}` : ""}{profile.state ? `, ${profile.state}` : ""} {profile.pincode || ""}</p>}
            {profile?.phone && <p className="text-xs text-muted-foreground">{profile.phone}</p>}
            {profile?.email && <p className="text-xs text-muted-foreground">{profile.email}</p>}
          </div>
          <div className="sm:text-right">
            <div className="text-xl font-bold" style={{ color: "#00d4ff" }}>TAX INVOICE</div>
            <div className="font-mono text-foreground mt-1">{bill.bill_number}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Date: {new Date(bill.bill_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </div>
            <div className="mt-2">
              <span
                className="px-2.5 py-1 rounded-full text-xs font-medium capitalize"
                style={{ background: `${STATUS_COLOR[status]}22`, color: STATUS_COLOR[status] }}
              >
                {status}
              </span>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-6 p-4 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Bill To</p>
          <p className="font-semibold text-foreground">{bill.customer_name}</p>
          {bill.customer_gst && <p className="text-xs font-mono text-muted-foreground">GSTIN: {bill.customer_gst}</p>}
          {bill.customer_phone && <p className="text-xs text-muted-foreground">{bill.customer_phone}</p>}
          {bill.customer_email && <p className="text-xs text-muted-foreground">{bill.customer_email}</p>}
          {bill.customer_address && <p className="text-xs text-muted-foreground mt-0.5">{bill.customer_address}</p>}
        </div>

        {/* Items */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              {["#", "Item", "Unit", "Qty", "Rate (₹)", "GST %", "GST (₹)", "Total (₹)"].map((h) => (
                <th key={h} className="py-2 text-left text-xs font-semibold text-muted-foreground pr-4 last:pr-0">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={it.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td className="py-2 pr-4 text-muted-foreground">{i + 1}</td>
                <td className="py-2 pr-4 text-foreground font-medium">{it.name}</td>
                <td className="py-2 pr-4 text-muted-foreground">{it.unit}</td>
                <td className="py-2 pr-4 text-foreground">{it.qty}</td>
                <td className="py-2 pr-4 text-foreground">₹{Number(it.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td className="py-2 pr-4 text-muted-foreground">{it.gst_rate}%</td>
                <td className="py-2 pr-4 text-muted-foreground">₹{Number(it.gst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td className="py-2 text-foreground font-medium">₹{Number(it.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs flex flex-col gap-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">₹{Number(bill.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST</span>
              <span className="text-foreground">₹{Number(bill.gst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-border pt-2 mt-1">
              <span className="text-foreground">Grand Total</span>
              <span style={{ color: "#00d4ff" }}>₹{Number(bill.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {bill.notes && (
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Notes:</span> {bill.notes}</p>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">This is a computer-generated invoice. Thank you for your business.</p>
        </div>
      </div>
    </div>
  )
}
