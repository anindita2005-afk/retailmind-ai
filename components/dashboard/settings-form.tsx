"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, CheckCircle2, Upload, Building2, X, AlertTriangle, Trash2 } from "lucide-react"
import Image from "next/image"

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any
}

export default function SettingsForm({ user }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    business_name: user?.business_name || "",
    gst_number: user?.gst_number || "",
    business_reg_no: user?.business_reg_no || "",
    pan_number: user?.pan_number || "",
    owner_name: user?.owner_name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    pincode: user?.pincode || "",
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  // Logo state
  const [logoUrl, setLogoUrl] = useState<string>(user?.logo_url || "")
  const [logoPreview, setLogoPreview] = useState<string>(user?.logo_url || "")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  // Delete Account State
  const [deleteMode, setDeleteMode] = useState<"none" | "confirm" | "verify">("none")
  const [deleteOtp, setDeleteOtp] = useState("")
  const [deleteOtpToken, setDeleteOtpToken] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  async function requestDeleteOtp() {
    setDeleteError("")
    setDeleteLoading(true)
    try {
      const res = await fetch("/api/profile/delete-account?step=request", { method: "POST" })
      const data = await res.json()
      if (!res.ok) setDeleteError(data.error || "Failed to send OTP")
      else {
        setDeleteOtpToken(data.otpToken)
        setDeleteMode("verify")
      }
    } catch {
      setDeleteError("Network error")
    } finally {
      setDeleteLoading(false)
    }
  }

  async function confirmDeleteAccount() {
    if (deleteOtp.length !== 6) {
      setDeleteError("Please enter a valid 6-digit OTP")
      return
    }
    setDeleteError("")
    setDeleteLoading(true)
    try {
      const res = await fetch("/api/profile/delete-account?step=verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: deleteOtp, otpToken: deleteOtpToken })
      })
      const data = await res.json()
      if (!res.ok) {
        setDeleteError(data.error || "Invalid OTP or deletion failed")
        setDeleteLoading(false)
      } else {
        router.push("/login")
      }
    } catch {
      setDeleteError("Network error")
      setDeleteLoading(false)
    }
  }

  // Handle logo file selection — show preview immediately
  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError("")
    if (!file.type.startsWith("image/")) { setLogoError("Only image files are allowed"); return }
    if (file.size > 2 * 1024 * 1024) { setLogoError("File too large (max 2 MB)"); return }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function handleLogoDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    setLogoError("")
    if (!file.type.startsWith("image/")) { setLogoError("Only image files are allowed"); return }
    if (file.size > 2 * 1024 * 1024) { setLogoError("File too large (max 2 MB)"); return }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function removeLogo() {
    setLogoFile(null)
    setLogoPreview("")
    setLogoUrl("")
    if (fileInputRef.current) fileInputRef.current.value = ""

    // Auto-save removal immediately in background
    if (user?.logo_url) {
      setLogoUploading(true)
      try {
        const res = await fetch(`/api/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logo_url: "" }),
        })
        if (res.ok) router.refresh()
      } catch (err) {
        console.error(err)
      } finally {
        setLogoUploading(false)
      }
    }
  }

  async function uploadLogo(): Promise<string | null> {
    if (!logoFile) return logoUrl // Will be "" if removed or existing URL if unmodified
    setLogoUploading(true)
    try {
      const fd = new FormData()
      fd.append("logo", logoFile)
      const res = await fetch(`/api/profile/logo`, { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) { setLogoError(data.error || "Upload failed"); return null }
      setLogoUrl(data.logo_url)
      setLogoFile(null)
      return data.logo_url as string
    } catch {
      setLogoError("Network error during upload")
      return null
    } finally {
      setLogoUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const finalLogoUrl = await uploadLogo()
      // If logoFile exists but we got null back, the upload failed.
      if (logoFile && finalLogoUrl === null) { setLoading(false); return }

      const res = await fetch(`/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, logo_url: finalLogoUrl }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error || "Failed to save")
      else {
        setSaved(true)
        router.refresh()
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const fieldClass =
    "w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1"

  const Field = ({
    label, field, placeholder, readOnly, mono,
  }: {
    label: string; field: keyof typeof form; placeholder?: string; readOnly?: boolean; mono?: boolean
  }) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        value={form[field]}
        onChange={set(field)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`${fieldClass} ${mono ? "font-mono" : ""} ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
      />
    </div>
  )

  const cardStyle = { background: "rgba(15,23,42,0.5)", borderColor: "rgba(255,255,255,0.07)" }

  return (
    <div className="max-w-2xl mx-auto">
      {/* User ID card */}
      <div
        className="rounded-xl border p-4 mb-6 flex items-center gap-4"
        style={{ background: "rgba(71,255,134,0.05)", borderColor: "rgba(71,255,134,0.15)" }}
      >
        {/* Show logo if set, else initials */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0 overflow-hidden"
          style={{ background: "rgba(71,255,134,0.15)", border: "1px solid rgba(71,255,134,0.25)" }}
        >
          {logoPreview ? (
            <Image src={logoPreview} alt="Logo" width={48} height={48} className="w-full h-full object-cover" unoptimized />
          ) : (
            <span style={{ color: "#47ff86" }}>{user?.business_name?.charAt(0)?.toUpperCase() || "B"}</span>
          )}
        </div>
        <div>
          <p className="font-semibold text-foreground">{user?.business_name || "Your Business"}</p>
          <p className="text-xs font-mono mt-0.5" style={{ color: "#47ff86" }}>{user?.display_id || "—"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">

        {/* ── BUSINESS LOGO ── */}
        <section className="rounded-xl border p-5" style={cardStyle}>
          <h3 className="text-sm font-semibold text-foreground mb-1">Business Logo</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Appears on invoices and your profile. PNG or JPG, max 2 MB.
          </p>

          {logoPreview ? (
            /* Preview state */
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0"
                style={{ border: "1px solid rgba(71,255,134,0.20)", background: "rgba(0,0,0,0.3)" }}
              >
                <Image src={logoPreview} alt="Logo preview" width={80} height={80} className="w-full h-full object-contain" unoptimized />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                  {logoFile ? `New: ${logoFile.name}` : "Current logo"}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: "rgba(71,255,134,0.12)", border: "1px solid rgba(71,255,134,0.25)", color: "#47ff86" }}
                  >
                    <Upload className="w-3 h-3" /> Change
                  </button>
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", color: "#f87171" }}
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Drop zone */
            <div
              className="relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 px-6 cursor-pointer transition-all hover:bg-white/[0.02]"
              style={{ borderColor: "rgba(71,255,134,0.20)" }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleLogoDrop}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(71,255,134,0.10)", border: "1px solid rgba(71,255,134,0.20)" }}
              >
                <Building2 className="w-6 h-6" style={{ color: "#47ff86" }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  <span style={{ color: "#47ff86" }}>Click to upload</span> or drag & drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG, WEBP — max 2 MB</p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoSelect}
          />

          {logoError && (
            <p className="text-xs text-red-400 mt-2">{logoError}</p>
          )}
        </section>

        {/* ── BUSINESS INFO ── */}
        <section className="rounded-xl border p-5" style={cardStyle}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Business Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Business Name *" field="business_name" placeholder="Acme Retail Pvt. Ltd." />
            </div>
            <Field label="Owner Name *" field="owner_name" placeholder="Ravi Kumar" />
            <Field label="Phone" field="phone" placeholder="+91 98765 43210" />
            <Field label="GST Number *" field="gst_number" placeholder="22AAAAA0000A1Z5" mono />
            <Field label="Business Reg. No. *" field="business_reg_no" placeholder="CIN / MSME No." />
            <div className="sm:col-span-2">
              <Field label="PAN Number (optional)" field="pan_number" placeholder="ABCDE1234F" mono />
            </div>
          </div>
        </section>

        {/* ── ADDRESS ── */}
        <section className="rounded-xl border p-5" style={cardStyle}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Address</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Street Address" field="address" placeholder="123 MG Road" />
            </div>
            <Field label="City" field="city" placeholder="Mumbai" />
            <Field label="State" field="state" placeholder="Maharashtra" />
            <Field label="Pincode" field="pincode" placeholder="400001" />
          </div>
        </section>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || logoUploading}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold self-start transition-all disabled:opacity-60"
          style={{
            background: saved ? "#34d399" : "#47ff86",
            color: "#060d1f",
            boxShadow: saved ? "0 0 18px rgba(52,211,153,0.4)" : "0 0 18px rgba(71,255,134,0.3)",
          }}
        >
          {loading || logoUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {loading || logoUploading ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </button>
      </form>

      {/* ── DANGER ZONE ── */}
      <section className="rounded-xl border p-5 mt-10" style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.20)" }}>
        <h3 className="text-sm font-semibold text-red-500 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Danger Zone
        </h3>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Permanently delete your RetailMind AI account, business profile, and remove access to all associated data. This action cannot be undone.
        </p>

        {deleteMode === "none" && (
          <button
            onClick={() => setDeleteMode("confirm")}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/20"
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        )}

        {deleteMode === "confirm" && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex flex-col gap-3">
            <p className="text-sm font-medium text-red-400">Are you sure you want to delete your account?</p>
            {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                onClick={requestDeleteOtp}
                disabled={deleteLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-all disabled:opacity-60"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Yes, Send OTP
              </button>
              <button
                onClick={() => { setDeleteMode("none"); setDeleteError("") }}
                disabled={deleteLoading}
                className="px-4 py-2 bg-transparent text-muted-foreground hover:text-white rounded-lg text-sm font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {deleteMode === "verify" && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium text-red-400 mb-1">Verify Account Deletion</p>
              <p className="text-xs text-muted-foreground">An OTP has been sent to {user?.email}. Enter it below to permanently delete your account.</p>
            </div>
            
            <div className="flex gap-3 items-start">
              <div className="flex-1 max-w-[200px]">
                <input
                  type="text"
                  placeholder="6-digit OTP"
                  maxLength={6}
                  value={deleteOtp}
                  onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-black/50 border border-red-500/30 text-white placeholder:text-muted-foreground outline-none focus:border-red-500 transition-all text-center tracking-widest font-mono"
                />
                {deleteError && <p className="text-xs text-red-500 mt-1">{deleteError}</p>}
              </div>
              <button
                onClick={confirmDeleteAccount}
                disabled={deleteLoading || deleteOtp.length !== 6}
                className="flex items-center justify-center min-w-[120px] px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-all disabled:opacity-60"
              >
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Forever"}
              </button>
            </div>
            
            <button
              onClick={() => { setDeleteMode("none"); setDeleteOtp(""); setDeleteError("") }}
              disabled={deleteLoading}
              className="text-xs text-muted-foreground hover:text-white self-start transition-all"
            >
              Cancel Deletion
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
