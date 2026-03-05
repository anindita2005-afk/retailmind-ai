"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Loader2, FileText, ArrowLeft, IndianRupee } from "lucide-react"

type Product = { id: string; name: string; price: number; gst_rate: number; unit: string }
type LineItem = { product_id: string; name: string; unit: string; qty: number; price: number; gst_rate: number }

interface Props { products: Product[] }

const GST_RATES = [0, 5, 12, 18, 28]

export default function NewBillForm({ products }: Props) {
  const router = useRouter()
  const [customer, setCustomer] = useState({
    customer_name: "", customer_email: "", customer_phone: "", customer_address: "", customer_gst: "",
  })
  const [notes, setNotes] = useState("")
  const [bill_date, setBillDate] = useState(new Date().toISOString().split("T")[0])
  const [items, setItems] = useState<LineItem[]>([
    { product_id: "", name: "", unit: "pcs", qty: 1, price: 0, gst_rate: 18 },
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const setC = (k: keyof typeof customer) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCustomer((c) => ({ ...c, [k]: e.target.value }))

  function addItem() {
    setItems((prev) => [...prev, { product_id: "", name: "", unit: "pcs", qty: 1, price: 0, gst_rate: 18 }])
  }
  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i))
  }
  function setItem(i: number, k: keyof LineItem, v: string | number) {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [k]: v } : item)))
  }
  function pickProduct(i: number, productId: string) {
    const p = products.find((pr) => pr.id === productId)
    if (p) {
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, product_id: p.id, name: p.name, price: p.price, gst_rate: p.gst_rate, unit: p.unit } : item
        )
      )
    } else {
      setItem(i, "product_id", "")
    }
  }

  const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0)
  const gstTotal = items.reduce((s, it) => s + (it.qty * it.price * it.gst_rate) / 100, 0)
  const total = subtotal + gstTotal

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customer.customer_name) { setError("Customer name is required"); return }
    if (items.some((it) => !it.name || it.qty <= 0 || it.price <= 0)) {
      setError("All items must have a name, quantity > 0, and price > 0")
      return
    }
    setError("")
    setSaving(true)
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/bills`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...customer, notes, bill_date, items }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || "Failed to create bill"); setSaving(false); return }
    router.push(`/dashboard/bills/${data.bill.id}`)
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-all"
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1"
  const cardStyle = { background: "rgba(15,23,42,0.5)", borderColor: "rgba(255,255,255,0.07)" }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
      {/* Main content (left) */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">New Bill / Invoice</h1>
            <p className="text-sm text-muted-foreground">Create a new GST-compliant bill for your customer.</p>
          </div>
        </div>

        {/* Customer */}
        <section className="rounded-xl border p-5" style={cardStyle}>
          <h3 className="text-sm font-semibold text-white mb-4">Customer Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Customer Name *</label>
              <input value={customer.customer_name} onChange={setC("customer_name")} required placeholder="e.g. Rahul Enterprises" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input value={customer.customer_phone} onChange={setC("customer_phone")} placeholder="e.g. +91 98765 43210" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={customer.customer_email} onChange={setC("customer_email")} placeholder="e.g. customer@email.com" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>GST Number</label>
              <input value={customer.customer_gst} onChange={setC("customer_gst")} placeholder="e.g. 22AAAAA0000A1Z5" className={`${inputClass} font-mono uppercase`} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Address</label>
              <input value={customer.customer_address} onChange={setC("customer_address")} placeholder="e.g. 123 MG Road, Mumbai 400001" className={inputClass} />
            </div>
          </div>
        </section>

        {/* Items */}
        <section className="rounded-xl border" style={cardStyle}>
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <h3 className="text-sm font-semibold text-white">Line Items</h3>
            <button type="button" onClick={addItem} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(0,212,255,0.15)", color: "#258553" }}>
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          </div>

          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2 text-xs font-medium text-muted-foreground border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="col-span-4">Product</div>
            <div className="col-span-2">Qty / Unit</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-1">GST</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1" />
          </div>

          <div className="flex flex-col gap-1 p-2">
            {items.map((item, i) => {
              const lineTotal = item.qty * item.price
              const lineGst = (lineTotal * item.gst_rate) / 100
              return (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start p-2 rounded-lg hover:bg-white/03">
                  <div className="sm:col-span-4">
                    <label className={`${labelClass} sm:hidden`}>Product</label>
                    <select value={item.product_id} onChange={(e) => pickProduct(i, e.target.value)} className={`${inputClass} mb-1`}>
                      <option value="">— Select or type custom —</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input value={item.name} onChange={(e) => setItem(i, "name", e.target.value)} required placeholder="Custom item name" className={inputClass} />
                  </div>
                  <div className="sm:col-span-2 grid grid-cols-2 gap-2">
                    <div><label className={`${labelClass} sm:hidden`}>Qty</label><input type="number" min="0.01" step="0.01" value={item.qty} onChange={(e) => setItem(i, "qty", parseFloat(e.target.value) || 0)} className={inputClass} /></div>
                    <div><label className={`${labelClass} sm:hidden`}>Unit</label><input value={item.unit} onChange={(e) => setItem(i, "unit", e.target.value)} placeholder="pcs" className={inputClass} /></div>
                  </div>
                  <div className="sm:col-span-2"><label className={`${labelClass} sm:hidden`}>Price (₹)</label><input type="number" min="0" step="0.01" value={item.price} onChange={(e) => setItem(i, "price", parseFloat(e.target.value) || 0)} className={inputClass} /></div>
                  <div className="sm:col-span-1"><label className={`${labelClass} sm:hidden`}>GST</label><select value={item.gst_rate} onChange={(e) => setItem(i, "gst_rate", parseFloat(e.target.value))} className={inputClass}>{GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}</select></div>
                  <div className="sm:col-span-2 text-right">
                    <label className={`${labelClass} sm:hidden`}>Total</label>
                    <div className="px-3 py-2 rounded-lg text-sm text-foreground font-medium bg-input border border-border h-full flex items-center justify-end">
                      ₹{(lineTotal + lineGst).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="sm:col-span-1 flex items-end justify-end h-full">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* Sidebar (right) */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 flex flex-col gap-6">
          {/* Totals */}
          <section className="rounded-xl border p-5" style={cardStyle}>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><IndianRupee className="w-4 h-4" style={{ color: "#47ff86" }} />Summary</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">GST</span><span className="text-foreground">₹{gstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between font-bold text-lg border-t border-white/10 pt-2 mt-1">
                <span className="text-foreground">Total</span>
                <span style={{ color: "#47ff86" }}>₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </section>

          {/* Meta */}
          <section className="rounded-xl border p-5" style={cardStyle}>
            <h3 className="text-sm font-semibold text-white mb-4">Options</h3>
            <div className="mb-4">
              <label className={labelClass}>Bill Date</label>
              <input type="date" value={bill_date} onChange={(e) => setBillDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Payment terms, thank you message…" className={inputClass} />
            </div>
          </section>

          {error && <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "#47ff86", color: "#060d1f" }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {saving ? "Creating…" : "Create Bill"}
            </button>
            <button type="button" onClick={() => router.back()} className="w-full px-5 py-2.5 rounded-lg text-sm font-medium border text-muted-foreground hover:text-foreground transition-all" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
