"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState, useEffect, useCallback } from "react"

import {
    Search, Package, TrendingUp, TrendingDown, Minus,
    AlertTriangle, BarChart3, IndianRupee, ShoppingCart,
    ArrowRight, RefreshCw, Loader2, Plus, Boxes,
    ClipboardList, Upload, Image as ImageIcon, Share2, CheckCircle2
} from "lucide-react"
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from "recharts"

// ─── Types ────────────────────────────────────────────────────────────────────
type Product = {
    id: string
    name: string
    sku: string
    category: string
    unit: string
    price: number
    cost_price: number
    gst_rate: number
    stock_qty: number
    total_sold: number
    total_revenue: number
    bill_count: number
    image_url?: string
}

type MonthlySale = {
    product_id: string
    month: string
    month_key: string
    qty_sold: number
    revenue: number
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const accent = "#00d4ff"
const green = "#00E58F"
const red = "#FF4D4D"
const amber = "#f59e0b"
const purple = "#a78bfa"
const card = { background: "#0A110F", borderColor: "#1A2623" }
const PIE_COLORS = [accent, green, purple, amber, red, "#60a5fa", "#fb7185", "#f472b6"]


function fmt(n: number) {
    if (!n || isNaN(n)) return "₹0"
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`
    if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`
    if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`
    return `₹${Math.round(n).toLocaleString("en-IN")}`
}

function StockBadge({ qty, unit }: { qty: number; unit: string }) {
    const color = qty === 0 ? red : qty < 10 ? amber : green
    const label = qty === 0 ? "Out of Stock" : qty < 10 ? "Low Stock" : "In Stock"
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
            style={{ background: `${color}15`, color, borderColor: `${color}30` }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
            {qty} {unit} · {label}
        </span>
    )
}

function ChartTip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-lg border px-3 py-2 text-xs" style={{ background: "rgba(6,13,31,0.97)", borderColor: "rgba(255,255,255,0.12)" }}>
            <p className="text-white font-semibold mb-1">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.color }}>
                    {p.name}: <strong>{p.name?.toLowerCase().includes("revenue") ? fmt(p.value) : p.value}</strong>
                </p>
            ))}
        </div>
    )
}

// ─── Product Detail Card (shown when a single product is selected) ────────────
function ProductDetail({ product, monthlySales }: { product: Product; monthlySales: MonthlySale[] }) {
    const margin = product.cost_price > 0
        ? Math.round(((product.price - product.cost_price) / product.price) * 100)
        : null
    const profit = product.cost_price > 0
        ? (product.price - product.cost_price) * product.total_sold
        : null

    const chartData = monthlySales.map(m => ({
        month: m.month,
        "Units Sold": m.qty_sold,
        "Revenue": Number(m.revenue),
    }))

    return (
        <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="rounded-2xl border p-6" style={{ background: `${accent}0A`, borderColor: `${accent}30` }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-4">
                        {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-xl object-cover border border-[#1A2623] flex-shrink-0" />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-[#0A110F] border border-[#1A2623] flex items-center justify-center flex-shrink-0">
                                <ImageIcon className="w-6 h-6 text-[#5B6B66]" />
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h2 className="text-xl font-extrabold text-white tracking-tight">{product.name}</h2>
                                {product.sku && <span className="text-[10px] uppercase tracking-wider font-mono font-bold px-2.5 py-1 rounded-md border border-[#1A2623] bg-[#060B09] text-[#94A39D]">{product.sku}</span>}
                                {product.category && <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border" style={{ background: `${accent}15`, color: accent, borderColor: `${accent}30` }}>{product.category}</span>}
                            </div>
                            <StockBadge qty={product.stock_qty} unit={product.unit} />
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-extrabold text-white tracking-tight">₹{Number(product.price).toLocaleString("en-IN")}</p>
                        <p className="text-xs font-medium text-[#5B6B66] mt-1 uppercase tracking-wider">selling price · GST {product.gst_rate}%</p>
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Stock Left", value: `${product.stock_qty} ${product.unit}`, color: product.stock_qty < 10 ? red : green, icon: Boxes },
                    { label: "Total Units Sold", value: `${product.total_sold} ${product.unit}`, color: accent, icon: ShoppingCart },
                    { label: "Total Revenue", value: fmt(Number(product.total_revenue)), color: purple, icon: IndianRupee },
                    { label: "Bills Appeared In", value: `${product.bill_count} bills`, color: amber, icon: BarChart3 },
                ].map(m => (
                    <div key={m.label} className="rounded-2xl border-[#1A2623] bg-[#0A110F] border p-5 shadow-lg relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <m.icon className="w-5 h-5 mb-3 relative z-10" style={{ color: m.color }} />
                        <p className="text-xl font-extrabold tracking-tight relative z-10" style={{ color: m.color }}>{m.value}</p>
                        <p className="text-[10px] text-[#5B6B66] font-bold mt-1 uppercase tracking-widest relative z-10">{m.label}</p>
                    </div>
                ))}
            </div>

            {/* Margin cards */}
            {(margin !== null || profit !== null) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl border p-5 border-[#1A2623] bg-[#0A110F] shadow-lg">
                        <p className="text-[10px] text-[#5B6B66] font-bold uppercase tracking-widest mb-2">Cost Price</p>
                        <p className="text-xl font-extrabold text-white tracking-tight">₹{Number(product.cost_price).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="rounded-2xl border p-5 bg-[#0A110F] shadow-lg relative overflow-hidden" style={{ borderColor: `${green}40` }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-[#00E58F]/5 to-transparent"></div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-2 relative z-10" style={{ color: green }}>Gross Margin</p>
                        <p className="text-xl font-extrabold tracking-tight relative z-10" style={{ color: green }}>{margin}%</p>
                        <p className="text-[10px] font-medium text-[#94A39D] mt-1 relative z-10">₹{(product.price - product.cost_price).toFixed(2)} per unit</p>
                    </div>
                    <div className="rounded-2xl border p-5 bg-[#0A110F] shadow-lg relative overflow-hidden" style={{ borderColor: `${purple}40` }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-[#a78bfa]/5 to-transparent"></div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-2 relative z-10" style={{ color: purple }}>Total Profit Earned</p>
                        <p className="text-xl font-extrabold tracking-tight relative z-10" style={{ color: purple }}>{fmt(profit!)}</p>
                        <p className="text-[10px] font-medium text-[#94A39D] mt-1 relative z-10">from {product.total_sold} units sold</p>
                    </div>
                </div>
            )}

            {/* Monthly sales chart */}
            {chartData.length > 0 ? (
                <div className="rounded-2xl border p-6 border-[#1A2623] bg-[#0A110F] shadow-lg">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" style={{ color: green }} />Sales History (Monthly)
                    </h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={purple} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={purple} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="qtyGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={accent} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={accent} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1A2623" />
                            <XAxis dataKey="month" tick={{ fill: "#5B6B66", fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left" tick={{ fill: "#5B6B66", fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" tickFormatter={v => fmt(v)} tick={{ fill: "#5B6B66", fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} width={60} />
                            <Tooltip content={<ChartTip />} cursor={{ stroke: '#1A2623', strokeWidth: 1 }} />
                            <Area yAxisId="left" type="monotone" dataKey="Units Sold" stroke={accent} fill="url(#qtyGrad)" strokeWidth={3} dot={{ fill: accent, r: 4, stroke: "#0A110F", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            <Area yAxisId="right" type="monotone" dataKey="Revenue" stroke={purple} fill="url(#revenueGrad)" strokeWidth={3} dot={{ fill: purple, r: 4, stroke: "#0A110F", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-6 mt-4 justify-center text-xs text-[#94A39D] font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-2"><span className="w-4 h-1 inline-block rounded-full" style={{ background: accent }} />Units Sold</span>
                        <span className="flex items-center gap-2"><span className="w-4 h-1 inline-block rounded-full" style={{ background: purple }} />Revenue</span>
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border p-10 text-center border-[#1A2623] bg-[#0A110F] shadow-lg flex flex-col items-center justify-center min-h-[250px]">
                    <BarChart3 className="w-10 h-10 mb-4 text-[#1A2623]" />
                    <p className="text-base font-bold text-white mb-2">No sales recorded yet</p>
                    <p className="text-sm font-medium text-[#5B6B66]">Start creating bills to track sales history here.</p>
                </div>
            )}
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InventorySearchClient({ userId }: { userId?: string }) {
    const router = useRouter()
    const params = useSearchParams()
    const [query, setQuery] = useState("")
    const [loading, setLoading] = useState(false)
    const [allProducts, setAllProducts] = useState<Product[]>([])
    const [results, setResults] = useState<Product[] | null>(null)
    const [monthlySales, setMonthlySales] = useState<MonthlySale[]>([])
    const [selected, setSelected] = useState<Product | null>(null)
    const [loadingAll, setLoadingAll] = useState(true)
    const [copiedShare, setCopiedShare] = useState(false)
    const [networkIp, setNetworkIp] = useState<string | null>(null)
    const pathname = usePathname()

    // Load all products on mount for overview stats
    const loadAll = useCallback(async () => {
        setLoadingAll(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/inventory-search`)
            const data = await res.json()
            setAllProducts(data.products || [])
            if (data.networkIp) setNetworkIp(data.networkIp)
        } catch { }
        finally { setLoadingAll(false) }
    }, [])
    useEffect(() => {
        loadAll()
    }, [loadAll])
   
    useEffect(() => {
        const qParam = params.get("q")
        if (!qParam) return

        const q: string = qParam

        // avoid duplicate search
        if (q === query) return

        setQuery(q)

        async function runSearch() {
            setLoading(true)
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/inventory-search?q=${encodeURIComponent(q)}`)
                const data = await res.json()

                setResults(data.products || [])
                setMonthlySales(data.monthlySales || [])
            } catch {}
            finally {
                setLoading(false)
            }
        }

        runSearch()
    }, [params])

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault()

        const q = query.trim()

        if (!q) {
            router.push(pathname)
            setResults(null)
            setSelected(null)
            setMonthlySales([])
            return
        }

        // update URL so useSearchParams reacts
        router.push(`${pathname}?q=${encodeURIComponent(q)}`)
    }

    // Overview analytics from allProducts
    const totalStock = allProducts.reduce((s, p) => s + (p.stock_qty || 0), 0)
    const totalSold = allProducts.reduce((s, p) => s + (p.total_sold || 0), 0)
    const totalRev = allProducts.reduce((s, p) => s + Number(p.total_revenue || 0), 0)
    const lowStock = allProducts.filter(p => p.stock_qty > 0 && p.stock_qty < 10)
    const outOfStock = allProducts.filter(p => p.stock_qty === 0)

    // Category breakdown for pie chart
    const catMap: Record<string, number> = {}
    for (const p of allProducts) {
        const cat = p.category || "Uncategorised"
        catMap[cat] = (catMap[cat] || 0) + Number(p.total_revenue || 0)
    }
    const catData = Object.entries(catMap)
        .map(([name, value]) => ({ name, value: Math.round(value) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)

    // Top sellers bar chart
    const topSellers = [...allProducts]
        .sort((a, b) => b.total_sold - a.total_sold)
        .slice(0, 8)
        .map(p => ({ name: p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name, "Units Sold": p.total_sold, Revenue: Number(p.total_revenue) }))

    const displayList = results ?? allProducts

    function handleShare() {
        if (!userId) return;
        const origin = window.location.origin;
        const isLocalHost = origin.includes("localhost") || origin.includes("127.0.0.1");

        let shareUrl = `${origin}/store/${userId}`;
        if (isLocalHost && networkIp) {
            shareUrl = `http://${networkIp}:${window.location.port || "3000"}/store/${userId}`;
        }

        navigator.clipboard.writeText(shareUrl)
        setCopiedShare(true)
        setTimeout(() => setCopiedShare(false), 2000)
    }

    return (
        <div className="flex flex-col gap-6">
            {/* ── Search Bar ── */}
            <form onSubmit={handleSearch} className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5B6B66]" />
                    <input value={query} onChange={e => setQuery(e.target.value)}
                        placeholder="Search inventory by product name, SKU, or category..."
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-[15px] font-medium bg-[#0A110F] border border-[#1A2623] text-white placeholder:text-[#5B6B66] outline-none focus:border-[#00E58F]/50 focus:shadow-[0_0_20px_rgba(0,229,143,0.1)] transition-all shadow-lg"
                    />
                </div>
                <button type="submit" disabled={loading}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-[15px] font-bold transition-all hover:bg-[#00FFAA] hover:shadow-[0_0_15px_rgba(0,229,143,0.4)] disabled:opacity-50 shadow-lg bg-[#00E58F] text-[#0A0A0A]">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" strokeWidth={3} />}
                    {loading ? "Searching..." : "Search"}
                </button>
                {results !== null && (
                    <button type="button" onClick={() => { setQuery(""); setResults(null); setSelected(null) }}
                        className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[15px] font-bold border border-[#1A2623] bg-[#0A110F] text-[#94A39D] hover:bg-[#131B19] hover:text-white transition-all shadow-lg">
                        <RefreshCw className="w-4 h-4" />Clear
                    </button>
                )}
            </form>

            {/* ── Add product CTA ── */}
            <div className="flex items-center justify-between flex-wrap gap-4 mt-2">
                <div className="text-[13px] font-bold flex items-center gap-3 text-[#94A39D] tracking-wide relative">
                    <div className="w-8 h-8 rounded-full bg-[#1A2623] border border-[#1A2623] flex items-center justify-center mr-1 relative">
                        <Package className="w-4 h-4 text-[#5B6B66]" />
                        <span className="w-2.5 h-2.5 bg-[#00E58F] rounded-full absolute -top-0.5 -right-0.5 border border-[#0A110F]"></span>
                    </div>
                    {loadingAll ? "Loading..." : `${allProducts.length} PRODUCTS IN INVENTORY`}
                    <span className="text-[10px] text-[#00E58F] uppercase tracking-widest font-extrabold bg-[#00E58F]/10 px-2.5 py-1 rounded-full border border-[#00E58F]/20 ml-2">SYSTEM ACTIVE</span>
                </div>
                <div className="flex items-center gap-4">
                    {userId && (
                        <button onClick={handleShare}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-[13px] font-bold transition-all border border-[#1A2623] hover:bg-[#131B19] shadow-lg bg-[#0A110F] text-[#00d4ff] uppercase tracking-wide">
                            {copiedShare ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" strokeWidth={3} />}
                            {copiedShare ? "Link Copied!" : "Share Store"}
                        </button>
                    )}
                    <button onClick={() => router.push("/dashboard/products")}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl text-[13px] font-bold transition-all hover:bg-[#00FFAA] shadow-[0_0_15px_rgba(0,229,143,0.3)] bg-[#00E58F] text-[#0A0A0A] uppercase tracking-wide">
                        <Plus className="w-4 h-4" strokeWidth={3} />Add / Manage Products
                    </button>
                </div>
            </div>

            {/* ── Overview Stats (shown when not searching) ── */}
            {
                results === null && !loadingAll && allProducts.length > 0 && (
                    <>
                        {/* KPI row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: "Total SKUs", value: allProducts.length, color: "#00d4ff", suffix: "products" },
                                { label: "Total Stock", value: totalStock, color: "#00E58F", suffix: "units" },
                                { label: "Total Units Sold", value: totalSold, color: "#a78bfa", suffix: "units" },
                                { label: "Total Revenue", value: fmt(totalRev), color: "#f59e0b", suffix: "" },
                            ].map(m => (
                                <div key={m.label} className="rounded-2xl border border-[#1A2623] bg-[#0A110F] p-5 shadow-lg relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <p className="text-[10px] text-[#5B6B66] font-bold uppercase tracking-widest mb-2 relative z-10">{m.label}</p>
                                    <p className="text-2xl font-extrabold tracking-tight relative z-10" style={{ color: m.color }}>{m.value}</p>
                                    {m.suffix && <p className="text-[10px] text-[#5B6B66] mt-1 relative z-10">{m.suffix}</p>}
                                </div>
                            ))}
                        </div>

                        {/* Charts row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-2">
                            {/* Top Sellers Bar Chart */}
                            {topSellers.length > 0 && (
                                <div className="rounded-2xl border border-[#1A2623] bg-[#0A110F] p-6 shadow-lg">
                                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-[#00d4ff]" />Top Selling Products
                                    </h3>
                                    <ResponsiveContainer width="100%" height={240}>
                                        <BarChart data={topSellers} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1A2623" horizontal={false} />
                                            <XAxis type="number" tick={{ fill: "#5B6B66", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                            <YAxis type="category" dataKey="name" tick={{ fill: "#94A39D", fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} width={100} />
                                            <Tooltip content={<ChartTip />} cursor={{ fill: '#131B19' }} />
                                            <Bar dataKey="Units Sold" fill="#00d4ff" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* Revenue by Category Pie Chart */}
                            {catData.length > 0 && (
                                <div className="rounded-2xl border border-[#1A2623] bg-[#0A110F] p-6 shadow-lg">
                                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4 text-[#a78bfa]" />Revenue by Category
                                    </h3>
                                    <ResponsiveContainer width="100%" height={240}>
                                        <PieChart>
                                            <Pie data={catData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                                                {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip formatter={(val: any) => [fmt(val), "Revenue"]} contentStyle={{ background: "#060B09", border: "1px solid #1A2623", borderRadius: 12, fontSize: 12, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }} itemStyle={{ color: '#fff', fontWeight: 'bold' }} />
                                            <Legend formatter={v => <span className="text-xs font-medium text-[#94A39D]">{v}</span>} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>

                        {/* Low/Out of Stock Alerts */}
                        {(lowStock.length > 0 || outOfStock.length > 0) && (
                            <div className="rounded-2xl border border-[#1A2623] bg-[#0A110F] p-6 mt-2 shadow-lg">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-5">
                                    <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />Stock Alerts
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {outOfStock.map(p => (
                                        <div key={p.id} onClick={() => setSelected(p)} className="flex items-center justify-between p-4 rounded-xl cursor-pointer hover:bg-[#131B19] transition-colors border border-[#1A2623] bg-[#060B09]">
                                            <div><p className="text-sm font-bold text-white mb-1">{p.name}</p><p className="text-[10px] font-mono font-bold tracking-wider text-[#5B6B66] uppercase">{p.sku || p.category}</p></div>
                                            <span className="text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider bg-[#FF4D4D]/10 text-[#FF4D4D] border border-[#FF4D4D]/20">OUT OF STOCK</span>
                                        </div>
                                    ))}
                                    {lowStock.map(p => (
                                        <div key={p.id} onClick={() => setSelected(p)} className="flex items-center justify-between p-4 rounded-xl cursor-pointer hover:bg-[#131B19] transition-colors border border-[#1A2623] bg-[#060B09]">
                                            <div><p className="text-sm font-bold text-white mb-1">{p.name}</p><p className="text-[10px] font-mono font-bold tracking-wider text-[#5B6B66] uppercase">{p.sku || p.category}</p></div>
                                            <span className="text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20">Only {p.stock_qty} left</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="h-4"></div>
                    </>
                )
            }

            {/* ── No products in inventory ── */}
            {
                !loadingAll && allProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 w-full max-w-2xl mx-auto relative group">
                        {/* Outer Glow */}
                        <div className="absolute inset-0 bg-[#00E58F]/5 rounded-[40px] blur-3xl -z-10 group-hover:bg-[#00E58F]/10 transition-all duration-700"></div>

                        <div className="w-full bg-[#060B09]/90 backdrop-blur-xl border border-[#1A2623] rounded-[32px] p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">

                            {/* Icon Container */}
                            <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                                {/* Inner glow rings */}
                                <div className="absolute inset-0 bg-[#00E58F]/10 rounded-full border border-[#00E58F]/20 animate-pulse"></div>
                                <div className="absolute inset-4 bg-[#00E58F]/5 rounded-full border border-[#00E58F]/10"></div>

                                <div className="relative w-20 h-20 rounded-3xl bg-[#0D1513] border border-[#1A2623] flex flex-col items-center justify-center shadow-[0_0_30px_rgba(0,229,143,0.15)] z-10 overflow-hidden group-hover:shadow-[0_0_40px_rgba(0,229,143,0.25)] transition-all">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#00E58F]/10 to-transparent"></div>
                                    <ClipboardList className="w-10 h-10 text-[#00E58F] relative z-20" />

                                    {/* Little green plus bubble overlay like in the design */}
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#00E58F] rounded-xl flex items-center justify-center border-4 border-[#0D1513] shadow-lg">
                                        <Plus className="w-4 h-4 text-[#0A0A0A] font-bold" strokeWidth={4} />
                                    </div>
                                </div>
                            </div>

                            <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">No products in inventory</h2>

                            <p className="text-[#94A39D] text-sm max-w-md mx-auto mb-10 leading-relaxed font-medium">
                                Your catalog is looking a bit empty. Start tracking your stock levels, managing SKUs, and gaining AI-powered retail insights by adding your first product.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4 mb-10 w-full justify-center">
                                <button onClick={() => router.push("/dashboard/products")} className="w-full sm:w-auto bg-[#00E58F] text-[#0A0A0A] px-6 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#00FFAA] transition-all shadow-[0_0_20px_rgba(0,229,143,0.2)]">
                                    <Plus className="w-5 h-5 bg-[#0A0A0A] text-[#00E58F] rounded-full p-0.5" strokeWidth={3} />
                                    <span className="text-center leading-tight">Add / Manage<br />Products</span>
                                </button>
                                <button onClick={() => router.push("/dashboard/products")} className="w-full sm:w-auto bg-[#0A110F] border border-[#1A2623] text-[#00E58F] px-6 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#0D1513] transition-all">
                                    <Upload className="w-4 h-4 text-[#00E58F]" strokeWidth={2.5} />
                                    <span className="text-center leading-tight text-white">Import<br />Catalog</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#00E58F] bg-[#00E58F]/5 px-4 py-2 rounded-full border border-[#00E58F]/10">
                                <span className="text-[#00E58F] text-lg leading-none mt-[-2px]">✦</span> CONNECT SHOPIFY OR SQUARE FOR AUTO-SYNC
                            </div>

                        </div>
                    </div>
                )
            }

            {/* ── Search results list ── */}
            {
                results !== null && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-[#94A39D] font-medium">
                                {results.length === 0 ? `No products found for "${query}"` : `${results.length} product${results.length !== 1 ? "s" : ""} found for "${query}"`}
                            </p>
                            {results.length === 0 && (
                                <button onClick={() => router.push("/dashboard/products")}
                                    className="flex items-center gap-1.5 text-sm font-bold text-[#00E58F] hover:text-[#00FFAA] transition-colors">
                                    <Plus className="w-4 h-4" strokeWidth={3} />Add this product <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        {results.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {results.map(p => (
                                    <button key={p.id} onClick={() => setSelected(selected?.id === p.id ? null : p)}
                                        className="text-left rounded-2xl border p-5 transition-all hover:scale-[1.01] cursor-pointer bg-[#0A110F]"
                                        style={{ borderColor: selected?.id === p.id ? "#00E58F" : "#1A2623" }}>
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div className="flex items-start gap-3">
                                                {p.image_url ? (
                                                    <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-[#1A2623] flex-shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-[#0A110F] border border-[#1A2623] flex items-center justify-center flex-shrink-0">
                                                        <ImageIcon className="w-4 h-4 text-[#5B6B66]" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold text-white text-base leading-snug">{p.name}</p>
                                                    {p.category && <span className="text-[10px] px-2.5 py-0.5 rounded-full inline-block mt-1 font-bold uppercase tracking-wider bg-[#00E58F]/10 text-[#00E58F] border border-[#00E58F]/20">{p.category}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <StockBadge qty={p.stock_qty} unit={p.unit} />
                                        <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                                            <div><p className="text-[#5B6B66] font-medium uppercase tracking-wider text-[10px] mb-0.5">Sold</p><p className="font-bold text-white text-sm">{p.total_sold} {p.unit}</p></div>
                                            <div><p className="text-[#5B6B66] font-medium uppercase tracking-wider text-[10px] mb-0.5">Revenue</p><p className="font-bold text-sm text-[#a78bfa]">{fmt(Number(p.total_revenue))}</p></div>
                                            <div><p className="text-[#5B6B66] font-medium uppercase tracking-wider text-[10px] mb-0.5">Price</p><p className="font-bold text-white text-sm">₹{Number(p.price).toLocaleString("en-IN")}</p></div>
                                            <div><p className="text-[#5B6B66] font-medium uppercase tracking-wider text-[10px] mb-0.5">Bills</p><p className="font-bold text-white text-sm">{p.bill_count}</p></div>
                                        </div>
                                        {selected?.id === p.id && <p className="text-[10px] mt-4 font-bold text-[#00E58F] uppercase tracking-wider">↓ Expand below for full analytics</p>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )
            }

            {/* ── Selected product detail (from search results) ── */}
            {
                selected && results !== null && (
                    <div className="flex flex-col gap-4 mt-2">
                        <div className="flex items-center gap-3 py-2">
                            <div className="flex-1 h-px bg-[#1A2623]" />
                            <span className="text-[10px] text-[#5B6B66] px-2 font-bold uppercase tracking-widest">Analytics for <strong className="text-[#00E58F]">{selected.name}</strong></span>
                            <div className="flex-1 h-px bg-[#1A2623]" />
                        </div>
                        <ProductDetail
                            product={selected}
                            monthlySales={monthlySales.filter(m => m.product_id === selected.id)}
                        />
                    </div>
                )
            }

            {/* ── Full inventory table ── */}
            {
                results === null && !loadingAll && allProducts.length > 0 && (
                    <div className="rounded-2xl border border-[#1A2623] overflow-hidden bg-[#0A110F]">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1A2623] bg-[#0A110F]">
                            <h3 className="text-[15px] font-bold text-white flex items-center gap-2"><Boxes className="w-4 h-4 text-[#00E58F]" />Full Inventory</h3>
                            <p className="text-xs text-[#5B6B66] font-medium">Click a row to see analytics</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[#131B19] border-b border-[#1A2623]">
                                        {["Image", "Product", "SKU", "Category", "Price", "Stock", "Sold", "Revenue", "Margin"].map(h => (
                                            <th key={h} className="px-6 py-4 text-left text-[10px] font-bold text-[#5B6B66] uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {allProducts.map(p => {
                                        const margin = p.cost_price > 0 ? Math.round(((p.price - p.cost_price) / p.price) * 100) : null
                                        const isSelected = selected?.id === p.id
                                        return (
                                            <tr key={p.id} onClick={() => setSelected(isSelected ? null : p)}
                                                className={`border-b border-[#1A2623] cursor-pointer transition-colors ${isSelected ? "bg-[#131B19]" : "bg-[#060B09] hover:bg-[#0D1513]"}`}>
                                                <td className="px-6 py-4">
                                                    {p.image_url ? (
                                                        <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded-md object-cover border border-[#1A2623] inline-block" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-md bg-[#0A110F] border border-[#1A2623] flex items-center justify-center inline-flex">
                                                            <ImageIcon className="w-3 h-3 text-[#5B6B66]" />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-white text-xs">{p.name}</td>
                                                <td className="px-6 py-4 text-[#5B6B66] font-mono text-xs uppercase">{p.sku || "—"}</td>
                                                <td className="px-6 py-4 text-[#94A39D] text-xs font-medium uppercase">{p.category || "—"}</td>
                                                <td className="px-6 py-4 text-[#00E58F] font-bold text-xs">₹{Number(p.price).toLocaleString("en-IN")}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-full text-xs font-bold ${p.stock_qty === 0 ? "bg-[#FF4D4D]/10 text-[#FF4D4D] border border-[#FF4D4D]/20" : p.stock_qty < 10 ? "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20" : "bg-[#00E58F]/10 text-[#00E58F] border border-[#00E58F]/20"}`}>
                                                        {p.stock_qty} {p.unit}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-white font-bold text-xs">{p.total_sold}</td>
                                                <td className="px-6 py-4 font-bold text-xs" style={{ color: "#a78bfa" }}>{fmt(Number(p.total_revenue))}</td>
                                                <td className="px-6 py-4">{margin !== null ? <span className="font-bold text-xs text-[#00E58F]">{margin}%</span> : <span className="text-[#5B6B66]">—</span>}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }

            {/* Selected detail in table context */}
            {
                selected && results === null && (
                    <div className="flex flex-col gap-4 mt-2 mb-4">
                        <div className="flex items-center gap-3 py-2">
                            <div className="flex-1 h-px bg-[#1A2623]" />
                            <span className="text-[10px] text-[#5B6B66] px-2 font-bold uppercase tracking-widest">Analytics for <strong className="text-[#00E58F]">{selected.name}</strong></span>
                            <div className="flex-1 h-px bg-[#1A2623]" />
                        </div>
                        <ProductDetail product={selected} monthlySales={[]} />
                    </div>
                )
            }
        </div >
    )
}
