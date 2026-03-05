"use client"

import { useState, useEffect, useCallback } from "react"
import DashboardHeader from "@/components/dashboard/header"
import {
  Plus, Eye, Trash2, Loader2, FileText, CheckCircle2, XCircle,
  Clock, X, User, ShoppingCart, AlignLeft, AlertCircle, ChevronRight,
  Package, Search, ReceiptText,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Bill {
  id: string; customer_name: string; customer_email: string | null
  total: number; subtotal: number; gst_amount: number
  status: "draft" | "paid" | "cancelled"; bill_date: string; created_at: string
}
interface Product { id: string; name: string; price: number; gst_rate: number; unit: string }
interface LineItem { product_id: string; name: string; unit: string; qty: number; price: number; gst_rate: number }

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS = {
  draft: { label: "Draft", Icon: Clock, cls: "border-[#D4B200]/40 text-[#D4B200] bg-[#D4B200]/10" },
  paid: { label: "Paid", Icon: CheckCircle2, cls: "border-[#00E58F]/40 text-[#00E58F] bg-[#00E58F]/10" },
  cancelled: { label: "Cancelled", Icon: XCircle, cls: "border-[#FF4D4D]/40 text-[#FF4D4D] bg-[#FF4D4D]/10" },
}
const GST_RATES = [0, 5, 12, 18, 28]
const inp = "w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-all placeholder:text-[#5B6B66] focus:border-[#00E58F] bg-[#0A110F] border border-[#1A2623] text-white"
const sel = `${inp} appearance-none cursor-pointer`
const lbl = "block text-[10px] font-bold uppercase tracking-widest text-[#00E58F]/60 mb-1.5"

function blankItem(): LineItem {
  return { product_id: "", name: "", unit: "pcs", qty: 1, price: 0, gst_rate: 18 }
}

// ─── Create Order Slide-over Panel ────────────────────────────────────────────
function CreateOrderPanel({
  open, onClose, onCreated
}: {
  open: boolean; onClose: () => void; onCreated: (bill: Bill) => void
}) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState("")
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", address: "", gst: "" })
  const [items, setItems] = useState<LineItem[]>([blankItem()])
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [savingAndPay, setSavingAndPay] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/products`).then(r => r.json()).then(d => setProducts(d.products ?? []))
  }, [open])

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setCustomer({ name: "", email: "", phone: "", address: "", gst: "" })
      setItems([blankItem()])
      setBillDate(new Date().toISOString().split("T")[0])
      setNotes("")
      setError("")
      setProductSearch("")
    }
  }, [open])

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  function setItem<K extends keyof LineItem>(i: number, k: K, v: LineItem[K]) {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it))
  }

  function pickProduct(i: number, pid: string) {
    const p = products.find(pr => pr.id === pid)
    if (p) {
      setItems(prev => prev.map((it, idx) =>
        idx === i ? { ...it, product_id: p.id, name: p.name, price: p.price, gst_rate: p.gst_rate, unit: p.unit } : it
      ))
    } else {
      setItem(i, "product_id", pid)
    }
  }

  const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0)
  const totalGst = items.reduce((s, it) => s + (it.qty * it.price * it.gst_rate) / 100, 0)
  const grandTotal = subtotal + totalGst

  async function submit(markPaid = false) {
    setError("")
    if (!customer.name.trim()) { setError("Customer name is required."); return }
    if (items.some(it => !it.name.trim())) { setError("All items must have a name."); return }
    if (markPaid) setSavingAndPay(true); else setSaving(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/bills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customer.name,
          customer_email: customer.email || null,
          customer_phone: customer.phone || null,
          customer_address: customer.address || null,
          customer_gst: customer.gst || null,
          notes: notes || null,
          bill_date: billDate,
          items,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || `Error ${res.status}`); return }

      // If "Create & Mark Paid", do a second PATCH
      if (markPaid) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/bills/${data.bill.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "paid" }),
        })
        data.bill.status = "paid"
      }

      onCreated(data.bill)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error")
    } finally {
      setSaving(false)
      setSavingAndPay(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Slide-over */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{
          width: "min(680px, 95vw)",
          background: "#0A0A0A",
          borderLeft: "1px solid #1A2623",
          transform: open ? "translateX(0)" : "translateX(100%)",
          boxShadow: open ? "-20px 0 60px rgba(0,0,0,0.6)" : "none",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2623] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,229,143,0.1)", border: "1px solid rgba(0,229,143,0.2)" }}>
              <ReceiptText className="w-4 h-4 text-[#00E58F]" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-white">Create New Order</h2>
              <p className="text-[11px] text-[#5B6B66]">Fill in customer & line items to generate a GST invoice</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-[#5B6B66] hover:text-white hover:bg-[#1A2623] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,229,143,0.1) transparent" }}>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-[12px] bg-[#FF4D4D]/10 border border-[#FF4D4D]/30 text-[#FF4D4D]">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {/* ── Customer Details ── */}
          <section className="rounded-xl bg-[#0D1513] border border-[#1A2623] overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#1A2623]">
              <User className="w-3.5 h-3.5 text-[#00E58F]" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#00E58F]">Customer Details</span>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={lbl}>Customer Name <span className="text-[#FF4D4D]">*</span></label>
                <input className={inp} value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} placeholder="Acme Corp" />
              </div>
              <div>
                <label className={lbl}>Email</label>
                <input type="email" className={inp} value={customer.email} onChange={e => setCustomer(c => ({ ...c, email: e.target.value }))} placeholder="billing@acmecorp.com" />
              </div>
              <div>
                <label className={lbl}>Phone</label>
                <input className={inp} value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className={lbl}>GST Number</label>
                <input className={`${inp} uppercase font-mono`} value={customer.gst} onChange={e => setCustomer(c => ({ ...c, gst: e.target.value }))} placeholder="22AAAAA0000A1Z5" />
              </div>
              <div>
                <label className={lbl}>Bill Date</label>
                <input type="date" className={inp} value={billDate} onChange={e => setBillDate(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Billing Address</label>
                <input className={inp} value={customer.address} onChange={e => setCustomer(c => ({ ...c, address: e.target.value }))} placeholder="123 Business Rd, City, State" />
              </div>
            </div>
          </section>

          {/* ── Line Items ── */}
          <section className="rounded-xl bg-[#0D1513] border border-[#1A2623] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A2623]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-3.5 h-3.5 text-[#00E58F]" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#00E58F]">Line Items</span>
              </div>
              {/* Product search */}
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5B6B66]" />
                <input
                  className="pl-7 pr-3 py-1.5 rounded-lg text-[11px] bg-[#0A110F] border border-[#1A2623] text-white outline-none focus:border-[#00E58F] placeholder:text-[#5B6B66] w-[160px]"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="p-5 space-y-3">
              {items.map((item, i) => {
                const lineTotal = item.qty * item.price
                const lineGst = (lineTotal * item.gst_rate) / 100
                const lineAmt = lineTotal + lineGst
                return (
                  <div key={i} className="rounded-lg border border-[#1A2623] bg-[#0A110F]/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold text-[#5B6B66] uppercase tracking-widest">Item {i + 1}</span>
                      <div className="flex-1 h-px bg-[#1A2623]" />
                      {items.length > 1 && (
                        <button type="button" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} className="p-1.5 rounded-lg text-[#5B6B66] hover:text-[#FF4D4D] hover:bg-[#FF4D4D]/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Product selector */}
                    <div className="mb-3">
                      <label className={lbl}>Product / Item</label>
                      <select className={sel} value={item.product_id} onChange={e => pickProduct(i, e.target.value)}>
                        <option value="">— Custom Item —</option>
                        {filteredProducts.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (₹{p.price} · {p.unit})</option>
                        ))}
                      </select>
                      {!item.product_id && (
                        <input className={`${inp} mt-2`} value={item.name} onChange={e => setItem(i, "name", e.target.value)} placeholder="Custom item name" />
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={lbl}>Qty</label>
                        <input type="number" min="0.001" step="0.001" className={`${inp} text-center font-mono`} value={item.qty} onChange={e => setItem(i, "qty", Number(e.target.value))} />
                      </div>
                      <div>
                        <label className={lbl}>Price (₹)</label>
                        <input type="number" min="0" step="0.01" className={`${inp} font-mono`} value={item.price} onChange={e => setItem(i, "price", Number(e.target.value))} />
                      </div>
                      <div>
                        <label className={lbl}>GST %</label>
                        <select className={sel} value={item.gst_rate} onChange={e => setItem(i, "gst_rate", Number(e.target.value))}>
                          {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#1A2623] flex justify-between items-center">
                      <span className="text-[11px] text-[#5B6B66]">GST: ₹{lineGst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      <span className="text-[14px] font-bold text-[#00E58F]">₹{lineAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )
              })}

              <button type="button" onClick={() => setItems(p => [...p, blankItem()])} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-bold text-[#00E58F] border border-dashed border-[#00E58F]/30 hover:border-[#00E58F]/60 hover:bg-[#00E58F]/5 transition-all">
                <Plus className="w-3.5 h-3.5" /> Add Another Item
              </button>
            </div>
          </section>

          {/* ── Notes ── */}
          <section className="rounded-xl bg-[#0D1513] border border-[#1A2623] overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#1A2623]">
              <AlignLeft className="w-3.5 h-3.5 text-[#00E58F]" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#00E58F]">Notes & Terms</span>
            </div>
            <div className="p-5">
              <textarea className={`${inp} resize-none min-h-[80px]`} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment instructions, return policy, or any internal notes…" />
            </div>
          </section>
        </div>

        {/* Footer — summary + actions */}
        <div className="flex-shrink-0 border-t border-[#1A2623] bg-[#0D1513]">
          {/* Summary strip */}
          <div className="px-6 py-3 flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-5 text-[#94A39D]">
              <span>Subtotal: <strong className="text-white">₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></span>
              <span>GST: <strong className="text-white">₹{totalGst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#5B6B66] uppercase tracking-wider">Grand Total</span>
              <p className="text-[22px] font-bold text-[#00E58F] leading-tight">₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-6 pb-5 grid grid-cols-3 gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-[12px] font-bold text-[#94A39D] hover:text-white border border-[#1A2623] bg-[#0A110F] hover:bg-[#1A2623] transition-all uppercase tracking-wide"
            >
              Cancel
            </button>
            <button
              onClick={() => submit(false)}
              disabled={saving || savingAndPay}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-[12px] font-bold border border-[#1A2623] bg-[#0A110F] hover:bg-[#1A2623] text-white transition-all disabled:opacity-50 uppercase tracking-wide"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              Save Draft
            </button>
            <button
              onClick={() => submit(true)}
              disabled={saving || savingAndPay}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-[12px] font-bold bg-[#00E58F] text-[#0A110F] hover:bg-[#00FFAA] transition-all disabled:opacity-50 uppercase tracking-wide shadow-[0_0_15px_rgba(0,229,143,0.3)]"
            >
              {savingAndPay ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Create & Pay
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | "paid" | "draft" | "cancelled">("all")
  const [search, setSearch] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/bills?t=${Date.now()}`)
      const d = await r.json()
      setBills(d.bills ?? [])
    } catch {
      setBills([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function markPaid(id: string) {
    if (updatingId || deletingId) return
    setUpdatingId(id)
    setBills(prev => prev.map(b => b.id === id ? { ...b, status: "paid" } : b))
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/bills/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "paid" }) })
      if (!res.ok) await load()
    } finally { setUpdatingId(null) }
  }

  async function deleteBill(id: string) {
    if (!confirm("Are you sure you want to delete this bill permanently?")) return
    if (updatingId || deletingId) return
    setDeletingId(id)
    setBills(prev => prev.filter(b => b.id !== id))
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/bills/${id}`, { method: "DELETE" })
      if (!res.ok) await load()
    } finally { setDeletingId(null) }
  }

  function handleOrderCreated(newBill: Bill) {
    setBills(prev => [newBill as any, ...prev])
  }

  const revenue = bills.filter(b => b.status === "paid").reduce((s, b) => s + Number(b.total), 0)

  const displayed = bills.filter(b => {
    const matchFilter = filter === "all" || b.status === filter
    const matchSearch = !search || b.customer_name?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <>
      <DashboardHeader title="Orders & Billing" subtitle="Create and manage GST invoices" />

      <main className="flex-1 overflow-y-auto p-6 bg-[#0A0A0A]">
        <div className="max-w-[1400px] mx-auto">

          {/* ── Header bar ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <p className="text-[#E1E7E5] font-medium text-[15px]">{bills.length} bill{bills.length !== 1 ? "s" : ""}</p>
              <p className="text-[#94A39D] text-[13px] mt-1">
                Revenue (paid): <span className="font-semibold tracking-wide text-[#00E58F]">₹{revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6B66]" />
                <input
                  className="pl-9 pr-4 py-2 rounded-lg text-[12px] bg-[#0D1513] border border-[#1A2623] text-white outline-none focus:border-[#00E58F]/50 placeholder:text-[#5B6B66] w-[200px]"
                  placeholder="Search by customer…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: "#0D1513", border: "1px solid #1A2623" }}>
                {(["all", "paid", "draft", "cancelled"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all ${filter === f ? "bg-[#00E58F] text-[#0A110F]" : "text-[#5B6B66] hover:text-white"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Create Order button */}
              <button
                onClick={() => setPanelOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold border border-[#00E58F] bg-[#00E58F] text-[#0A110F] hover:bg-[#00FFAA] transition-all uppercase tracking-wide shadow-[0_0_15px_rgba(0,229,143,0.3)]"
              >
                <Plus className="w-4 h-4" /> New Order
              </button>
            </div>
          </div>

          {/* ── Content ── */}
          {loading ? (
            <div className="flex justify-center items-center py-32">
              <Loader2 className="w-8 h-8 animate-spin text-[#00E58F]" />
            </div>
          ) : bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-5 bg-[#0D1513] rounded-xl border border-[#1A2623] shadow-lg">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-[#00E58F]/10 border border-[#00E58F]/20">
                <Package className="w-10 h-10 text-[#00E58F]" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-white text-[17px] mb-1">No orders yet</p>
                <p className="text-sm text-[#94A39D]">Create your first order to get started.</p>
              </div>
              <button onClick={() => setPanelOpen(true)} className="mt-2 flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold border border-[#00E58F] bg-[#00E58F] text-[#0A110F] hover:bg-[#00FFAA] transition-all uppercase tracking-wide">
                <Plus className="w-4 h-4" /> Create Order
              </button>
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#5B6B66]">
              <Search className="w-8 h-8" />
              <p className="text-sm">No orders found matching your filter.</p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden border border-[#1A2623] bg-[#0D1513] shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0A110F] border-b border-[#1A2623]">
                      {["Customer", "Date", "Subtotal", "GST", "Total", "Status", "Actions"].map(h => (
                        <th key={h} className={`px-6 py-4 text-[10px] font-bold text-[#5B6B66] uppercase tracking-widest ${h === "Actions" || h === "Status" ? "text-center" : ""}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map(b => {
                      const sc = STATUS[b.status]; const { Icon } = sc
                      return (
                        <tr key={b.id} className="border-b border-[#1A2623]/60 hover:bg-[#00E58F]/[0.02] transition-colors group">
                          <td className="px-6 py-5">
                            <p className="font-medium text-white text-[14px]">{b.customer_name}</p>
                            {b.customer_email && <p className="text-[12px] text-[#5B6B66] mt-0.5">{b.customer_email}</p>}
                          </td>
                          <td className="px-6 py-5 text-[#94A39D] text-[13px]">
                            {new Date(b.bill_date || b.created_at).toLocaleDateString("en-IN")}
                          </td>
                          <td className="px-6 py-5 text-white font-medium">
                            ₹{Number(b.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-5 text-[#94A39D]">
                            ₹{Number(b.gst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-5 font-bold text-[#00E58F] text-[14px]">
                            ₹{Number(b.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${sc.cls}`}>
                              <Icon className="w-[11px] h-[11px]" /> {sc.label}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-3">
                              <Link href={`/dashboard/bills/${b.id}`} className="text-[#5B6B66] hover:text-white transition-colors" title="View Invoice">
                                <Eye className="w-4 h-4" />
                              </Link>
                              {b.status === "draft" && (
                                <button onClick={() => markPaid(b.id)} disabled={updatingId === b.id || deletingId !== null} className="text-[#5B6B66] hover:text-[#00E58F] transition-colors disabled:opacity-50" title="Mark as Paid">
                                  {updatingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                </button>
                              )}
                              <button onClick={() => deleteBill(b.id)} disabled={deletingId === b.id || updatingId !== null} className="text-[#5B6B66] hover:text-[#FF4D4D] transition-colors disabled:opacity-50" title="Delete">
                                {deletingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Order Slide-over */}
      <CreateOrderPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onCreated={handleOrderCreated}
      />
    </>
  )
}
