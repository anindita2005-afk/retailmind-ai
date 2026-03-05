"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package, FileText, TrendingUp, Bot, Search,
  IndianRupee, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, XCircle, ArrowUpRight, ShoppingCart, BarChart3,
  BrainCircuit, Loader2, ArrowUpCircle, ArrowDownCircle
} from "lucide-react"

const EMERALD = "#47ff86"
const CYAN = "#22d3ee"
const PURPLE = "#a78bfa"
const AMBER = "#f59e0b"
const RED = "#f87171"

const REFRESH_INTERVAL = 30_000

function SageMakerForecastButton({ item }: { item: { name: string; stock: number; id?: string } }) {
  const [loading, setLoading] = useState(false)
  const [forecast, setForecast] = useState<any>(null)

  async function getForecast() {
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/forecast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: item.id || "demo-123",
          current_stock: item.stock,
          local_temp: 32,
          festival_modifier_weekend: true
        })
      });
      const data = await res.json()
      if (data.success) {
        setForecast(data.prediction)
      }
    } finally {
      setLoading(false)
    }
  }

  if (forecast) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="mt-2 text-xs p-2 rounded bg-black/40 border border-[#00ffaa]/20"
      >
        <p className="font-bold text-[#00ffaa] mb-1 leading-tight">{forecast.predicted_sales_7_days} units req. based on forecast</p>
        <p className="text-white/40 italic text-[9px] leading-snug">{forecast.sagemaker_log}</p>
        <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold bg-[#00ffaa]/10 text-[#00ffaa]">
          {forecast.action}
        </span>
      </motion.div>
    )
  }

  return (
    <button onClick={getForecast} disabled={loading} className="mt-2 text-[10px] uppercase font-bold tracking-wider w-full flex items-center justify-center gap-1.5 py-2 rounded bg-transparent border border-[#00ffaa]/30 text-[#00ffaa] hover:bg-[#00ffaa]/10 transition-colors disabled:opacity-50 blur-0">
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <BrainCircuit className="w-3 h-3" />}
      {loading ? "Running AI..." : "SageMaker Forecast"}
    </button>
  )
}

interface Stats {
  products: number
  lowStock: number
  paidBills: number
  draftBills: number
  cancelledBills: number
  totalBills: number
  revenue: number
  analyses: number
  todayRevenue: number
  todayBills: number
  businessName: string
  displayId: string
  gstNumber: string
  totalProfit: number
  recentBills: { id: string; customer: string; total: number; status: string; date: string }[]
  lowStockItems: { name: string; stock: number; unit: string }[]
  monthly: { month: string; revenue: number; profit: number; bills: number }[]
  fetchedAt: string
}

const quickLinks = [
  { label: "Add Product", href: "/dashboard/products", icon: Package, color: EMERALD },
  { label: "Create Bill", href: "/dashboard/bills/new", icon: FileText, color: CYAN },
  { label: "Market Analysis", href: "/dashboard/market-analysis", icon: TrendingUp, color: EMERALD },
  { label: "Search Products", href: "/dashboard/search", icon: Search, color: PURPLE },
  { label: "AI Copilot", href: "/dashboard/copilot", icon: Bot, color: AMBER },
]

function fmt(n: number) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
}

function StatusDot({ status }: { status: string }) {
  const cfg: Record<string, { color: string; icon: React.ReactNode }> = {
    paid: { color: EMERALD, icon: <CheckCircle2 className="w-3 h-3" /> },
    draft: { color: AMBER, icon: <Clock className="w-3 h-3" /> },
    cancelled: { color: RED, icon: <XCircle className="w-3 h-3" /> },
  }
  const c = cfg[status] ?? cfg.draft
  return <span style={{ color: c.color, display: "flex", alignItems: "center", gap: 3 }}>{c.icon}</span>
}

interface Props {
  initialStats: Stats
}

// Framer Motion Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
}

export default function DashboardOverview({ initialStats }: Props) {
  const [stats, setStats] = useState<Stats>(initialStats)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000)
  const [error, setError] = useState("")

  const fetchStats = useCallback(async (manual = false) => {
    if (manual) setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/dashboard/stats`)
      if (!res.ok) throw new Error("Failed")
      const data: Stats = await res.json()
      setStats(data)
      setLastUpdated(new Date())
      setCountdown(REFRESH_INTERVAL / 1000)
      setError("")
    } catch {
      setError("Could not refresh data")
    } finally {
      if (manual) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => fetchStats(), REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchStats])

  useEffect(() => {
    const tick = setInterval(() => setCountdown((c) => (c <= 1 ? REFRESH_INTERVAL / 1000 : c - 1)), 1000)
    return () => clearInterval(tick)
  }, [])

  const maxRevenue = Math.max(...stats.monthly.map((m) => m.revenue), 1)

  // Custom MoM Percentage Growth Algorithm
  const lastMonth = stats.monthly[stats.monthly.length - 1]
  const prevMonth = stats.monthly[stats.monthly.length - 2]
  const growthPct = prevMonth && prevMonth.profit > 0
    ? ((lastMonth.profit - prevMonth.profit) / prevMonth.profit) * 100
    : 0

  const growthIsPositive = growthPct >= 0

  const metricCards = [
    {
      label: "Total Products", value: stats.products.toLocaleString(),
      icon: Package, href: "/dashboard/products", color: EMERALD,
      sub: stats.lowStock > 0 ? `${stats.lowStock} low stock` : "All stocked",
      subColor: stats.lowStock > 0 ? RED : EMERALD,
    },
    {
      label: "Total Revenue", value: fmt(stats.revenue),
      icon: IndianRupee, href: "/dashboard/bills", color: EMERALD,
      sub: `${fmt(stats.todayRevenue)} today`, subColor: CYAN,
    },
    {
      label: "Total Profit", value: fmt(stats.totalProfit || 0),
      icon: TrendingUp, href: "/dashboard/bills", color: PURPLE,
      sub: "Net profit (excl. GST)", subColor: PURPLE,
    },
    {
      label: "Total Bills", value: stats.totalBills.toLocaleString(),
      icon: FileText, href: "/dashboard/bills", color: CYAN,
      sub: `${stats.paidBills} paid · ${stats.draftBills} draft`, subColor: "rgba(255,255,255,0.40)",
    },
    {
      label: "Today's Bills", value: stats.todayBills.toLocaleString(),
      icon: ShoppingCart, href: "/dashboard/bills", color: AMBER,
      sub: "Created today", subColor: "rgba(255,255,255,0.40)",
    },
    {
      label: "Paid Bills", value: stats.paidBills.toLocaleString(),
      icon: BarChart3, href: "/dashboard/bills", color: EMERALD,
      sub: stats.totalBills > 0 ? `${Math.round((stats.paidBills / stats.totalBills) * 100)}% conversion` : "No bills yet",
      subColor: EMERALD,
    },
  ]

  const cardStyle = {
    background: "rgba(10,20,14,0.70)",
    borderColor: "rgba(71,255,134,0.10)",
    backdropFilter: "blur(16px)",
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6 overflow-hidden"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <motion.div variants={itemVariants}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", margin: 0 }}>
            Live Dashboard
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.40)", marginTop: 4 }}>
            Real-time metrics from your business operations
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="flex items-center gap-3">
          {error && (
            <span className="flex items-center gap-1 text-xs" style={{ color: RED }}>
              <AlertTriangle className="w-3 h-3" /> {error}
            </span>
          )}
          <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            <span
              className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: EMERALD, boxShadow: `0 0 6px ${EMERALD}` }}
            />
            <span suppressHydrationWarning>Live · refreshes in {countdown}s</span>
          </div>
          <button
            onClick={() => fetchStats(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
            style={{ background: "rgba(71,255,134,0.10)", border: "1px solid rgba(71,255,134,0.20)", color: EMERALD }}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing…" : "Refresh Now"}
          </button>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
        <CheckCircle2 className="w-3 h-3" style={{ color: EMERALD }} />
        <span suppressHydrationWarning>Last updated: {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
      </motion.div>

      {/* NEW STUNNING GROWTH CARD */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl border p-6 flex flex-col md:flex-row items-center justify-between shadow-2xl" style={{ ...cardStyle, background: 'linear-gradient(145deg, rgba(10,20,14,0.9), rgba(6,12,8,0.95))' }}>
        <div className="flex flex-col gap-1 z-10 w-full md:w-auto">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)", margin: 0 }}>
            Business Growth Velocity
          </p>
          <div className="flex items-baseline gap-4 mt-2">
            <h2 style={{ fontSize: 42, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", margin: 0, lineHeight: 1 }}>{fmt(lastMonth?.profit || 0)}</h2>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${growthIsPositive ? 'bg-[#47ff86]/10 text-[#47ff86]' : 'bg-[#f87171]/10 text-[#f87171]'}`}>
              {growthIsPositive ? <ArrowUpCircle className="w-3.5 h-3.5" /> : <ArrowDownCircle className="w-3.5 h-3.5" />}
              {Math.abs(growthPct).toFixed(1)}% MoM
            </div>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.40)", marginTop: 8 }}>
            Current Month Profit vs. Previous Month ({prevMonth?.month || "Prev"})
          </p>
        </div>

        {/* Abstract Background Animation inside the card */}
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.05, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -right-10 -top-10 w-64 h-64 rounded-full opacity-20 blur-[60px] pointer-events-none"
          style={{ background: growthIsPositive ? EMERALD : RED }}
        />
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((card) => (
          <motion.div variants={itemVariants} key={card.label}>
            <Link
              href={card.href}
              className="rounded-xl border p-5 flex flex-col gap-3 transition-all card-hover group h-full"
              style={{ ...cardStyle, textDecoration: "none", borderColor: "rgba(71,255,134,0.10)" }}
            >
              <div className="flex items-center justify-between">
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)", margin: 0 }}>
                  {card.label}
                </p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors group-hover:bg-white/5" style={{ background: `${card.color}18`, border: `1px solid ${card.color}30` }}>
                  <card.icon style={{ width: 14, height: 14, color: card.color }} />
                </div>
              </div>
              <div>
                <p style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", margin: 0, lineHeight: 1 }}>
                  {card.value}
                </p>
                <span style={{ fontSize: 11, marginTop: 5, display: "flex", alignItems: "center", gap: 3, color: card.subColor }}>
                  <ArrowUpRight style={{ width: 10, height: 10 }} /> {card.sub}
                </span>
              </div>
              <div style={{ height: 2, borderRadius: 1, background: `linear-gradient(90deg, ${card.color}60 0%, transparent 100%)` }} />
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div variants={itemVariants} className="rounded-xl border p-5" style={cardStyle}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: "0 0 4px" }}>Monthly Revenue</h3>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 20 }}>Last 6 months · paid bills only</p>
          {stats.monthly.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No billing data yet</p>
          ) : (
            <div className="flex items-end gap-2 h-28">
              {stats.monthly.map((m, i) => {
                const pct = (m.revenue / maxRevenue) * 100
                return (
                  <div key={`${m.month}-${i}`} className="flex-1 flex flex-col items-center gap-1 group">
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                      {m.revenue > 0 ? fmt(m.revenue) : ""}
                    </span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(pct, 4)}%` }}
                      transition={{ duration: 1, type: "spring", bounce: 0.4 }}
                      className="w-full rounded-t-md relative"
                      style={{ background: `linear-gradient(180deg, ${EMERALD}, ${EMERALD}50)` }}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] bg-white/10 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap" style={{ color: "#fff" }}>
                        {m.bills} bills
                      </div>
                    </motion.div>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.40)" }}>{m.month}</span>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-xl border p-5" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0 }}>Recent Bills</h3>
            <Link href="/dashboard/bills" style={{ fontSize: 11, color: EMERALD, textDecoration: "none" }}>View all →</Link>
          </div>
          {stats.recentBills.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No bills yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              <AnimatePresence>
                {stats.recentBills.map((b, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={`${b.id}-${i}`}
                  >
                    <Link
                      href={`/dashboard/bills/${b.id}`}
                      className="flex items-center justify-between py-2 px-3 rounded-lg transition-colors hover:bg-white/5"
                      style={{ textDecoration: "none", borderBottom: "1px solid rgba(71,255,134,0.06)" }}
                    >
                      <div className="flex items-center gap-2">
                        <StatusDot status={b.status} />
                        <span style={{ fontSize: 12, color: "#e8f5ec", fontWeight: 500 }}>{b.customer}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.40)" }}>{b.date}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: EMERALD, fontFamily: "monospace" }}>{fmt(b.total)}</span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {stats.lowStockItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border p-5 overflow-hidden"
            style={{ background: "rgba(248,113,113,0.05)", borderColor: "rgba(248,113,113,0.18)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4" style={{ color: RED }} />
              <h3 style={{ fontSize: 13, fontWeight: 600, color: RED, margin: 0 }}>Low Stock Alert</h3>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "rgba(248,113,113,0.12)", color: RED }}>
                {stats.lowStockItems.length} items
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {stats.lowStockItems.map((item, i) => (
                <div
                  key={`${item.name}-${i}`}
                  className="rounded-lg px-3 py-2"
                  style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)" }}
                >
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                  <p style={{ fontSize: 11, color: RED, marginTop: 2 }}>{item.stock} {item.unit} left</p>
                  <SageMakerForecastButton item={item} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 12 }}>Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickLinks.map((link) => (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} key={link.label}>
              <Link
                href={link.href}
                className="rounded-xl border p-4 flex flex-col items-center gap-2.5 text-center transition-all shadow-lg"
                style={{ background: "rgba(10,20,14,0.65)", borderColor: "rgba(71,255,134,0.10)", backdropFilter: "blur(12px)", textDecoration: "none" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${link.color}15`, border: `1px solid ${link.color}25` }}>
                  <link.icon style={{ width: 18, height: 18, color: link.color }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>{link.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
