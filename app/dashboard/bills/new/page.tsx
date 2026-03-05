"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ShoppingCart,
  User,
  AlignLeft,
  FileText,
} from "lucide-react"

interface Product {
  id: string
  name: string
  price: number
  gst_rate: number
  unit: string
}
interface LineItem {
  product_id: string
  name: string
  unit: string
  qty: number
  price: number
  gst_rate: number
}

const GST = [0, 5, 12, 18, 28]

const inp = "w-full px-4 py-2.5 rounded text-[13px] outline-none transition-all placeholder:text-[#5B6B66] focus:border-[#00E58F] bg-[#0A110F] border border-[#1A2623] text-white"
const selectStyle = "w-full px-4 py-2.5 rounded text-[13px] outline-none transition-all focus:border-[#00E58F] bg-[#0A110F] border border-[#1A2623] text-white appearance-none"

export default function NewBillPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    gst: "",
  })
  const [items, setItems] = useState<LineItem[]>([
    { product_id: "", name: "", unit: "pcs", qty: 1, price: 0, gst_rate: 18 },
  ])
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/products`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
  }, [])

  function addItem() {
    setItems((p) => [
      ...p,
      { product_id: "", name: "", unit: "pcs", qty: 1, price: 0, gst_rate: 18 },
    ])
  }
  function removeItem(i: number) {
    setItems((p) => p.filter((_, idx) => idx !== i))
  }
  function setItem<K extends keyof LineItem>(i: number, k: K, v: LineItem[K]) {
    setItems((p) => p.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)))
  }
  function pickProduct(i: number, pid: string) {
    const p = products.find((pr) => pr.id === pid)
    if (p)
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === i
            ? { ...it, product_id: p.id, name: p.name, price: p.price, gst_rate: p.gst_rate, unit: p.unit }
            : it
        )
      )
    else setItem(i, "product_id", pid)
  }

  const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0)
  const cgst = subtotal * 0.09
  const sgst = subtotal * 0.09
  const totalGst = items.reduce((s, it) => s + (it.qty * it.price * it.gst_rate) / 100, 0)
  const total = subtotal + totalGst

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customer.name.trim()) {
      setError("Customer name is required.")
      return
    }
    if (items.some((it) => !it.name.trim())) {
      setError("All items must have a name.")
      return
    }
    setSaving(true)
    setError("")
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
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (!res.ok) {
        setError(data.error || `Server error (${res.status})`)
        setSaving(false)
        return
      }
      router.push(`/dashboard/bills/${data.bill.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error — please try again.")
      setSaving(false)
    }
  }

  const labelCls = "block text-[11px] font-bold uppercase tracking-widest text-[#00E58F]/70 mb-2"

  return (
    <>
      {/* Top header bar */}
      <header className="h-[60px] flex items-center justify-between px-8 flex-shrink-0 bg-[#0A0A0A] border-b border-[#1A2623]">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/bills" className="flex items-center justify-center w-8 h-8 rounded-full transition-colors hover:bg-[#00E58F]/10 text-[#94A39D] hover:text-[#00E58F]">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
             <h1 className="text-[16px] font-bold text-white tracking-wide">Generate New Invoice</h1>
             <p className="text-[12px] text-[#5B6B66]">Fill in the details below to create a professional GST bill</p>
          </div>
        </div>
      </header>

      {/* Page body */}
      <main className="flex-1 overflow-y-auto p-8 bg-[#0A0A0A]">

        <div className="max-w-[1200px] mx-auto">
          {error && (
            <div className="mb-6 px-4 py-3 rounded text-[13px] flex items-center gap-2 bg-[#FF4D4D]/10 border border-[#FF4D4D]/30 text-[#FF4D4D]">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* ─── CUSTOMER DETAILS ─── */}
            <section className="p-8 rounded-xl bg-[#0D1513] border border-[#1A2623] shadow-lg">
              <div className="flex items-center gap-2 mb-8 border-b border-[#1A2623] pb-4">
                <div className="w-8 h-8 rounded flex items-center justify-center bg-[#00E58F]/10 text-[#00E58F]">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-[13px] font-bold tracking-widest uppercase text-[#00E58F]">Customer Details</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className={labelCls}>Customer Name <span className="text-[#FF4D4D]">*</span></label>
                  <input className={inp} value={customer.name} onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))} placeholder="e.g. Acme Corp" required />
                </div>
                <div>
                  <label className={labelCls}>Email Address</label>
                  <input type="email" className={inp} value={customer.email} onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))} placeholder="billing@acmecorp.com" />
                </div>
                <div>
                  <label className={labelCls}>Phone Number</label>
                  <input className={inp} value={customer.phone} onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))} placeholder="+91 98765 43210" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelCls}>Customer GST No.</label>
                  <input className={`${inp} uppercase font-mono`} value={customer.gst} onChange={(e) => setCustomer((c) => ({ ...c, gst: e.target.value }))} placeholder="22AAAAA0000A1Z5" />
                </div>
                <div>
                  <label className={labelCls}>Bill Date</label>
                  <input type="date" className={inp} value={billDate} onChange={(e) => setBillDate(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Billing Address</label>
                  <input className={inp} value={customer.address} onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))} placeholder="123 Business Rd, City, State" />
                </div>
              </div>
            </section>

            {/* ─── LINE ITEMS ─── */}
            <section className="rounded-xl bg-[#0D1513] border border-[#1A2623] shadow-lg overflow-hidden">
              <div className="flex items-center gap-2 px-8 py-6 border-b border-[#1A2623]">
                <div className="w-8 h-8 rounded flex items-center justify-center bg-[#00E58F]/10 text-[#00E58F]">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <span className="text-[13px] font-bold tracking-widest uppercase text-[#00E58F]">Line Items</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[13px] text-left">
                  <thead>
                    <tr className="bg-[#0A110F] border-b border-[#1A2623]">
                       <th className="px-6 py-4 text-[10px] font-bold text-[#5B6B66] uppercase tracking-widest">Product / Item Name</th>
                       <th className="px-4 py-4 text-[10px] font-bold text-[#5B6B66] uppercase tracking-widest text-center w-[120px]">Qty</th>
                       <th className="px-4 py-4 text-[10px] font-bold text-[#5B6B66] uppercase tracking-widest text-right w-[150px]">Price (₹)</th>
                       <th className="px-4 py-4 text-[10px] font-bold text-[#5B6B66] uppercase tracking-widest text-center w-[120px]">GST %</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-[#5B6B66] uppercase tracking-widest text-right w-[150px]">Amount (₹)</th>
                       <th className="w-[60px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => {
                      const lineTotal = item.qty * item.price
                      const lineGst = (lineTotal * item.gst_rate) / 100
                      const lineAmount = lineTotal + lineGst
                      return (
                        <tr key={i} className={`border-b border-[#1A2623]/60 group ${i % 2 === 0 ? 'bg-[#0D1513]' : 'bg-[#0A110F]/30'}`}>
                          <td className="px-6 py-4">
                            <select className={selectStyle} value={item.product_id} onChange={(e) => pickProduct(i, e.target.value)}>
                              <option value="">+ Custom Product</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                            {!item.product_id && (
                              <input className={`${inp} mt-2`} value={item.name} onChange={(e) => setItem(i, "name", e.target.value)} placeholder="Enter custom item name..." required />
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <input type="number" min="0.001" step="0.001" className={`${inp} text-center font-mono`} value={item.qty} onChange={(e) => setItem(i, "qty", Number(e.target.value))} />
                          </td>
                          <td className="px-4 py-4">
                            <input type="number" min="0" step="0.01" className={`${inp} text-right font-mono`} value={item.price} onChange={(e) => setItem(i, "price", Number(e.target.value))} />
                          </td>
                          <td className="px-4 py-4">
                            <select className={`${selectStyle} text-center`} value={item.gst_rate} onChange={(e) => setItem(i, "gst_rate", Number(e.target.value))}>
                              {GST.map((r) => <option key={r} value={r}>{r}%</option>)}
                            </select>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className="text-white font-medium text-[14px]">₹{lineAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {items.length > 1 && (
                              <button type="button" onClick={() => removeItem(i)} className="p-2 inline-flex rounded text-[#94A39D] hover:bg-[#FF4D4D]/10 hover:text-[#FF4D4D] transition-colors" title="Remove row">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 bg-[#0A110F] border-t border-[#1A2623]">
                <button type="button" onClick={addItem} className="flex items-center gap-2 text-[12px] font-bold transition-colors text-[#00E58F] hover:text-[#00FFAA] uppercase tracking-wide">
                  <div className="w-6 h-6 rounded flex items-center justify-center bg-[#00E58F]/10 border border-[#00E58F]/20">
                    <Plus className="w-3 h-3" />
                  </div>
                  Add Another Item
                </button>
              </div>
            </section>

            {/* ─── NOTES & SUMMARY ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-8 rounded-xl bg-[#0D1513] border border-[#1A2623] shadow-lg flex flex-col">
                <div className="flex items-center gap-2 mb-6 border-b border-[#1A2623] pb-4">
                  <div className="w-8 h-8 rounded flex items-center justify-center bg-[#00E58F]/10 text-[#00E58F]">
                    <AlignLeft className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] font-bold tracking-widest uppercase text-[#00E58F]">Notes & Terms</span>
                </div>
                <textarea className={`${inp} resize-none flex-1 min-h-[140px]`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add payment instructions, return policies, or internal notes..." />
              </div>

              <div className="p-8 rounded-xl bg-[#0D1513] border border-[#1A2623] shadow-lg flex flex-col justify-center">
                <div className="flex justify-between items-center mb-4 text-[13px]">
                  <span className="text-[#94A39D]">Subtotal</span>
                  <span className="text-white font-medium">₹ {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center mb-4 text-[13px]">
                  <span className="text-[#94A39D]">CGST</span>
                  <span className="text-white font-medium">₹ {cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center mb-6 text-[13px]">
                  <span className="text-[#94A39D]">SGST</span>
                  <span className="text-white font-medium">₹ {sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="pt-6 border-t border-[#1A2623] flex justify-between items-baseline">
                  <span className="text-[13px] font-bold uppercase tracking-widest text-[#00E58F]">Grand Total</span>
                  <span className="text-[32px] font-bold text-[#00E58F] tracking-tight">
                    ₹ {total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* ─── ACTION BUTTONS ─── */}
            <div className="flex justify-end gap-4 pt-6 mt-4">
              <Link href="/dashboard/bills" className="px-8 py-3 rounded text-[13px] font-bold text-[#94A39D] hover:text-white border border-[#1A2623] bg-[#0A110F] hover:bg-[#1A2623] transition-all uppercase tracking-wide">
                Cancel
              </Link>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-8 py-3 rounded text-[13px] font-bold border border-[#00E58F] bg-[#00E58F] text-[#0A110F] hover:bg-[#00FFAA] hover:border-[#00FFAA] transition-all disabled:opacity-50 uppercase tracking-wide shadow-[0_0_15px_rgba(0,229,143,0.3)]">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {saving ? "GENERATING..." : "GENERATE INVOICE"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  )
}
