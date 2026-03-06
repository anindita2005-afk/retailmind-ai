"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BarChart3, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react"

type Step = 1 | 2 | 3

export default function RegisterCard() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [successId, setSuccessId] = useState("")

  const [otp, setOtp] = useState("")
  const [otpToken, setOtpToken] = useState("")

  const [form, setForm] = useState({
    business_name: "",
    gst_number: "",
    business_reg_no: "",
    pan_number: "",
    owner_name: "",
    phone: "",
    email: "",
    password: "",
    confirm_password: "",
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const inputStyle = {
    background: "rgba(15,23,42,0.8)",
    border: "1px solid rgba(0,212,255,0.15)",
    color: "white",
  }
  const focusBorder = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = "rgba(0,212,255,0.5)")
  const blurBorder = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = "rgba(0,212,255,0.15)")

  function validateStep1() {
    if (!form.business_name || !form.gst_number || !form.business_reg_no || !form.owner_name) {
      setError("Please fill in all required fields.")
      return false
    }
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    if (!gstRegex.test(form.gst_number.toUpperCase())) {
      setError("Invalid GST number format. Example: 22AAAAA0000A1Z5")
      return false
    }
    if (form.pan_number) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
      if (!panRegex.test(form.pan_number.toUpperCase())) {
        setError("Invalid PAN number format. Example: ABCDE1234F")
        return false
      }
    }
    return true
  }

  async function goToStep2() {
    setError("")
    if (!validateStep1()) return

    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/verify-gst`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gst_number: form.gst_number }),
      })
      const data = await res.json()
      if (!data.valid) {
        setError(data.error || "GST number could not be verified.")
      } else {
        setStep(2)
      }
    } catch {
      setError("GST verification failed. Try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (step === 2) {
      if (!form.email || !form.password) {
        setError("Email and password are required.")
        return
      }
      if (form.password !== form.confirm_password) {
        setError("Passwords do not match.")
        return
      }
      if (form.password.length < 8) {
        setError("Password must be at least 8 characters.")
        return
      }
      setLoading(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/auth/register?step=verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            business_name: form.business_name,
            gst_number: form.gst_number,
            business_reg_no: form.business_reg_no,
            pan_number: form.pan_number || undefined,
            owner_name: form.owner_name,
            phone: form.phone || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Registration failed")
        } else {
          setOtpToken(data.otpToken)
          setStep(3)
        }
      } catch {
        setError("Network error. Please try again.")
      } finally {
        setLoading(false)
      }
    } else if (step === 3) {
      setLoading(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/auth/register?step=confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            business_name: form.business_name,
            gst_number: form.gst_number,
            business_reg_no: form.business_reg_no,
            pan_number: form.pan_number || undefined,
            owner_name: form.owner_name,
            phone: form.phone || undefined,
            otp,
            otpToken,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "OTP Verification failed")
        } else {
          document.cookie = `retailiq_session=${data.token}; path=/; max-age=604800; samesite=lax`;
          setSuccessId(data.display_id)
        }
      } catch {
        setError("Network error. Please try again.")
      } finally {
        setLoading(false)
      }
    }
  }

  const cardStyle = {
    background: "rgba(6,13,31,0.85)",
    borderColor: "rgba(0,212,255,0.18)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 0 60px rgba(0,212,255,0.08), 0 24px 48px rgba(0,0,0,0.5)",
  }

  if (successId) {
    return (
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="rounded-2xl border p-8 text-center" style={cardStyle}>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-14 h-14" style={{ color: "#00d4ff" }} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 font-sans">Account Created!</h2>
          <p className="text-sm mb-4" style={{ color: "rgba(148,163,184,0.8)" }}>
            Your business account is ready.
          </p>
          <div
            className="rounded-xl px-6 py-4 mb-6"
            style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.25)" }}
          >
            <p className="text-xs mb-1" style={{ color: "rgba(0,212,255,0.7)" }}>
              Your User ID
            </p>
            <p className="text-2xl font-bold font-mono" style={{ color: "#00d4ff" }}>
              {successId}
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: "rgba(0,212,255,0.9)", color: "#060d1f" }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative z-10 w-full max-w-lg mx-4">
      <div className="rounded-2xl border p-8" style={cardStyle}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(0,212,255,0.15)", border: "1px solid rgba(0,212,255,0.3)" }}
          >
            <BarChart3 className="w-5 h-5" style={{ color: "#00d4ff" }} />
          </div>
          <div>
            <p className="font-bold text-lg leading-none text-white font-sans">RetailIQ</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(0,212,255,0.7)" }}>
              Create your business account
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 hidden sm:flex">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold transition-all"
                style={{
                  background: step >= s ? "rgba(0,212,255,0.9)" : "rgba(15,23,42,0.8)",
                  color: step >= s ? "#060d1f" : "rgba(148,163,184,0.6)",
                  border: `1px solid ${step >= s ? "transparent" : "rgba(0,212,255,0.2)"}`,
                }}
              >
                {s}
              </div>
              <span
                className="text-[11px] whitespace-nowrap"
                style={{ color: step >= s ? "rgba(0,212,255,0.9)" : "rgba(148,163,184,0.5)" }}
              >
                {s === 1 ? "Business" : s === 2 ? "Account" : "Verify OTP"}
              </span>
              {s < 3 && <div className="w-3 h-px shrink-0 mx-1" style={{ background: "rgba(0,212,255,0.2)" }} />}
            </div>
          ))}
        </div>

        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-lg text-sm"
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171",
            }}
          >
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(148,163,184,0.9)" }}>
                  Business Name <span style={{ color: "#f87171" }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.business_name}
                  onChange={set("business_name")}
                  placeholder="Acme Retail Pvt. Ltd."
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(148,163,184,0.9)" }}>
                  Owner Name <span style={{ color: "#f87171" }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.owner_name}
                  onChange={set("owner_name")}
                  placeholder="Ravi Kumar"
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(148,163,184,0.9)" }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(148,163,184,0.9)" }}>
                  GST Number <span style={{ color: "#f87171" }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.gst_number}
                  onChange={set("gst_number")}
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all font-mono"
                  style={inputStyle}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                />
                <p className="text-xs mt-1" style={{ color: "rgba(148,163,184,0.5)" }}>
                  15-character GSTIN (e.g. 22AAAAA0000A1Z5)
                </p>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(148,163,184,0.9)" }}>
                  Business Registration No. <span style={{ color: "#f87171" }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.business_reg_no}
                  onChange={set("business_reg_no")}
                  placeholder="CIN / MSME / Shop Act No."
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(148,163,184,0.9)" }}>
                  PAN Number{" "}
                  <span className="text-xs" style={{ color: "rgba(148,163,184,0.5)" }}>
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  value={form.pan_number}
                  onChange={set("pan_number")}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all font-mono"
                  style={inputStyle}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                />
              </div>
            </div>
            <button
              onClick={goToStep2}
              disabled={loading}
              className="mt-2 w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: "rgba(0,212,255,0.9)", color: "#060d1f", opacity: loading ? 0.7 : 1 }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Verifying GST..." : "Continue to Account Setup"}
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(148,163,184,0.9)" }}>
                Email Address <span style={{ color: "#f87171" }}>*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                required
                placeholder="you@business.com"
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(148,163,184,0.9)" }}>
                Password <span style={{ color: "#f87171" }}>*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  required
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(148,163,184,0.6)" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(148,163,184,0.9)" }}>
                Confirm Password <span style={{ color: "#f87171" }}>*</span>
              </label>
              <input
                type="password"
                value={form.confirm_password}
                onChange={set("confirm_password")}
                required
                placeholder="Repeat password"
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
            </div>
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => { setStep(1); setError("") }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(0,212,255,0.3)",
                  color: "rgba(0,212,255,0.9)",
                }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-2 flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                style={{
                  background: loading ? "rgba(0,212,255,0.4)" : "rgba(0,212,255,0.9)",
                  color: "#060d1f",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Sending OTP..." : "Sign Up & Get OTP"}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(148,163,184,0.9)" }}>
                Verify Email OTP <span style={{ color: "#f87171" }}>*</span>
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{ ...inputStyle, textAlign: "center", letterSpacing: "4px", fontSize: "18px", fontWeight: "bold" }}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "8px" }}>
                An OTP has been sent to your email. Please enter it here.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => { setStep(2); setError("") }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(0,212,255,0.3)",
                  color: "rgba(0,212,255,0.9)",
                }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-2 flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                style={{
                  background: loading ? "rgba(0,212,255,0.4)" : "rgba(0,212,255,0.9)",
                  color: "#060d1f",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Verifying..." : "Verify & Create"}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm mt-5" style={{ color: "rgba(148,163,184,0.7)" }}>
          Already have an account?{" "}
          <Link href="/login" className="font-medium hover:underline" style={{ color: "#00d4ff" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
