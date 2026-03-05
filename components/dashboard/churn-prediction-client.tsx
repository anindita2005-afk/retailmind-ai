"use client"

import { useState, useEffect } from "react"
import { motion, Variants } from "motion/react"
import {
    UserX,
    Users,
    AlertTriangle,
    CheckCircle2,
    Github,
    Brain,
    Info,
    Gauge,
    Shield,
    Zap,
} from "lucide-react"

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

const selectFields: {
    name: string
    label: string
    options: string[]
}[] = [
        { name: "gender", label: "Gender", options: ["Male", "Female"] },
        { name: "Partner", label: "Partner", options: ["Yes", "No"] },
        { name: "Dependents", label: "Dependents", options: ["Yes", "No"] },
        { name: "PhoneService", label: "Phone Service", options: ["Yes", "No"] },
        { name: "MultipleLines", label: "Multiple Lines", options: ["Yes", "No", "No phone service"] },
        { name: "InternetService", label: "Internet Service", options: ["DSL", "Fiber optic", "No"] },
        { name: "OnlineSecurity", label: "Online Security", options: ["Yes", "No", "No internet service"] },
        { name: "OnlineBackup", label: "Online Backup", options: ["Yes", "No", "No internet service"] },
        { name: "DeviceProtection", label: "Device Protection", options: ["Yes", "No", "No internet service"] },
        { name: "TechSupport", label: "Tech Support", options: ["Yes", "No", "No internet service"] },
        { name: "StreamingTV", label: "Streaming TV", options: ["Yes", "No", "No internet service"] },
        { name: "StreamingMovies", label: "Streaming Movies", options: ["Yes", "No", "No internet service"] },
        { name: "Contract", label: "Contract", options: ["Month-to-month", "One year", "Two year"] },
        { name: "PaperlessBilling", label: "Paperless Billing", options: ["Yes", "No"] },
        { name: "PaymentMethod", label: "Payment Method", options: ["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"] },
    ]

const numericFields = [
    { name: "SeniorCitizen", label: "Senior Citizen (0/1)", placeholder: "0 or 1", step: 1 },
    { name: "MonthlyCharges", label: "Monthly Charges", placeholder: "e.g. 70.35", step: 0.01 },
    { name: "TotalCharges", label: "Total Charges", placeholder: "e.g. 1397.47", step: 0.01 },
    { name: "tenure", label: "Tenure (months)", placeholder: "e.g. 29", step: 1 },
]

export default function ChurnPredictionClient() {
    const [formData, setFormData] = useState<Record<string, string>>({})
    const [result, setResult] = useState<{ churns: boolean; confidence: number; reason?: string } | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [history, setHistory] = useState<any[]>([])
    const [openId, setOpenId] = useState<string | null>(null)

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/churn-history`)
            .then(res => res.json())
            .then(data => {
                if (data.predictions) {
                    setHistory(data.predictions)
                }
            })
    }, [])

    function handleChange(name: string, value: string) {
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    async function handlePredict(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/churn-predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
            })

            if (!res.ok) {
                const err = await res.json()
                console.error("Backend error:", err)
                throw new Error(err.details || err.error || "Prediction failed")
            }

            const data = await res.json()

            setResult({
            churns: data.churns,
            confidence: data.confidence
            })

            // 🔄 Refresh history after saving
            const historyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/churn-history`)
            const historyData = await historyRes.json()
            if (historyData.predictions) {
                setHistory(historyData.predictions)
            }

        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
        }

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
                    <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Churn Prediction</h1>
                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: theme.textMuted }}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.red, boxShadow: `0 0 8px ${theme.red}` }} />
                        Random Forest Algorithm • Active
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Prediction Form */}
                <motion.div variants={itemVariants} className="lg:col-span-2 rounded-2xl border p-6" style={cardStyle}>
                    <div className="mb-6 border-b pb-4" style={{ borderColor: theme.border }}>
                        <h3 className="text-[17px] font-bold text-white tracking-tight mb-1 flex items-center gap-2">
                            <Brain className="w-5 h-5" style={{ color: theme.red }} />
                            Customer Information
                        </h3>
                        <p className="text-[11px] font-semibold" style={{ color: theme.textMuted }}>
                            Enter details to predict telecom customer churn probability
                        </p>
                    </div>

                    <form onSubmit={handlePredict}>
                        {/* Numeric fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                            {numericFields.map((field) => (
                                <div key={field.name} className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold tracking-[0.1em] uppercase" style={{ color: theme.textMuted }}>
                                        {field.label}
                                    </label>
                                    <input
                                        type="number"
                                        step={field.step}
                                        placeholder={field.placeholder}
                                        value={formData[field.name] || ""}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        className="px-3 py-2 rounded-lg text-xs outline-none transition-all placeholder:text-white/20 focus:ring-1 border bg-transparent text-white"
                                        style={{ borderColor: theme.border, caretColor: theme.red, "--tw-ring-color": theme.red } as any}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Select fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            {selectFields.map((field) => (
                                <div key={field.name} className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold tracking-[0.1em] uppercase" style={{ color: theme.textMuted }}>
                                        {field.label}
                                    </label>
                                    <select
                                        value={formData[field.name] || ""}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        className="px-3 py-2 rounded-lg text-xs outline-none transition-all focus:ring-1 border bg-transparent text-white appearance-none cursor-pointer"
                                        style={{ borderColor: theme.border, "--tw-ring-color": theme.red, backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23879d8f%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto' } as any}
                                    >
                                        <option value="" style={{ backgroundColor: theme.cardBg }}>Select...</option>
                                        {field.options.map((opt) => (
                                            <option key={opt} value={opt} style={{ backgroundColor: theme.cardBg }}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-4 border-t" style={{ borderColor: theme.border }}>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 rounded-xl text-sm font-extrabold uppercase tracking-wide transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(239,68,68,0.15)] flex items-center justify-center gap-2 cursor-pointer text-white"
                                style={{
                                    backgroundColor: isLoading ? theme.border : theme.red,
                                    color: isLoading ? theme.textMuted : "#ffffff",
                                }}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Running Analysis...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4" />
                                        Predict Churn Probability
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* 🔥 Recent Predictions Dropdown */}
                    <motion.div
                        variants={itemVariants}
                        className="rounded-2xl border p-6 mt-6"
                        style={cardStyle}
                    >
                        <h3 className="text-[15px] font-bold text-white tracking-tight mb-4">
                            Recent Predictions
                        </h3>

                        <div className="space-y-3">
                            {history.length === 0 && (
                                <p className="text-xs text-white/40">
                                    No predictions yet.
                                </p>
                            )}

                            {history.map((item) => {
                                const isOpen = openId === item.prediction_id

                                return (
                                    <div
                                        key={item.prediction_id}
                                        className="rounded-xl border p-4 cursor-pointer transition-all"
                                        style={{ borderColor: theme.border }}
                                        onClick={() =>
                                            setOpenId(isOpen ? null : item.prediction_id)
                                        }
                                    >
                                        {/* SUMMARY ROW */}
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-white font-semibold text-sm">
                                                    {item.churns ? "Likely to Churn" : "Likely to Stay"}
                                                </p>
                                                <p className="text-white/50 text-xs">
                                                    {new Date(item.created_at).toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="px-2 py-1 rounded-md text-xs font-bold"
                                                    style={{
                                                        backgroundColor: item.churns
                                                            ? "rgba(239,68,68,0.1)"
                                                            : "rgba(52,211,153,0.1)",
                                                        color: item.churns ? "#ef4444" : "#34d399"
                                                    }}
                                                >
                                                    {item.confidence}%
                                                </div>

                                                <span className="text-white/40 text-xs">
                                                    {isOpen ? "▲" : "▼"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* EXPANDED DETAILS */}
                                        {isOpen && (
                                            <div className="mt-4 text-xs text-white/80 space-y-3">
                                                {item.reason && (
                                                    <div>
                                                        <p className="text-white font-semibold mb-1">
                                                            AI Reason
                                                        </p>
                                                        <p className="text-white/70">
                                                            {item.reason}
                                                        </p>
                                                    </div>
                                                )}

                                                {item.input_data && (
                                                    <div>
                                                        <p className="text-white font-semibold mb-1">
                                                            Customer Inputs
                                                        </p>
                                                        <div className="grid grid-cols-2 gap-2 text-white/60">
                                                            {Object.entries(item.input_data).map(
                                                                ([key, value]) => (
                                                                    <div key={key}>
                                                                        <span className="font-medium">
                                                                            {key}:
                                                                        </span>{" "}
                                                                        {String(value)}
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>

                </motion.div>



                {/* Side panel */}
                <div className="flex flex-col gap-6">
                    {/* Result Card */}
                    <motion.div variants={itemVariants} className="rounded-2xl border p-6 flex flex-col" style={{ ...cardStyle, background: 'linear-gradient(180deg, rgba(8,15,12,1) 0%, rgba(9,14,12,1) 100%)', borderColor: 'rgba(239,68,68,0.1)' }}>
                        <div className="flex items-center gap-2 mb-6 text-white">
                            <Gauge size={18} style={{ color: theme.red }} />
                            <h3 className="text-[17px] font-bold tracking-tight">Prediction Output</h3>
                        </div>

                        {result ? (
                            <div
                                className="rounded-xl border p-5 flex flex-col gap-4 relative overflow-hidden"
                                style={{
                                    backgroundColor: result.churns ? "rgba(239,68,68,0.02)" : "rgba(52,211,153,0.02)",
                                    borderColor: result.churns ? "rgba(239,68,68,0.1)" : "rgba(52,211,153,0.1)",
                                }}
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 blur-[50px] pointer-events-none" style={{ backgroundColor: result.churns ? "rgba(239,68,68,0.15)" : "rgba(52,211,153,0.15)" }} />

                                <div className="flex items-center gap-4 relative z-10">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center border"
                                        style={{
                                            background: result.churns ? "rgba(239,68,68,0.1)" : "rgba(52,211,153,0.1)",
                                            borderColor: result.churns ? "rgba(239,68,68,0.2)" : "rgba(52,211,153,0.2)",
                                        }}
                                    >
                                        {result.churns ? (
                                            <AlertTriangle className="w-6 h-6" style={{ color: theme.red }} />
                                        ) : (
                                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-[15px] leading-tight mt-0.5">
                                            {result.churns ? "Likely to Churn" : "Likely to Stay"}
                                        </p>
                                        <p className="text-[12px] font-medium mt-1" style={{ color: result.churns ? theme.red : "#34d399" }}>
                                            Confidence: {result.confidence}%
                                        </p>
                                    </div>
                                </div>

                                {/* Confidence bar */}
                                <div className="mt-2 relative z-10">
                                    <div className="flex justify-between text-[9px] font-extrabold tracking-wider uppercase text-muted-foreground mb-1">
                                        <span style={{ color: theme.textMuted }}>Stay</span>
                                        <span style={{ color: theme.textMuted }}>Churn</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{
                                                width: `${result.confidence}%`,
                                                background: result.churns
                                                    ? `linear-gradient(90deg, #f59e0b, ${theme.red})`
                                                    : `linear-gradient(90deg, #34d399, ${theme.accent})`,
                                            }}
                                        />
                                    </div>
                                </div>

                                {result.reason && (
                                    <p className="text-[11px] leading-relaxed text-white/80 mt-1 relative z-10">
                                        {result.reason}
                                    </p>
                                    )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-[11px] font-bold tracking-widest uppercase text-white/30 text-center px-4">
                                <Info className="w-6 h-6 mb-3 text-white/20" />
                                Awaiting customer data for inference
                            </div>
                        )}
                    </motion.div>

                    {/* Key Factors */}
                    <motion.div variants={itemVariants} className="rounded-2xl border p-6" style={cardStyle}>
                        <h3 className="text-[15px] font-bold text-white tracking-tight mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4" style={{ color: theme.textMuted }} />
                            Key Churn Factors
                        </h3>
                        <div className="space-y-2">
                            {[
                                { label: "Month-to-month Contract", impact: "High", color: theme.red },
                                { label: "Short Tenure (<12 mo)", impact: "High", color: theme.red },
                                { label: "No Tech Support", impact: "Medium", color: "#f59e0b" },
                                { label: "No Online Security", impact: "Medium", color: "#f59e0b" },
                                { label: "High Monthly Charges", impact: "Medium", color: "#f59e0b" },
                                { label: "Paperless Billing", impact: "Low", color: "#34d399" },
                            ].map((factor) => (
                                <div key={factor.label} className="flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all" style={{ borderColor: 'rgba(255,255,255,0.02)' }}>
                                    <span className="text-[12px] text-white/90 font-medium">{factor.label}</span>
                                    <span
                                        className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md"
                                        style={{ backgroundColor: `${factor.color}15`, color: factor.color }}
                                    >
                                        {factor.impact}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Tech Stack */}
                    <motion.div variants={itemVariants} className="rounded-2xl border p-6" style={cardStyle}>
                        <h3 className="text-[13px] font-bold text-white tracking-tight mb-4 text-center">Engineered With</h3>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {["Python", "Flask", "Scikit-learn", "Random Forest", "Pandas", "NumPy"].map((tech) => (
                                <span
                                    key={tech}
                                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-sm"
                                    style={{ borderColor: theme.border, color: theme.textMuted, backgroundColor: 'rgba(255,255,255,0.02)' }}
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                        
                    </motion.div>
            

                </div>
            </div>
        </motion.div>
    )
}
