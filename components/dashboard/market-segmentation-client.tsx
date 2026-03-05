"use client"

import { useState } from "react"
import { motion, Variants } from "motion/react"
import {
    Users,
    CreditCard,
    ShoppingCart,
    DollarSign,
    Sparkles,
    Target,
    PieChart,
    Info,
    Brain,
    AlertTriangle,
    Zap,
    ArrowRight
} from "lucide-react"

const theme = {
    bg: "#090e0c",
    cardBg: "#0f1511",
    border: "#1a2c20",
    text: "#ffffff",
    textMuted: "#879d8f",
    blue: "#38bdf8"
}

const cardStyle = {
    backgroundColor: theme.cardBg,
    borderColor: theme.border,
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

const featureFields = [
    { name: "balance", label: "Balance", step: 0.001, placeholder: "e.g. 40.900749" },
    { name: "balance_frequency", label: "Balance Frequency", step: 0.001, placeholder: "e.g. 0.818182" },
    { name: "purchases", label: "Purchases", step: 0.01, placeholder: "e.g. 95.40" },
    { name: "oneoff_purchases", label: "OneOff Purchases", step: 0.01, placeholder: "e.g. 0.00" },
    { name: "installments_purchases", label: "Installments Purchases", step: 0.01, placeholder: "e.g. 95.40" },
    { name: "cash_advance", label: "Cash Advance", step: 0.01, placeholder: "e.g. 0.000000" },
    { name: "purchases_frequency", label: "Purchases Frequency", step: 0.01, placeholder: "e.g. 0.166667" },
    { name: "oneoff_purchases_frequency", label: "OneOff Purchases Frequency", step: 0.1, placeholder: "e.g. 0.000000" },
    { name: "purchases_installment_frequency", label: "Purchases Installment Frequency", step: 0.1, placeholder: "e.g. 0.083333" },
    { name: "cash_advance_frequency", label: "Cash Advance Frequency", step: 0.1, placeholder: "e.g. 0.000000" },
    { name: "cash_advance_trx", label: "Cash Advance TRX", step: 1, placeholder: "e.g. 0" },
    { name: "purchases_trx", label: "Purchases TRX", step: 1, placeholder: "e.g. 2" },
    { name: "credit_limit", label: "Credit Limit", step: 0.1, placeholder: "e.g. 1000.0" },
    { name: "payments", label: "Payments", step: 0.01, placeholder: "e.g. 201.80" },
    { name: "minimum_payments", label: "Minimum Payments", step: 0.01, placeholder: "e.g. 139.50" },
    { name: "prc_full_payment", label: "PRC Full Payment", step: 0.01, placeholder: "e.g. 0.000000" },
    { name: "tenure", label: "Tenure", step: 1, placeholder: "e.g. 12" },
]

const clusterInfo: Record<number, { name: string; description: string; color: string; icon: React.ElementType }> = {
    0: { name: "Low Activity", description: "Low spending and minimal transactions.", color: "#64748b", icon: Users },
    1: { name: "Cash Advance Heavy", description: "Customers relying heavily on cash advances.", color: "#f59e0b", icon: CreditCard },
    2: { name: "Balanced Buyers", description: "Active users with balanced purchases.", color: "#34d399", icon: ShoppingCart },
    3: { name: "High Spenders", description: "Premium users with high purchase volumes.", color: "#00d4ff", icon: DollarSign },
}

export default function MarketSegmentationClient() {
    const [formData, setFormData] = useState<Record<string, string>>({})
    const [predictedCluster, setPredictedCluster] = useState<number | null>(null)
    const [predictedResult, setPredictedResult] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)

    function handleChange(name: string, value: string) {
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    async function handlePredict(e: React.FormEvent) {
        e.preventDefault()

        const required = ["balance", "purchases", "credit_limit", "payments", "tenure"]

        for (const field of required) {
            if (!formData[field]) {
                alert(`Please enter ${field.replace("_", " ")}`)
                return
            }
        }

        setIsLoading(true)

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/market-segment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (data.cluster !== undefined) {
                setPredictedCluster(data.cluster)
                setPredictedResult(data)
            }
        } catch (error) {
            console.error("Prediction error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const info = predictedCluster !== null ? clusterInfo[predictedCluster] : null

    return (
        <motion.div className="flex flex-col gap-6 w-full pb-10 max-w-7xl mx-auto"
            variants={containerVariants} initial="hidden" animate="show">

            {/* HEADER */}
            <motion.div variants={itemVariants} className="flex justify-between py-4 px-2">
                <div>
                    <h1 className="text-4xl font-extrabold text-white mb-2">Market Segmentation</h1>
                    <div className="flex items-center gap-2 text-xs uppercase" style={{ color: theme.textMuted }}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.blue }} />
                        K-Means Algorithm • Active
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* FORM */}
                <motion.div variants={itemVariants} className="lg:col-span-2 rounded-2xl border p-6" style={cardStyle}>
                    <div className="mb-6 border-b pb-4" style={{ borderColor: theme.border }}>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Brain className="w-5 h-5" style={{ color: theme.blue }} />
                            Predict Customer Segment
                        </h3>
                    </div>

                    <form onSubmit={handlePredict} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                        {featureFields.map((field) => (
                            <div key={field.name} className="flex flex-col gap-1">
                                <label className="text-xs uppercase" style={{ color: theme.textMuted }}>
                                    {field.label}
                                </label>

                                <input
                                    type="number"
                                    step={field.step}
                                    placeholder={field.placeholder}
                                    value={formData[field.name] || ""}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    className="px-3 py-2 rounded-lg text-xs border bg-transparent text-white"
                                    style={{ borderColor: theme.border }}
                                />
                            </div>
                        ))}

                        <div className="col-span-full mt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 rounded-xl text-sm font-bold flex justify-center gap-2"
                                style={{
                                    backgroundColor: isLoading ? theme.border : theme.blue,
                                    color: isLoading ? theme.textMuted : "#000"
                                }}
                            >
                                {isLoading ? "Running Clustering..." : <>
                                    <Sparkles className="w-4 h-4" />
                                    Initialize Clustering
                                </>}
                            </button>
                        </div>

                    </form>
                </motion.div>

                {/* RESULT PANEL */}
                <div className="flex flex-col gap-6">

                    <motion.div variants={itemVariants} className="rounded-2xl border p-6" style={cardStyle}>
                        <div className="flex items-center gap-2 mb-6 text-white">
                            <Target size={18} style={{ color: theme.blue }} />
                            <h3 className="text-lg font-bold">Clustering Output</h3>
                        </div>

                        {info ? (
                            <div className="p-4 rounded-xl border">
                                <div className="flex items-center gap-4">
                                    <info.icon className="w-6 h-6" style={{ color: info.color }} />
                                    <div>
                                        <div className="text-xs uppercase text-gray-400">
                                            Cluster {predictedCluster}
                                        </div>
                                        <div className="font-bold text-white">
                                            {info.name}
                                        </div>
                                    </div>
                                </div>

                                <p className="text-sm text-white/80 mt-3">
                                    {info.description}
                                </p>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500">
                                <Info className="mx-auto mb-2" />
                                Awaiting data input for inference
                            </div>
                        )}
                    </motion.div>

                    {/* MODEL CATEGORIES */}
                    <motion.div variants={itemVariants} className="rounded-2xl border p-6" style={cardStyle}>
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <PieChart className="w-4 h-4" />
                            Model Categories
                        </h3>

                        {Object.entries(clusterInfo).map(([key, cluster]) => (
                            <div key={key} className="flex items-center gap-2 py-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cluster.color }} />
                                <span className="text-sm text-white">{cluster.name}</span>
                            </div>
                        ))}
                    </motion.div>

                </div>

            </div>

            {/* AI INSIGHTS & STRATEGIES (Revealed on prediction) */}
            {predictedResult && (
                <motion.div variants={itemVariants} className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* INSIGHTS */}
                    <div className="lg:col-span-2 rounded-2xl border p-6 flex flex-col gap-4" style={cardStyle}>
                        <div className="flex items-center gap-2 text-white border-b pb-4" style={{ borderColor: theme.border }}>
                            <Zap className="w-5 h-5 text-yellow-500" />
                            <h3 className="text-lg font-bold">AI Customer Insights</h3>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            {predictedResult.insights}
                        </p>

                        <h4 className="text-white font-bold mt-4 flex items-center gap-2">
                            <Target className="w-4 h-4 text-emerald-400" />
                            Recommended Strategies
                        </h4>
                        <ul className="flex flex-col gap-3 mt-2">
                            {predictedResult.strategies?.map((strat: string, i: number) => (
                                <li key={i} className="flex gap-3 text-sm text-gray-300 bg-black/20 p-3 rounded-lg border border-white/5">
                                    <ArrowRight className="w-4 h-4 mt-0.5 text-blue-400 shrink-0" />
                                    <span>{strat}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* RISK ASSESSMENT */}
                    <div className="rounded-2xl border p-6 flex flex-col gap-4" style={cardStyle}>
                        <div className="flex items-center gap-2 text-white border-b pb-4" style={{ borderColor: theme.border }}>
                            <AlertTriangle className={`w-5 h-5 ${predictedResult.riskLevel === 'High' ? 'text-red-500' :
                                    predictedResult.riskLevel === 'Medium' ? 'text-yellow-500' : 'text-emerald-500'
                                }`} />
                            <h3 className="text-lg font-bold">Risk Assessment</h3>
                        </div>

                        <div className="mt-2 text-center">
                            <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${predictedResult.riskLevel === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                    predictedResult.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}>
                                {predictedResult.riskLevel || 'Low'} Risk
                            </span>
                        </div>

                        <p className="text-sm text-gray-400 mt-4 text-center leading-relaxed">
                            {predictedResult.riskDescription}
                        </p>
                    </div>

                </motion.div>
            )}
        </motion.div>
    )
}