"use client"

import React, { useMemo } from "react"
import { motion, Variants } from "motion/react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
    ClipboardCheck, FlaskConical, AlertTriangle, Ban,
    Search, BarChart3, Clock, Package
} from "lucide-react"

// Theme tokens based on the new design
const theme = {
    bg: "#090e0c",
    border: "#1a2c20",
    accent: "#10e760",
    accentMuted: "rgba(16, 231, 96, 0.15)",
    text: "#ffffff",
    textMuted: "#879d8f",
}

const cardStyle = {
    backgroundColor: theme.bg,
    borderColor: theme.border,
}

// Ensure the types are correct
type KPIs = {
    totalTasks: number; totalSamples: number; defects: number
    fatalErrors: number; qualityScore: number; paidBills: number
}
type MonthlyRow = { month: string; totalTasks: number; completed: number; defects: number; pending: number; score: number }
type ProductRow = { name: string; category: string; price: number; cost: number; stock: number; margin: number | null }
type CategoryRow = { category: string; tasks: number; defects: number; score: number }
type AnalysisRow = { query: string; category: string; date: string }

interface Props {
    kpis: KPIs
    monthly: MonthlyRow[]
    productsWithMargin: ProductRow[]
    categoryBreakdown: CategoryRow[]
    recentAnalyses: AnalysisRow[]
    totalProducts: number
    totalAnalyses: number
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

export default function QualityDashboardClient({
    kpis, monthly, productsWithMargin, categoryBreakdown, recentAnalyses, totalProducts, totalAnalyses,
}: Props) {
    // Formatting data for the area chart
    const chartData = useMemo(() => {
        return monthly.map(m => ({
            name: m.month,
            score: m.score,
            tasks: m.totalTasks,
            completed: m.completed,
            defects: m.defects
        }))
    }, [monthly])

    const radius = 88;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (kpis.qualityScore / 100) * circumference;

    const KpiCard = ({ label, value, icon, badge, badgeColor = theme.accent, color = theme.accent, badgeBg }: any) => (
        <motion.div variants={itemVariants} className="rounded-2xl border flex flex-col justify-between h-[180px] relative overflow-hidden group p-6 shadow-sm" style={cardStyle}>
            <div className="absolute top-[-50%] right-[-10%] w-40 h-40 rounded-full blur-[60px] opacity-0 group-hover:opacity-[0.15] transition-opacity duration-700 pointer-events-none" style={{ backgroundColor: color }} />
            
            <div className="flex justify-between items-start mb-4 z-10 w-full">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
                    {React.cloneElement(icon, { color, size: 20, strokeWidth: 1.5 })}
                </div>
                {badge && (
                    <div className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm" 
                         style={{ backgroundColor: badgeBg || `${badgeColor}15`, color: badgeColor, border: `1px solid ${badgeColor}30` }}>
                        {badge}
                    </div>
                )}
            </div>
            <div className="z-10 w-full text-left">
                <h4 className="text-[11px] font-bold tracking-[0.15em] mb-1.5 uppercase" style={{ color: theme.textMuted }}>{label}</h4>
                <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold tracking-tight text-white">{value}</p>
                </div>
            </div>
        </motion.div>
    );

    return (
        <motion.div 
            className="flex flex-col gap-6 w-full pb-10"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Overall Quality Score */}
                <motion.div variants={itemVariants} className="col-span-1 rounded-2xl border p-8 flex flex-col items-center justify-center relative overflow-hidden text-center shadow-lg min-h-[400px]" style={cardStyle}>
                    {/* Background glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[80px] pointer-events-none opacity-[0.15]" style={{ backgroundColor: theme.accent }} />
                    
                    <h3 className="text-[11px] font-bold tracking-[0.2em] mb-8 uppercase z-10 mt-2" style={{ color: theme.textMuted }}>Overall Quality Score</h3>
                    
                    <div className="relative w-48 h-48 flex items-center justify-center mb-8 z-10">
                        {/* Circle SVG */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-[0_0_12px_rgba(16,231,96,0.3)]" viewBox="0 0 200 200">
                            {/* Track */}
                            <circle cx="100" cy="100" r={radius} fill="none" stroke="#13221a" strokeWidth="12" />
                            {/* Animated glowing progress */}
                            <motion.circle 
                                cx="100" cy="100" r={radius} fill="none" 
                                stroke={theme.accent} strokeWidth="12" strokeLinecap="round" 
                                filter="drop-shadow(0px 0px 8px rgba(16,231,96,0.6))"
                                initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset }}
                                transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
                            />
                        </svg>
                        <div className="flex flex-col items-center z-10">
                            <span className="text-5xl font-extrabold text-white tracking-tighter mt-1">{kpis.qualityScore}%</span>
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em] mt-2" style={{ color: theme.accent }}>
                                {kpis.qualityScore >= 95 ? "Optimal" : kpis.qualityScore >= 80 ? "Stable" : "Critical"}
                            </span>
                        </div>
                    </div>
                    
                    <p className="text-sm leading-relaxed max-w-[240px] z-10 mb-2" style={{ color: theme.textMuted }}>
                        Your infrastructure is operating at {kpis.qualityScore >= 95 ? "peak efficiency with zero detected fatal errors." : "normal efficiency."}
                    </p>
                </motion.div>

                {/* Right: 4 KPI Cards */}
                <div className="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <KpiCard 
                        label="Total Tasks" 
                        value={kpis.totalTasks.toLocaleString()} 
                        icon={<ClipboardCheck />} 
                        badge={"+12.5%"} 
                    />
                    <KpiCard 
                        label="Total Samples" 
                        value={(kpis.totalSamples > 1000 ? (kpis.totalSamples/1000).toFixed(1) + 'k' : kpis.totalSamples).toString()} 
                        icon={<FlaskConical />} 
                        badge="Stable" 
                        badgeColor="#879d8f" 
                        badgeBg="rgba(135,157,143,0.1)"
                        color="#879d8f"
                    />
                    <KpiCard 
                        label="Defects" 
                        value={kpis.defects} 
                        icon={<AlertTriangle />} 
                        badge={kpis.defects === 0 ? "CLEAN" : kpis.defects.toString()} 
                        badgeColor={kpis.defects === 0 ? theme.accent : "#ef4444"} 
                        color={kpis.defects === 0 ? theme.accent : "#ef4444"} 
                    />
                    <KpiCard 
                        label="Fatal Errors" 
                        value={kpis.fatalErrors} 
                        icon={<Ban />} 
                        badge={kpis.fatalErrors === 0 ? "CLEAN" : kpis.fatalErrors.toString()} 
                        badgeColor={kpis.fatalErrors === 0 ? theme.accent : "#ef4444"} 
                        color={kpis.fatalErrors === 0 ? theme.accent : "#ef4444"} 
                    />
                </div>
            </div>

            {/* Monthly Quality Trend - Full Width Area Chart */}
            <motion.div variants={itemVariants} className="rounded-2xl border p-8 pb-4 relative overflow-hidden" style={cardStyle}>
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <h3 className="text-[22px] font-bold text-white tracking-tight mb-1">Monthly Quality Trend</h3>
                        <p className="text-sm" style={{ color: theme.textMuted }}>Performance trajectory over the last 6 months</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors hover:bg-white/5" 
                                style={{ color: theme.accent, border: `1px solid ${theme.border}` }}>
                            Export CSV
                        </button>
                    </div>
                </div>

                {chartData.length === 0 ? (
                    <div className="h-[280px] flex items-center justify-center">
                        <p className="text-sm" style={{ color: theme.textMuted }}>No monthly trend data available.</p>
                    </div>
                ) : (
                    <div className="h-[280px] w-full mt-2 -ml-6 relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="glowGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.accent} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={theme.accent} stopOpacity={0}/>
                                    </linearGradient>
                                    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="4" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                </defs>
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: theme.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }} 
                                    dy={10} 
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: theme.bg, borderColor: theme.border, borderRadius: '8px', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: theme.accent, fontWeight: 'bold' }}
                                    labelStyle={{ color: theme.textMuted, marginBottom: '4px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                    cursor={{ stroke: theme.border, strokeWidth: 1, strokeDasharray: "4 4" }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="score" 
                                    stroke={theme.accent} 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#glowGradient)" 
                                    activeDot={{ r: 6, fill: theme.accent, stroke: theme.bg, strokeWidth: 2 }}
                                    dot={{ r: 4, fill: theme.accent, strokeWidth: 0 }}
                                    style={{ filter: "url(#neonGlow)" }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </motion.div>

            {/* Product Health & Margins */}
            <motion.div variants={itemVariants} className="rounded-2xl border p-8" style={cardStyle}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[22px] font-bold text-white tracking-tight flex items-center gap-2">
                        Product Health & Margins
                    </h3>
                    <div className="px-3 py-1.5 rounded-md text-[10px] font-bold tracking-[0.1em] uppercase" 
                         style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: theme.textMuted, border: `1px solid ${theme.border}` }}>
                        {productsWithMargin.length} Active SKUs
                    </div>
                </div>

                {productsWithMargin.length === 0 ? (
                    <div className="flex items-center justify-center py-10">
                        <p className="text-sm text-center" style={{ color: theme.textMuted }}>No products added yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b" style={{ borderColor: theme.border }}>
                                    <th className="text-left font-bold pb-4 text-[10px] tracking-[0.1em] uppercase" style={{ color: theme.textMuted }}>Product</th>
                                    <th className="text-right font-bold pb-4 text-[10px] tracking-[0.1em] uppercase" style={{ color: theme.textMuted }}>Price</th>
                                    <th className="text-right font-bold pb-4 text-[10px] tracking-[0.1em] uppercase" style={{ color: theme.textMuted }}>Stock</th>
                                    <th className="text-right font-bold pb-4 text-[10px] tracking-[0.1em] uppercase" style={{ color: theme.textMuted }}>Margin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: theme.border }}>
                                {productsWithMargin.map((p, i) => (
                                    <motion.tr 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05 * i }}
                                        key={p.name} 
                                        className="hover:bg-white/[0.02] transition-colors group"
                                    >
                                        <td className="py-4 text-white">
                                            <div className="font-semibold">{p.name}</div>
                                            <div className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>{p.category}</div>
                                        </td>
                                        <td className="py-4 text-right font-mono text-sm text-white/90">₹{p.price.toFixed(0)}</td>
                                        <td className="py-4 text-right">
                                            <span className="font-bold flex justify-end" style={{ color: p.stock === 0 ? "#ef4444" : p.stock < 5 ? "#f59e0b" : theme.accent }}>
                                                {p.stock}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex justify-end">
                                                {p.margin !== null
                                                    ? <span className="font-bold text-[13px]" style={{ color: p.margin > 30 ? theme.accent : p.margin > 10 ? "#f59e0b" : "#ef4444" }}>
                                                        {p.margin > 0 ? '+' : ''}{p.margin}%
                                                      </span>
                                                    : <span style={{ color: theme.textMuted }}>—</span>}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* Bottom Section: Category Breakdown and Recent Analyses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="rounded-2xl border p-8 flex flex-col" style={cardStyle}>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <BarChart3 size={20} color={theme.textMuted} />
                            <h3 className="text-xl font-bold text-white tracking-tight">Analysis by Category</h3>
                        </div>
                    </div>
                    {categoryBreakdown.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-sm" style={{ color: theme.textMuted }}>Run market analyses to see breakdown</p>
                        </div>
                    ) : (
                        <div className="space-y-4 flex-1">
                            {categoryBreakdown.map((c, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                    key={c.category} 
                                    className="flex items-center justify-between p-4 rounded-xl transition-colors shadow-sm"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border}` }}
                                >
                                    <div>
                                        <p className="text-sm font-bold text-white mb-0.5">{c.category}</p>
                                        <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: theme.textMuted }}>{c.tasks} runs</p>
                                    </div>
                                    <div className="px-2.5 py-1 rounded-md text-[11px] font-extrabold tracking-tight" 
                                         style={{ 
                                            backgroundColor: c.score >= 90 ? theme.accentMuted : c.score >= 70 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)', 
                                            color: c.score >= 90 ? theme.accent : c.score >= 70 ? '#f59e0b' : '#ef4444' 
                                         }}>
                                        {c.score}%
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>

                <motion.div variants={itemVariants} className="rounded-2xl border p-8 flex flex-col" style={cardStyle}>
                    <div className="flex items-center gap-3 mb-8">
                        <Search size={20} color={theme.textMuted} />
                        <h3 className="text-xl font-bold text-white tracking-tight">Recent Insights</h3>
                    </div>
                    {recentAnalyses.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-sm" style={{ color: theme.textMuted }}>No insights generated yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4 flex-1">
                            {recentAnalyses.map((a, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                    key={i} 
                                    className="flex gap-4 p-4 rounded-xl transition-all"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border}` }}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-white/90 truncate mb-1.5">{a.query}</p>
                                        <div className="flex flex-wrap items-center gap-3 mt-1">
                                            <span className="text-[9px] font-bold tracking-[0.1em] uppercase px-2 py-0.5 rounded-md" 
                                                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: theme.textMuted }}>
                                                {a.category}
                                            </span>
                                            <span className="text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-wider" style={{ color: theme.textMuted }}>
                                                <Clock size={11} />
                                                {a.date}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    )
}
