"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Plus, Eye, Trash2, Loader2, FileText, CheckCircle, XCircle } from "lucide-react"

type Bill = {
  id: string
  bill_number: string
  customer_name: string
  customer_phone: string
  subtotal: number
  gst_amount: number
  total: number
  status: string
  bill_date: string
  item_count: number
}

const STATUS_COLORS: Record<string, string> = {
  draft: "rgba(148,163,184,0.15)",
  paid: "rgba(52,211,153,0.15)",
  cancelled: "rgba(239,68,68,0.15)",
}
const STATUS_TEXT: Record<string, string> = {
  draft: "#94a3b8",
  paid: "#34d399",
  cancelled: "#f87171",
}

export default function BillsManager() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/bills`)
    const data = await res.json()
    setBills(data.bills || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function markStatus(id: string, status: string) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/bills/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this bill?")) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/bills/${id}`, { method: "DELETE" })
    load()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{bills.length} bill{bills.length !== 1 ? "s" : ""}</p>
        <Link
          href="/dashboard/bills/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "#47ff86", color: "#060d1f" }}
        >
          <Plus className="w-4 h-4" />
          New Bill
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : bills.length === 0 ? (
        <div
          className="rounded-xl border p-12 flex flex-col items-center gap-3 text-center"
          style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(15,23,42,0.4)" }}
        >
          <FileText className="w-10 h-10 text-muted-foreground" />
          <p className="font-medium text-foreground">No bills yet</p>
          <p className="text-sm text-muted-foreground">Create your first GST invoice.</p>
          <Link
            href="/dashboard/bills/new"
            className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "#47ff86", color: "#060d1f" }}
          >
            <Plus className="w-4 h-4" /> Create Bill
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(15,23,42,0.8)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Bill No.", "Customer", "Date", "Items", "Total", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.id} className="border-t hover:bg-accent/10 transition-colors" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{b.bill_number}</td>
                  <td className="px-4 py-3 text-foreground font-medium">{b.customer_name}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(b.bill_date).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{b.item_count}</td>
                  <td className="px-4 py-3 text-foreground font-semibold">
                    ₹{Number(b.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-medium capitalize"
                      style={{ background: STATUS_COLORS[b.status] || STATUS_COLORS.draft, color: STATUS_TEXT[b.status] || STATUS_TEXT.draft }}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/dashboard/bills/${b.id}`}
                        className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                        aria-label="View bill"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      {b.status === "draft" && (
                        <button
                          onClick={() => markStatus(b.id, "paid")}
                          className="p-1.5 rounded-lg hover:bg-green-500/10 transition-colors text-muted-foreground hover:text-green-400"
                          aria-label="Mark paid"
                          title="Mark as Paid"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {b.status !== "cancelled" && (
                        <button
                          onClick={() => markStatus(b.id, "cancelled")}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400"
                          aria-label="Cancel bill"
                          title="Cancel"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                        aria-label="Delete bill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
