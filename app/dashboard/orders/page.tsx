"use client"

import { useState, useEffect, useCallback } from "react"
import DashboardHeader from "@/components/dashboard/header"
import {
    CheckCircle2, Clock, Loader2, Package, ShoppingBag, XCircle,
    Plus, X, User, ShoppingCart, AlertCircle, Trash2, Search,
    ReceiptText, MapPin, Phone, Mail, FileText,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderItem { id: string; name: string; quantity: number; price: number; unit?: string }
interface Order {
    id: string; created_at: string; customer_name: string
    phone: string; email?: string; address: string; notes?: string
    status: "pending" | "confirmed" | "fulfilled" | "cancelled"
    total_amount: number; items: OrderItem[]; source?: string
}
interface Product { id: string; name: string; price: number; unit: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inp = "w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-all placeholder:text-[#5B6B66] focus:border-[#00E58F] bg-[#0A110F] border border-[#1A2623] text-white"
const sel = `${inp} appearance-none cursor-pointer`
const lbl = "block text-[10px] font-bold uppercase tracking-widest text-[#00E58F]/60 mb-1.5"

function blank(): { name: string; quantity: number; price: number; id: string | null; unit: string } {
    return { name: "", quantity: 1, price: 0, id: null, unit: "pcs" }
}

const STATUS_MAP = {
    pending: { label: "Pending", cls: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
    confirmed: { label: "Confirmed", cls: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    fulfilled: { label: "Fulfilled", cls: "bg-[#00E58F]/10 text-[#00E58F] border-[#00E58F]/20" },
    cancelled: { label: "Cancelled", cls: "bg-red-500/10 text-red-500 border-red-500/20" },
}

// ─── Create Order Panel ───────────────────────────────────────────────────────
function CreateOrderPanel({ open, onClose, onCreated }: {
    open: boolean; onClose: () => void; onCreated: (o: Order) => void
}) {
    const [products, setProducts] = useState<Product[]>([])
    const [productSearch, setProductSearch] = useState("")
    const [customer, setCustomer] = useState({ name: "", phone: "", email: "", address: "" })
    const [items, setItems] = useState([blank()])
    const [notes, setNotes] = useState("")
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!open) return
        fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/products`).then(r => r.json()).then(d => setProducts(d.products ?? []))
    }, [open])

    useEffect(() => {
        if (open) {
            setCustomer({ name: "", phone: "", email: "", address: "" })
            setItems([blank()])
            setNotes(""); setError(""); setProductSearch("")
        }
    }, [open])

    const filtered = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))

    function setItem<K extends keyof ReturnType<typeof blank>>(i: number, k: K, v: any) {
        setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it))
    }

    function pickProduct(i: number, pid: string) {
        const p = products.find(pr => pr.id === pid)
        if (p) setItems(prev => prev.map((it, idx) => idx === i ? { ...it, id: p.id, name: p.name, price: p.price, unit: p.unit } : it))
        else setItem(i, "id", pid || null)
    }

    const total = items.reduce((s, it) => s + it.quantity * it.price, 0)

    async function submit() {
        setError("")
        if (!customer.name.trim()) { setError("Customer name is required."); return }
        if (items.some(it => !it.name.trim())) { setError("All items must have a name."); return }
        setSaving(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer_name: customer.name,
                    phone: customer.phone,
                    email: customer.email,
                    address: customer.address,
                    notes,
                    items,
                }),
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error || `Error ${res.status}`); return }
            onCreated(data.order)
            onClose()
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unexpected error")
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            {open && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />}
            <div
                className="fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300 ease-out"
                style={{
                    width: "min(640px, 95vw)",
                    background: "#0A0A0A",
                    borderLeft: "1px solid #1A2623",
                    transform: open ? "translateX(0)" : "translateX(100%)",
                    boxShadow: open ? "-20px 0 60px rgba(0,0,0,0.6)" : "none",
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2623] flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#00E58F]/10 border border-[#00E58F]/20">
                            <ReceiptText className="w-4 h-4 text-[#00E58F]" />
                        </div>
                        <div>
                            <h2 className="text-[15px] font-bold text-white">Create Manual Order</h2>
                            <p className="text-[11px] text-[#5B6B66]">Add an order on behalf of a customer</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-[#5B6B66] hover:text-white hover:bg-[#1A2623] transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,229,143,0.1) transparent" }}>
                    {error && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-[12px] bg-[#FF4D4D]/10 border border-[#FF4D4D]/30 text-[#FF4D4D]">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                        </div>
                    )}

                    {/* Customer Details */}
                    <section className="rounded-xl bg-[#0D1513] border border-[#1A2623] overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#1A2623]">
                            <User className="w-3.5 h-3.5 text-[#00E58F]" />
                            <span className="text-[11px] font-bold uppercase tracking-widest text-[#00E58F]">Customer Details</span>
                        </div>
                        <div className="p-5 grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className={lbl}>Full Name <span className="text-[#FF4D4D]">*</span></label>
                                <input className={inp} value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} placeholder="e.g. Ramesh Sharma" />
                            </div>
                            <div>
                                <label className={lbl}><Phone className="w-2.5 h-2.5 inline mr-1" />Phone</label>
                                <input className={inp} value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} placeholder="+91 98765 43210" />
                            </div>
                            <div>
                                <label className={lbl}><Mail className="w-2.5 h-2.5 inline mr-1" />Email</label>
                                <input type="email" className={inp} value={customer.email} onChange={e => setCustomer(c => ({ ...c, email: e.target.value }))} placeholder="customer@email.com" />
                            </div>
                            <div className="col-span-2">
                                <label className={lbl}><MapPin className="w-2.5 h-2.5 inline mr-1" />Delivery Address</label>
                                <input className={inp} value={customer.address} onChange={e => setCustomer(c => ({ ...c, address: e.target.value }))} placeholder="123 Street, City, State, PIN" />
                            </div>
                        </div>
                    </section>

                    {/* Order Items */}
                    <section className="rounded-xl bg-[#0D1513] border border-[#1A2623] overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1A2623]">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="w-3.5 h-3.5 text-[#00E58F]" />
                                <span className="text-[11px] font-bold uppercase tracking-widest text-[#00E58F]">Order Items</span>
                            </div>
                            <div className="relative">
                                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5B6B66]" />
                                <input
                                    className="pl-7 pr-3 py-1.5 rounded-lg text-[11px] bg-[#0A110F] border border-[#1A2623] text-white outline-none focus:border-[#00E58F]/50 placeholder:text-[#5B6B66] w-[150px]"
                                    placeholder="Search products..."
                                    value={productSearch}
                                    onChange={e => setProductSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-5 space-y-3">
                            {items.map((item, i) => (
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
                                    <div className="mb-3">
                                        <label className={lbl}>Product</label>
                                        <select className={sel} value={item.id || ""} onChange={e => pickProduct(i, e.target.value)}>
                                            <option value="">— Custom Item —</option>
                                            {filtered.map(p => <option key={p.id} value={p.id}>{p.name} — ₹{p.price} / {p.unit}</option>)}
                                        </select>
                                        {!item.id && (
                                            <input className={`${inp} mt-2`} value={item.name} onChange={e => setItem(i, "name", e.target.value)} placeholder="Custom item name" />
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={lbl}>Quantity</label>
                                            <input type="number" min="1" step="1" className={`${inp} text-center font-mono`} value={item.quantity} onChange={e => setItem(i, "quantity", Number(e.target.value))} />
                                        </div>
                                        <div>
                                            <label className={lbl}>Price per unit (₹)</label>
                                            <input type="number" min="0" step="0.01" className={`${inp} font-mono`} value={item.price} onChange={e => setItem(i, "price", Number(e.target.value))} />
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-[#1A2623] flex justify-between">
                                        <span className="text-[11px] text-[#5B6B66]">{item.quantity} × ₹{item.price}</span>
                                        <span className="text-[13px] font-bold text-[#00E58F]">₹{(item.quantity * item.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={() => setItems(p => [...p, blank()])} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-bold text-[#00E58F] border border-dashed border-[#00E58F]/30 hover:border-[#00E58F]/60 hover:bg-[#00E58F]/5 transition-all">
                                <Plus className="w-3.5 h-3.5" /> Add Another Item
                            </button>
                        </div>
                    </section>

                    {/* Notes */}
                    <section className="rounded-xl bg-[#0D1513] border border-[#1A2623] overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#1A2623]">
                            <FileText className="w-3.5 h-3.5 text-[#00E58F]" />
                            <span className="text-[11px] font-bold uppercase tracking-widest text-[#00E58F]">Order Notes</span>
                        </div>
                        <div className="p-5">
                            <textarea className={`${inp} resize-none min-h-[70px]`} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Delivery instructions, special requests…" />
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 border-t border-[#1A2623] bg-[#0D1513]">
                    <div className="px-6 py-3 flex items-center justify-between">
                        <span className="text-[12px] text-[#94A39D]">{items.length} item{items.length !== 1 ? "s" : ""} · Order Total</span>
                        <span className="text-[22px] font-bold text-[#00E58F]">₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="px-6 pb-5 grid grid-cols-2 gap-3">
                        <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-[12px] font-bold text-[#94A39D] hover:text-white border border-[#1A2623] bg-[#0A110F] hover:bg-[#1A2623] transition-all uppercase tracking-wide">
                            Cancel
                        </button>
                        <button
                            onClick={submit}
                            disabled={saving}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-[12px] font-bold bg-[#00E58F] text-[#0A110F] hover:bg-[#00FFAA] transition-all disabled:opacity-50 uppercase tracking-wide shadow-[0_0_15px_rgba(0,229,143,0.3)]"
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                            {saving ? "Creating…" : "Create Order"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

// ─── Orders Page ──────────────────────────────────────────────────────────────
export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [panelOpen, setPanelOpen] = useState(false)
    const [filter, setFilter] = useState<"all" | Order["status"]>("all")
    const [search, setSearch] = useState("")

    const fetchOrders = useCallback(async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/orders`)
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            setOrders(data.orders || [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchOrders() }, [fetchOrders])

    async function updateStatus(id: string, status: string) {
        setProcessingId(id)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/orders/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            })
            if (!res.ok) throw new Error("Failed to update status")
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as any } : o))
        } catch (err: any) {
            alert(err.message)
        } finally {
            setProcessingId(null)
        }
    }

    function handleCreated(order: Order) {
        setOrders(prev => [order, ...prev])
    }

    const pendingCount = orders.filter(o => o.status === "pending").length
    const fulfilledCount = orders.filter(o => o.status === "fulfilled").length

    const displayed = orders.filter(o => {
        const matchFilter = filter === "all" || o.status === filter
        const matchSearch = !search || o.customer_name?.toLowerCase().includes(search.toLowerCase())
        return matchFilter && matchSearch
    })

    return (
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#060B09]">
            <DashboardHeader title="Store Orders" subtitle="Manage customer orders — online and manually created" />

            <main className="flex-1 overflow-y-auto p-6 text-white max-w-5xl mx-auto w-full">

                {error && (
                    <div className="bg-[#FF4D4D]/10 text-[#FF4D4D] p-4 rounded-xl mb-6 border border-[#FF4D4D]/20 font-bold">{error}</div>
                )}

                {/* ── Top bar ── */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    {/* KPI mini cards */}
                    <div className="flex gap-3">
                        <div className="bg-[#0A110F] border border-[#1A2623] rounded-2xl p-4 flex items-center gap-3 min-w-[160px]">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-[#94A39D] text-[10px] font-bold uppercase tracking-widest">Pending</p>
                                <p className="text-2xl font-black text-white">{pendingCount}</p>
                            </div>
                        </div>
                        <div className="bg-[#0A110F] border border-[#1A2623] rounded-2xl p-4 flex items-center gap-3 min-w-[160px]">
                            <div className="w-10 h-10 rounded-xl bg-[#00E58F]/10 flex items-center justify-center">
                                <ShoppingBag className="w-5 h-5 text-[#00E58F]" />
                            </div>
                            <div>
                                <p className="text-[#94A39D] text-[10px] font-bold uppercase tracking-widest">Total</p>
                                <p className="text-2xl font-black text-white">{orders.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Search */}
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6B66]" />
                            <input
                                className="pl-9 pr-4 py-2 rounded-lg text-[12px] bg-[#0A110F] border border-[#1A2623] text-white outline-none focus:border-[#00E58F]/50 placeholder:text-[#5B6B66] w-[200px]"
                                placeholder="Search by customer…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Filter tabs */}
                        <div className="flex items-center gap-1 rounded-lg p-1 bg-[#0A110F] border border-[#1A2623]">
                            {(["all", "pending", "confirmed", "fulfilled", "cancelled"] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${filter === f ? "bg-[#00E58F] text-[#0A110F]" : "text-[#5B6B66] hover:text-white"}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        {/* Create order */}
                        <button
                            onClick={() => setPanelOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border border-[#00E58F] bg-[#00E58F] text-[#0A110F] hover:bg-[#00FFAA] transition-all uppercase tracking-wide shadow-[0_0_15px_rgba(0,229,143,0.3)]"
                        >
                            <Plus className="w-4 h-4" /> New Order
                        </button>
                    </div>
                </div>

                {/* ── Content ── */}
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#00E58F]" /></div>
                ) : displayed.length === 0 ? (
                    <div className="bg-[#0A110F] border border-[#1A2623] rounded-3xl p-16 flex flex-col items-center justify-center text-center">
                        <Package className="w-16 h-16 text-[#5B6B66] mb-6 opacity-50" />
                        <h2 className="text-2xl font-bold mb-2">No orders found</h2>
                        <p className="text-[#94A39D] mb-6">
                            {search || filter !== "all" ? "Try adjusting your filters." : "Create your first manual order or share your store link."}
                        </p>
                        {!search && filter === "all" && (
                            <button onClick={() => setPanelOpen(true)} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-[#00E58F] text-[#0A110F] hover:bg-[#00FFAA] transition-all">
                                <Plus className="w-4 h-4" /> Create Order
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5">
                        {displayed.map(order => {
                            const sc = STATUS_MAP[order.status]
                            return (
                                <div key={order.id} className="bg-[#0A110F] border border-[#1A2623] rounded-3xl overflow-hidden hover:border-[#1A2623]/80 transition-all flex flex-col md:flex-row">

                                    {/* Left: Details */}
                                    <div className="p-6 md:p-8 flex-1 border-b md:border-b-0 md:border-r border-[#1A2623]">
                                        <div className="flex justify-between items-start mb-5">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-xl font-bold">{order.customer_name}</h3>
                                                    {order.source === "manual" && (
                                                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-purple-500/10 text-purple-400 border border-purple-500/20">Manual</span>
                                                    )}
                                                </div>
                                                <p className="text-[#00E58F] font-mono text-xs mb-1">ID: {order.id.slice(0, 8).toUpperCase()}</p>
                                                <span className="text-xs text-[#5B6B66]">{new Date(order.created_at).toLocaleString("en-IN")}</span>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${sc.cls}`}>{sc.label}</span>
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-5">
                                            {order.phone && <div><p className="text-[#5B6B66] text-[10px] font-bold uppercase tracking-wider mb-1">Phone</p><p className="font-medium text-[#E1E7E5]">{order.phone}</p></div>}
                                            {order.email && <div><p className="text-[#5B6B66] text-[10px] font-bold uppercase tracking-wider mb-1">Email</p><p className="font-medium text-[#E1E7E5]">{order.email}</p></div>}
                                            {order.address && <div><p className="text-[#5B6B66] text-[10px] font-bold uppercase tracking-wider mb-1">Address</p><p className="font-medium text-[#E1E7E5] leading-relaxed">{order.address}</p></div>}
                                            {order.notes && <div className="col-span-2 lg:col-span-3"><p className="text-[#5B6B66] text-[10px] font-bold uppercase tracking-wider mb-1">Notes</p><p className="text-[#94A39D] text-sm italic">{order.notes}</p></div>}
                                        </div>

                                        {/* Action buttons */}
                                        {order.status === "pending" && (
                                            <div className="flex gap-3 mt-2">
                                                <button onClick={() => updateStatus(order.id, "confirmed")} disabled={processingId === order.id} className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold bg-[#00E58F] text-[#0A0A0A] hover:bg-[#00FFAA] transition-colors flex justify-center items-center gap-2">
                                                    {processingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Accept Order
                                                </button>
                                                <button onClick={() => updateStatus(order.id, "cancelled")} disabled={processingId === order.id} className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold border border-[#1A2623] hover:border-red-500 hover:text-red-500 hover:bg-red-500/10 transition-colors flex justify-center items-center gap-2 text-[#94A39D]">
                                                    <XCircle className="w-4 h-4" /> Decline
                                                </button>
                                            </div>
                                        )}
                                        {order.status === "confirmed" && (
                                            <button onClick={() => updateStatus(order.id, "fulfilled")} disabled={processingId === order.id} className="w-full mt-2 py-2.5 px-4 rounded-xl text-sm font-bold bg-[#00E58F]/20 text-[#00E58F] border border-[#00E58F]/30 hover:bg-[#00E58F]/30 transition-colors flex justify-center items-center gap-2">
                                                {processingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Mark as Fulfilled
                                            </button>
                                        )}
                                    </div>

                                    {/* Right: Items */}
                                    <div className="p-6 md:p-8 md:w-72 bg-[#131B19]/30 flex flex-col">
                                        <h4 className="font-bold text-[#94A39D] uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
                                            <ShoppingBag className="w-4 h-4" /> Order Items
                                        </h4>
                                        <div className="flex-1 overflow-y-auto space-y-3 max-h-48 pr-1">
                                            {order.items.map((item, i) => (
                                                <div key={i} className="flex justify-between items-start text-sm border-b border-[#1A2623]/50 pb-2.5 last:border-0 last:pb-0">
                                                    <div className="flex-1 pr-3">
                                                        <p className="font-bold text-white line-clamp-1">{item.name}</p>
                                                        <p className="text-[#5B6B66] text-xs">Qty: {item.quantity}</p>
                                                    </div>
                                                    <p className="font-black text-[#00E58F] shrink-0">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="pt-4 mt-2 border-t border-[#1A2623] flex items-center justify-between">
                                            <span className="text-[#5B6B66] font-bold uppercase tracking-wider text-xs">Total</span>
                                            <span className="text-2xl font-black text-[#00E58F]">₹{order.total_amount.toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>

            <CreateOrderPanel open={panelOpen} onClose={() => setPanelOpen(false)} onCreated={handleCreated} />
        </div>
    )
}
