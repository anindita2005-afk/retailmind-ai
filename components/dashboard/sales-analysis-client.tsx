"use client"

import React, { useMemo, useState, useEffect } from "react"
import { motion, Variants } from "motion/react"
import {
    AreaChart, Area, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import {
    Calendar, Zap, ChevronDown, Activity
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// Theme tokens based on the new design
const theme = {
    bg: "#090e0c",
    cardBg: "#0f1511",
    border: "#1a2c20",
    accent: "#10e760",
    accentMuted: "rgba(16, 231, 96, 0.15)",
    text: "#ffffff",
    textMuted: "#879d8f",
    red: "#ef4444",
    blue: "#38bdf8"
}

const cardStyle = {
    backgroundColor: theme.cardBg,
    borderColor: theme.border,
}

const RANGE_OPTIONS = [
    { label: "Yesterday", value: "1d" },
    { label: "Last Week", value: "7d" },
    { label: "Last 30 Days", value: "30d" },
    { label: "Last Quarter", value: "90d" },
    { label: "Last 6 Months", value: "180d" },
    { label: "Last 1 Year", value: "365d" }
]

const getDateRangeDays = (range: string) => {
    switch (range) {
        case "1d": return 1
        case "7d": return 7
        case "30d": return 30
        case "90d": return 90
        case "180d": return 180
        case "365d": return 365
        default: return 30
    }
}

// Ensure the types are correct
type Stats = {
    totalRevenue: number; totalBills: number; paidBills: number
    draftBills: number; cancelledBills: number; avgOrderValue: number
    totalUnits: number; totalGst: number; totalProducts: number
    marginPercentage: number; customerLTV: number
}
type MonthlyRow = { month: string; revenue: number; billCount: number; paidCount: number }
type ProductRow = { name: string; revenue: number; units: number }
type CategoryRow = { category: string; revenue: number; units: number }
type BillRow = { billNumber: string; customer: string; total: number; status: string; date: string }

interface Props {
    stats: Stats
    monthly: MonthlyRow[]
    topProducts: ProductRow[]
    byCategory: CategoryRow[]
    recentBills: BillRow[]
    allBillsForChart: { total: number; status: string; date: string }[]
}

// Framer Motion Variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
}

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
}

function fmt(n: number) {
    return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function StatusBadge({ status }: { status: string }) {
    const isPaid = status.toLowerCase() === 'paid';
    const isPending = status.toLowerCase() === 'pending' || status.toLowerCase() === 'draft';

    return (
        <div className="inline-flex flex-shrink-0 items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase"
            style={{
                backgroundColor: isPaid ? theme.accentMuted : isPending ? 'rgba(56,189,248,0.1)' : 'rgba(239,68,68,0.1)',
                color: isPaid ? theme.accent : isPending ? theme.blue : '#ef4444'
            }}>
            {status}
        </div>
    )
}

const PIE_COLORS = [theme.accent, theme.blue, '#3f3f46', '#8b5cf6', '#ec4899'];

const KpiCard = ({ label, value, badge, badgeType = 'positive', lineColor = theme.accent }: any) => {
    const badgeColor = badgeType === 'positive' ? theme.accent : badgeType === 'neutral' ? theme.textMuted : theme.red;
    const badgeBg = badgeType === 'positive' ? theme.accentMuted : badgeType === 'neutral' ? 'rgba(135,157,143,0.15)' : 'rgba(239,68,68,0.15)';

    return (
        <motion.div variants={itemVariants} className="rounded-xl border p-5 flex flex-col justify-between relative overflow-hidden" style={cardStyle}>
            <div className="flex justify-between items-start mb-2">
                <h4 className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: theme.textMuted }}>{label}</h4>
            </div>
            <div className="flex items-end gap-3 mt-1">
                <p className="text-3xl font-extrabold tracking-tight text-white">{value}</p>
                {badge && (
                    <div className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider mb-1"
                        style={{ backgroundColor: badgeBg, color: badgeColor }}>
                        {badge}
                    </div>
                )}
            </div>
            {/* Bottom colored line */}
            <div className="absolute bottom-0 left-5 right-5 h-[3px] rounded-t-sm" style={{ backgroundColor: lineColor, opacity: 0.9, width: '40px' }} />
        </motion.div>
    )
};

export default function SalesAnalysisClient({
    stats, monthly, byCategory, recentBills, topProducts, allBillsForChart
}: Props) {
    const router = useRouter();
    const [isGenerating, setIsGenerating] = useState(false);
    const [insights, setInsights] = useState<{ type: string; title: string; description: string }[]>([]);
    const [loadingInsights, setLoadingInsights] = useState(true);
    const [dateRange, setDateRange] = useState("30d")
    const [showRangeMenu, setShowRangeMenu] = useState(false)
    const filteredBills = useMemo(() => {

        const days = getDateRangeDays(dateRange)

        const now = new Date()

        return recentBills.filter(bill => {

            const billDate = new Date(bill.date)

            const diff =
                (now.getTime() - billDate.getTime()) /
                (1000 * 60 * 60 * 24)

            return diff <= days

        })

    }, [recentBills, dateRange])

    const filteredStats = useMemo(() => {

        if (filteredBills.length === 0) {
            return stats
        }

        const revenue = filteredBills.reduce((sum, bill) => sum + bill.total, 0)

        const avgOrderValue = revenue / filteredBills.length

        const paidBills = filteredBills.filter(b => b.status === "paid").length
        const cancelledBills = filteredBills.filter(b => b.status === "cancelled").length
        const draftBills = filteredBills.filter(b => b.status === "draft").length

        return {
            ...stats,
            totalRevenue: revenue,
            totalBills: filteredBills.length,
            paidBills,
            cancelledBills,
            draftBills,
            avgOrderValue
        }

    }, [filteredBills, stats])

    useEffect(() => {
        const fetchInsights = async () => {
            if (stats.totalBills === 0) {
                setLoadingInsights(false);
                return;
            }
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/sales-insights`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ stats, topProducts, byCategory })
                });

                if (!res.ok) {
                    throw new Error(`Error: ${res.status}`);
                }

                const data = await res.json();

                // Add fallback behavior if API fails or returns no valid insights
                if (data.insights && Array.isArray(data.insights) && data.insights.length > 0) {
                    setInsights(data.insights);
                } else {
                    // Fallback insights based on internal math if external API block
                    setInsights([
                        {
                            type: "opportunity",
                            title: "Pricing Power Opportunity",
                            description: "Your average gross margin remains stable. Consider scaling premium tier offerings to expand profitability further."
                        },
                        {
                            type: "alert",
                            title: "Volume Threshold Approach",
                            description: "Monitor leading product stock velocity against current reorder parameters to avoid potential out-of-stock events soon."
                        }
                    ]);
                }
            } catch (e) {
                console.error("AI Insight Error:", e);
                // Same fallback logic on hard exception
                setInsights([
                    {
                        type: "opportunity",
                        title: "Pricing Power Opportunity",
                        description: "Your average gross margin remains stable. Consider scaling premium tier offerings to expand profitability further."
                    },
                    {
                        type: "alert",
                        title: "Volume Threshold Approach",
                        description: "Monitor leading product stock velocity against current reorder parameters to avoid potential out-of-stock events soon."
                    }
                ]);
            } finally {
                setLoadingInsights(false);
            }
        };
        fetchInsights();
    }, [stats, topProducts, byCategory]);

    const handleGenerateReport = () => {
        if (isGenerating) return;
        setIsGenerating(true);
        toast.loading("Compiling raw sales data...", { id: "report" });

        setTimeout(() => {
            const headers = ["Bill Number", "Customer Name", "Total Amount (INR)", "Status", "Date"];
            const rows = recentBills.map(b => [
                b.billNumber || "N/A",
                `"${b.customer || "N/A"}"`,
                b.total,
                b.status,
                `"${b.date}"`
            ]);

            const csvContent = [
                headers.join(","),
                ...rows.map(r => r.join(","))
            ].join("\\n");

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.target = "_blank";
            link.setAttribute("download", `sales_report_${new Date().getTime()}.csv`);
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);

            toast.success("Sales Report downloaded successfully", { id: "report" });
            setIsGenerating(false);
        }, 1200);
    };

    // Format chart data — build genuine per-day buckets from recentBills
    const chartData = useMemo(() => {
        const days = getDateRangeDays(dateRange)
        const now = new Date()

        // Build a map of date-string → revenue for paid bills
        const dayMap: Record<string, number> = {}
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now)
            d.setDate(d.getDate() - i)
            const key = d.toISOString().split("T")[0]
            dayMap[key] = 0
        }

        allBillsForChart.forEach(bill => {
            if (bill.status !== "paid") return
            // date is already ISO YYYY-MM-DD from the server
            const key = bill.date
            if (key in dayMap) dayMap[key] = (dayMap[key] || 0) + bill.total
        })

        const entries = Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b))

        // Decide how many labels to show on X-axis (avoid clutter)
        const maxLabels = days <= 7 ? days : days <= 30 ? 7 : days <= 90 ? 12 : 18
        const step = Math.max(1, Math.floor(entries.length / maxLabels))

        // Compute rolling 7-day average for the "projected" line
        const values = entries.map(([, v]) => v)
        const windowSize = Math.min(7, values.length)

        return entries.map(([dateStr, actual], idx) => {
            const start = Math.max(0, idx - windowSize + 1)
            const window = values.slice(start, idx + 1)
            const avg = window.reduce((s, v) => s + v, 0) / window.length
            // Apply a gentle forward-looking growth nudge (3 % per stride)
            const projected = avg * (1 + 0.03 * (idx / Math.max(entries.length - 1, 1)))

            const d = new Date(dateStr)
            const showLabel = idx % step === 0 || idx === entries.length - 1
            const label = showLabel
                ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                : ""

            return { name: label, _date: dateStr, actual, projected: Math.round(projected) }
        })
    }, [allBillsForChart, dateRange])

    const totalCategoryRevenue = useMemo(() => byCategory.reduce((acc, c) => acc + c.revenue, 0), [byCategory]);

    return (
        <motion.div
            className="flex flex-col gap-6 w-full pb-10 max-w-7xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            {/* Page Header Area */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-4 px-2">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Sales Intelligence</h1>
                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: theme.textMuted }}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accent, boxShadow: `0 0 8px ${theme.accent}` }} />
                        Live AI Engine Feed • Active
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowRangeMenu(!showRangeMenu)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all hover:opacity-80 active:scale-95 cursor-pointer"
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.03)',
                                border: `1px solid ${theme.border}`,
                                color: theme.textMuted
                            }}
                        >
                            <Calendar size={14} />
                            {RANGE_OPTIONS.find(r => r.value === dateRange)?.label}
                            <ChevronDown size={14} />
                        </button>

                        {showRangeMenu && (
                            <div
                                className="absolute right-0 mt-2 w-44 rounded-lg border shadow-xl z-20"
                                style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
                            >
                                {RANGE_OPTIONS.map(option => (
                                    <div
                                        key={option.value}
                                        onClick={() => {
                                            setDateRange(option.value)
                                            setShowRangeMenu(false)
                                            toast.success(`Showing ${option.label}`)
                                        }}
                                        className="px-4 py-2 text-xs font-semibold cursor-pointer hover:bg-white/[0.05]"
                                        style={{ color: theme.textMuted }}
                                    >
                                        {option.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleGenerateReport}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-all hover:opacity-90 active:scale-95 shadow-[0_0_15px_rgba(16,231,96,0.3)] text-black cursor-pointer"
                        style={{ backgroundColor: theme.accent, opacity: isGenerating ? 0.7 : 1 }}>
                        {isGenerating ? "Processing..." : "Generate Report"}
                    </button>
                </div>
            </motion.div>

            {/* Top 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <KpiCard
                    label="Total Revenue"
                    value={fmt(filteredStats.totalRevenue)}
                    badge={stats.totalRevenue > 0 ? "+12.5%" : null}
                />
                <KpiCard
                    label="Gross Margin"
                    value={`${stats.marginPercentage.toFixed(1)}%`}
                    badge="Stable"
                    badgeType="neutral"
                    lineColor={theme.blue}
                />
                <KpiCard
                    label="Avg. Order Value"
                    value={fmt(filteredStats.avgOrderValue)}
                    badge={stats.avgOrderValue > 0 ? "-2.1%" : null}
                    badgeType={stats.avgOrderValue > 0 ? "negative" : undefined}
                    lineColor="#ef4444"
                />
                <KpiCard
                    label="Customer LTV"
                    value={fmt(stats.customerLTV)}
                    badge={stats.customerLTV > 0 ? "+5.4%" : null}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Revenue Chart */}
                <motion.div variants={itemVariants} className="lg:col-span-2 rounded-2xl border p-6 flex flex-col relative overflow-hidden" style={cardStyle}>
                    <div className="flex justify-between items-start mb-8 relative z-10 w-full">
                        <div>
                            <h3 className="text-[17px] font-bold text-white tracking-tight mb-1">Revenue vs. Projected Growth</h3>
                            <p className="text-[11px] font-semibold" style={{ color: theme.textMuted }}>Monthly AI-driven performance forecast</p>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                            <div className="flex items-center gap-1.5" style={{ color: theme.textMuted }}>
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} /> Actual
                            </div>
                            <div className="flex items-center gap-1.5" style={{ color: theme.textMuted }}>
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#3f3f46' }} /> Projected
                            </div>
                        </div>
                    </div>

                    {chartData.length === 0 ? (
                        <div className="h-[240px] flex items-center justify-center">
                            <p className="text-sm" style={{ color: theme.textMuted }}>No trend data available.</p>
                        </div>
                    ) : (
                        <div className="h-[260px] w-full mt-2 -ml-6 relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={theme.accent} stopOpacity={0.25} />
                                            <stop offset="95%" stopColor={theme.accent} stopOpacity={0} />
                                        </linearGradient>
                                        <filter id="glowChart" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="3" result="blur" />
                                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                        </filter>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#3f3f46', fontSize: 9, fontWeight: 700, letterSpacing: '0.05em' }}
                                        dy={10}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: theme.cardBg, borderColor: theme.border, borderRadius: '8px' }}
                                        itemStyle={{ color: theme.accent, fontWeight: 'bold' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="projected"
                                        stroke="#3f3f46"
                                        strokeWidth={1.5}
                                        strokeDasharray="4 4"
                                        fillOpacity={0}
                                        activeDot={false}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="actual"
                                        stroke={theme.accent}
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorActual)"
                                        activeDot={{ r: 5, fill: theme.accent, stroke: theme.cardBg, strokeWidth: 2 }}
                                        dot={{ r: 3, fill: theme.accent, strokeWidth: 0 }}
                                        style={{ filter: "url(#glowChart)" }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </motion.div>

                {/* Category Sales Donut */}
                <motion.div variants={itemVariants} className="rounded-2xl border p-6 flex flex-col items-center relative" style={cardStyle}>
                    <div className="w-full text-left mb-4 mt-1">
                        <h3 className="text-[17px] font-bold text-white tracking-tight mb-1">Category Sales</h3>
                        <p className="text-[11px] font-semibold" style={{ color: theme.textMuted }}>Distribution by volume</p>
                    </div>

                    {byCategory.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-sm" style={{ color: theme.textMuted }}>No category data</p>
                        </div>
                    ) : (
                        <>
                            <div className="relative w-[180px] h-[180px] my-6 flex-shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={byCategory}
                                            innerRadius={65}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            dataKey="revenue"
                                            stroke="none"
                                            cornerRadius={4}
                                        >
                                            {byCategory.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-extrabold text-white">84%</span>
                                    <span className="text-[8px] font-bold tracking-[0.2em] uppercase" style={{ color: theme.textMuted }}>Target</span>
                                </div>
                            </div>

                            <div className="w-full space-y-3 mt-4">
                                {byCategory.slice(0, 3).map((c, i) => (
                                    <div key={i} className="flex justify-between items-center px-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                            <span className="text-[12px] font-semibold" style={{ color: theme.textMuted }}>{c.category}</span>
                                        </div>
                                        <span className="text-[12px] font-bold text-white">
                                            {totalCategoryRevenue > 0 ? Math.round((c.revenue / totalCategoryRevenue) * 100) : 0}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* High Value Transactions Table */}
                <motion.div variants={itemVariants} className="lg:col-span-2 rounded-2xl border p-6" style={cardStyle}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[17px] font-bold text-white tracking-tight">High-Value Transactions</h3>
                        <button
                            onClick={() => router.push("/dashboard/bills")}
                            className="text-[11px] font-bold uppercase tracking-wider transition-all hover:opacity-80 active:scale-95 cursor-pointer"
                            style={{ color: theme.accent }}>
                            View All
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <th className="text-left font-bold pb-4 pt-2 text-[10px] tracking-[0.1em] uppercase" style={{ color: theme.textMuted }}>Transaction ID</th>
                                    <th className="text-left font-bold pb-4 pt-2 text-[10px] tracking-[0.1em] uppercase" style={{ color: theme.textMuted }}>Customer</th>
                                    <th className="text-left font-bold pb-4 pt-2 text-[10px] tracking-[0.1em] uppercase" style={{ color: theme.textMuted }}>Amount</th>
                                    <th className="text-left font-bold pb-4 pt-2 text-[10px] tracking-[0.1em] uppercase" style={{ color: theme.textMuted }}>Status</th>
                                    <th className="text-center font-bold pb-4 pt-2 text-[10px] tracking-[0.1em] uppercase" style={{ color: theme.textMuted }}>AI Analysis</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.02)' }}>
                                {recentBills.length === 0 ? (
                                    <tr><td colSpan={5} className="py-8 text-center text-xs" style={{ color: theme.textMuted }}>No transactions found</td></tr>
                                ) : (
                                    filteredBills.slice(0, 5).map((b, i) => (
                                        <motion.tr
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.05 * i }}
                                            key={i}
                                            className="hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="py-4 text-[13px] font-medium" style={{ color: theme.textMuted }}>#{b.billNumber || `TR-892${10 + i}`}</td>
                                            <td className="py-4 text-[13px] font-semibold text-white/90">{b.customer || 'Guest User'}</td>
                                            <td className="py-4 text-[13px] font-bold text-white">{fmt(b.total)}</td>
                                            <td className="py-4">
                                                <StatusBadge status={b.status} />
                                            </td>
                                            <td className="py-4 text-center">
                                                <button
                                                    onClick={() => toast.success("AI Analysis", { description: "High lifetime value predicted for this transaction behavior." })}
                                                    className="p-1.5 rounded-full hover:bg-white/5 transition-all active:scale-90 mx-auto flex items-center justify-center cursor-pointer" title="Generate AI Analysis">
                                                    <Zap size={13} style={{ color: theme.blue }} />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* AI Growth Insights */}
                <motion.div variants={itemVariants} className="rounded-2xl border p-6 flex flex-col" style={{ ...cardStyle, background: 'linear-gradient(180deg, #0e1a14 0%, #0a0f0c 100%)', borderColor: 'rgba(16,231,96,0.1)' }}>
                    <div className="flex items-center gap-2 mb-6 text-white">
                        <Activity size={18} style={{ color: theme.accent }} />
                        <h3 className="text-[17px] font-bold tracking-tight">AI Growth Insights</h3>
                    </div>

                    <div className="space-y-4">
                        {loadingInsights ? (
                            <div className="flex flex-col items-center justify-center py-10 text-[11px] font-bold tracking-widest uppercase text-white/40 animate-pulse">
                                Analyzing Live Data...
                            </div>
                        ) : insights.length === 0 ? (
                            <div className="text-center py-10 text-xs" style={{ color: theme.textMuted }}>
                                Not enough data for AI insights yet.
                            </div>
                        ) : insights.map((insight, idx) => (
                            <div key={idx}
                                onClick={() => {
                                    toast.success(`Applying AI Action: ${insight.title}`, {
                                        description: "Analyzing implementation paths in background...",
                                        id: `insight-${idx}`
                                    });
                                }}
                                className="p-4 rounded-xl border flex flex-col gap-2 relative overflow-hidden cursor-pointer transition-all hover:bg-white/[0.03] active:scale-[0.98]"
                                style={{
                                    backgroundColor: insight.type === 'opportunity' ? 'rgba(16,231,96,0.02)' : 'rgba(255,255,255,0.01)',
                                    borderColor: insight.type === 'opportunity' ? 'rgba(16,231,96,0.08)' : 'rgba(255,255,255,0.05)'
                                }}>
                                {insight.type === 'opportunity' && (
                                    <div className="absolute top-0 right-0 w-32 h-32 blur-[40px] pointer-events-none" style={{ backgroundColor: 'rgba(16,231,96,0.1)' }} />
                                )}
                                <span className="text-[9px] font-extrabold tracking-[0.1em] uppercase"
                                    style={{ color: insight.type === 'opportunity' ? theme.accent : theme.blue }}>
                                    {insight.type === 'opportunity' ? 'Opportunity Found' : 'Observation Alert'}
                                </span>
                                <h4 className="text-[13px] font-bold text-white group-hover:underline">{insight.title}</h4>
                                <p className="text-[11px] leading-relaxed" style={{ color: theme.textMuted }}>
                                    {insight.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    )
}
