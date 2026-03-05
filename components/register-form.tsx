"use client"

import { useState } from "react"
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle, MessageCircle, ShieldCheck } from "lucide-react"

type Step = 1 | 2 | 3

const CATEGORIES = [
  "Electronics",
  "FMCG / Grocery",
  "Apparel & Fashion",
  "Furniture & Home",
  "Stationery & Office",
  "Food & Beverage",
  "Pharmaceuticals",
  "Auto Parts",
  "Jewellery",
  "Cosmetics & Beauty",
  "Sports & Fitness",
  "Toys & Games",
  "Agriculture",
  "Other",
]

function validateGST(gst: string) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst.toUpperCase())
}

export default function RegisterForm() {
  const [step, setStep] = useState<Step>(1)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [gstValidated, setGstValidated] = useState(false)
  const [gstValidating, setGstValidating] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    gst_number: "",
    business_category: "",
    password: "",
    // Step 2
    business_name: "",
    business_reg_number: "",
    pan_number: "",
    // Step 3
    city: "",
    state: "",
    phone: "",
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  // GST inline validation
  function handleValidateGST() {
    if (!form.gst_number.trim()) { setError("Please enter a GST number first."); return }
    setGstValidating(true)
    setError("")
    setTimeout(() => {
      setGstValidating(false)
      if (validateGST(form.gst_number)) {
        setGstValidated(true)
      } else {
        setError("Invalid GST format. Example: 22AAAAA0000A1Z5")
        setGstValidated(false)
      }
    }, 800)
  }

  function goStep2() {
    if (!form.full_name.trim()) { setError("Full name is required."); return }
    if (!form.email.trim()) { setError("Email address is required."); return }
    if (!form.gst_number.trim()) { setError("GST number is required."); return }
    if (!gstValidated) { setError("Please validate your GST number first."); return }
    if (!form.business_category) { setError("Please select a business category."); return }
    if (!form.password || form.password.length < 8) { setError("Password must be at least 8 characters."); return }
    if (!agreedToTerms) { setError("You must agree to the Terms of Service."); return }
    setError("")
    setStep(2)
  }

  function goStep3() {
    if (!form.business_name.trim()) { setError("Business name is required."); return }
    if (!form.business_reg_number.trim()) { setError("Business registration number is required."); return }
    setError("")
    setStep(3)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.city.trim()) { setError("City is required."); return }
    setError("")
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          business_name: form.business_name,
          gst_number: form.gst_number.toUpperCase(),
          business_reg_number: form.business_reg_number,
          pan_number: form.pan_number?.toUpperCase() || null,
          owner_name: form.full_name,
          phone: form.phone || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.")
      } else {
        window.location.href = "/dashboard"
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const stepPercent = step === 1 ? 33 : step === 2 ? 66 : 100
  const stepLabel = step === 1 ? "BUSINESS IDENTITY" : step === 2 ? "BUSINESS DETAILS" : "LOCATION & CONTACT"

  return (
    <div className="reg-root">
      {/* ── Left Panel ── */}
      <div className="reg-left">
        {/* Logo */}
        <div className="reg-left-logo">
          <div className="reg-logo-wrap">
            <img
              src="/image copy.png"
              alt="RetailMind AI"
              className="reg-logo-img"
            />
          </div>
        </div>

        {/* Hero */}
        <div className="reg-left-hero">
          <h1>
            AI Infrastructure<br />
            <span className="reg-left-blue">for SMEs.</span>
          </h1>
          <p>
            Empowering small and medium enterprises with enterprise-grade intelligence to scale operations,
            predict demand, and optimize margins.
          </p>
        </div>

        {/* Features */}
        <div className="reg-left-features">
          {[
            "Advanced Inventory Analytics",
            "AI-Powered Demand Forecasting",
            "Seamless GST Compliance Integration",
          ].map((f) => (
            <div key={f} className="reg-left-feature">
              <CheckCircle className="reg-feature-icon" />
              <span>{f}</span>
            </div>
          ))}
        </div>

        {/* Trusted logos placeholder */}
        <div className="reg-left-trust">
          <p className="reg-trust-label">Trusted by businesses using</p>
          <div className="reg-trust-logos">
            <span className="reg-trust-logo">GoFr</span>
            <span className="reg-trust-logo">Safoe</span>
          </div>
        </div>

        {/* Footer */}
        <div className="reg-left-footer">© 2024 RetailMind AI Technologies Inc.</div>
      </div>

      {/* ── Right Panel ── */}
      <div className="reg-right">
        {/* Top nav */}
        <div className="reg-right-topnav">
          <span>Already have an account?</span>
          <a href="/login" className="reg-login-btn">Login</a>
        </div>

        <div className="reg-right-body">
          {/* Step tracker */}
          <div className="reg-step-tracker">
            <div className="reg-step-info">
              <span className="reg-step-label">STEP {step} OF 3: <strong>{stepLabel}</strong></span>
              <span className="reg-step-pct">{stepPercent}% Completed</span>
            </div>
            <div className="reg-step-bar">
              <div className="reg-step-bar-fill" style={{ width: `${stepPercent}%` }} />
            </div>
          </div>

          {/* Heading */}
          <div className="reg-heading">
            <h2>Create your business account</h2>
            <p>Fill in the details below to start your AI-powered retail journey.</p>
          </div>

          {/* Error */}
          {error && <div className="reg-error">{error}</div>}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="reg-form-body">
              {/* Full Name + Email */}
              <div className="reg-row-2">
                <div className="reg-field">
                  <label htmlFor="reg-fullname">Full Name</label>
                  <input
                    id="reg-fullname"
                    type="text"
                    placeholder="John Doe"
                    value={form.full_name}
                    onChange={set("full_name")}
                  />
                </div>
                <div className="reg-field">
                  <label htmlFor="reg-email">Email Address</label>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="john@business.com"
                    value={form.email}
                    onChange={set("email")}
                  />
                </div>
              </div>

              {/* GST Number */}
              <div className="reg-field">
                <label htmlFor="reg-gst">
                  GST Number <span className="reg-label-required">*Required for Tax Invoicing</span>
                </label>
                <div className="reg-gst-row">
                  <input
                    id="reg-gst"
                    type="text"
                    placeholder="22AAAAA0000A1Z5"
                    value={form.gst_number}
                    onChange={(e) => { set("gst_number")(e); setGstValidated(false) }}
                    maxLength={15}
                    className={gstValidated ? "gst-valid" : ""}
                  />
                  <button
                    type="button"
                    className={`reg-validate-btn ${gstValidated ? "validated" : ""}`}
                    onClick={handleValidateGST}
                    disabled={gstValidating || gstValidated}
                  >
                    {gstValidating ? (
                      <Loader2 size={13} className="spin" />
                    ) : gstValidated ? (
                      <><CheckCircle size={13} /> Verified</>
                    ) : (
                      <><ShieldCheck size={13} /> Validate</>
                    )}
                  </button>
                </div>
                <p className="reg-field-hint">Validation ensures immediate access to your merchant dashboard.</p>
              </div>

              {/* Business Category */}
              <div className="reg-field">
                <label htmlFor="reg-category">Business Category</label>
                <div className="reg-select-wrap">
                  <select
                    id="reg-category"
                    value={form.business_category}
                    onChange={set("business_category")}
                  >
                    <option value="">Select your industry</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <svg className="reg-select-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Password */}
              <div className="reg-field">
                <label htmlFor="reg-password">Create Password</label>
                <div className="reg-pass-wrap">
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={set("password")}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="reg-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <label className="reg-terms">
                <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} />
                <span>
                  I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>. I understand RetailMind AI will process my business data to provide analytics.
                </span>
              </label>

              <button type="button" className="reg-cta" onClick={goStep2}>
                Continue to Step 2 <ArrowRight size={16} />
              </button>

              {/* Help */}
              <div className="reg-help">
                <MessageCircle size={16} className="reg-help-icon" />
                <div>
                  <span className="reg-help-title">Need help setting up?</span>
                  <span className="reg-help-sub">Our SME support team is available 24/7. <a href="#">Chat now</a></span>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="reg-form-body">
              <div className="reg-field">
                <label htmlFor="reg-bname">Business / Trade Name <span className="reg-req">*</span></label>
                <input id="reg-bname" type="text" placeholder="Acme Retail Pvt. Ltd." value={form.business_name} onChange={set("business_name")} />
              </div>
              <div className="reg-field">
                <label htmlFor="reg-breg">Business Registration No. <span className="reg-req">*</span></label>
                <input id="reg-breg" type="text" placeholder="CIN / MSME / Shop Act No." value={form.business_reg_number} onChange={set("business_reg_number")} />
              </div>
              <div className="reg-field">
                <label htmlFor="reg-pan">PAN Card Number <span className="reg-optional">(optional)</span></label>
                <input id="reg-pan" type="text" placeholder="ABCDE1234F" value={form.pan_number} onChange={set("pan_number")} maxLength={10} />
              </div>

              <div className="reg-row-btns">
                <button type="button" className="reg-back-btn" onClick={() => { setStep(1); setError("") }}>← Back</button>
                <button type="button" className="reg-cta reg-cta-flex" onClick={goStep3}>
                  Continue to Step 3 <ArrowRight size={16} />
                </button>
              </div>

              <div className="reg-help">
                <MessageCircle size={16} className="reg-help-icon" />
                <div>
                  <span className="reg-help-title">Need help setting up?</span>
                  <span className="reg-help-sub">Our SME support team is available 24/7. <a href="#">Chat now</a></span>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <form className="reg-form-body" onSubmit={handleSubmit}>
              <div className="reg-row-2">
                <div className="reg-field">
                  <label htmlFor="reg-city">City <span className="reg-req">*</span></label>
                  <input id="reg-city" type="text" placeholder="Mumbai" value={form.city} onChange={set("city")} />
                </div>
                <div className="reg-field">
                  <label htmlFor="reg-state">State</label>
                  <input id="reg-state" type="text" placeholder="Maharashtra" value={form.state} onChange={set("state")} />
                </div>
              </div>
              <div className="reg-field">
                <label htmlFor="reg-phone">Phone Number</label>
                <input id="reg-phone" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set("phone")} />
              </div>

              <div className="reg-row-btns">
                <button type="button" className="reg-back-btn" onClick={() => { setStep(2); setError("") }}>← Back</button>
                <button type="submit" className="reg-cta reg-cta-flex" disabled={loading}>
                  {loading ? <Loader2 size={16} className="spin" /> : null}
                  {loading ? "Creating Account…" : <>Create Account <ArrowRight size={16} /></>}
                </button>
              </div>

              <div className="reg-help">
                <MessageCircle size={16} className="reg-help-icon" />
                <div>
                  <span className="reg-help-title">Need help setting up?</span>
                  <span className="reg-help-sub">Our SME support team is available 24/7. <a href="#">Chat now</a></span>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        /* ── Root ── */
        .reg-root {
          display: flex;
          min-height: 100vh;
          width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #0f1923;
        }

        /* ── Left Panel ── */
        .reg-left {
          width: 340px;
          flex-shrink: 0;
          background: #111820;
          display: flex;
          flex-direction: column;
          padding: 40px 36px;
          border-right: 1px solid #1e2d3d;
          position: relative;
          overflow: hidden;
        }

        /* subtle grid bg */
        .reg-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        .reg-left > * { position: relative; z-index: 1; }

        .reg-left-logo {
          margin-bottom: 32px;
        }
        .reg-logo-wrap {
          display: inline-block;
          border-radius: 14px;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(20,60,35,0.90) 0%, rgba(10,35,20,0.95) 100%);
          border: 0.5px solid rgba(71,255,134,0.10);
          box-shadow:
            0 0 18px rgba(71,255,134,0.16),
            0 0 45px rgba(71,255,134,0.05),
            inset 0 0 18px rgba(71,255,134,0.05);
          padding: 3px;
        }
        .reg-logo-img {
          height: 68px;
          width: auto;
          object-fit: contain;
          border-radius: 8px;
          display: block;
          filter:
            drop-shadow(0 0 8px rgba(71,255,134,0.40))
            drop-shadow(0 2px 6px rgba(0,0,0,0.5));
        }

        .reg-left-hero {
          margin-bottom: 32px;
        }
        .reg-left-hero h1 {
          font-size: 30px;
          font-weight: 800;
          color: #fff;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin: 0 0 12px 0;
        }
        .reg-left-blue { color: #47ff86; }
        .reg-left-hero p {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          line-height: 1.65;
          margin: 0;
        }

        .reg-left-features {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 40px;
        }
        .reg-left-feature {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: rgba(255,255,255,0.75);
          font-weight: 500;
        }
        .reg-feature-icon {
          width: 16px;
          height: 16px;
          color: #47ff86;
          flex-shrink: 0;
        }

        .reg-left-trust {
          margin-top: auto;
          padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,0.07);
        }
        .reg-trust-label {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .reg-trust-logos {
          display: flex;
          gap: 12px;
        }
        .reg-trust-logo {
          padding: 6px 14px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.02em;
        }

        .reg-left-footer {
          margin-top: 20px;
          font-size: 11px;
          color: rgba(255,255,255,0.2);
        }

        /* ── Right Panel ── */
        .reg-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #111820;
          overflow-y: auto;
        }

        .reg-right-topnav {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 14px;
          padding: 20px 48px;
          font-size: 13px;
          color: #64748b;
          border-bottom: 1px solid #1e2d3d;
          flex-shrink: 0;
        }
        .reg-login-btn {
          padding: 7px 20px;
          border-radius: 7px;
          border: 1px solid rgba(255,255,255,0.15);
          background: transparent;
          color: #e2e8f0;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .reg-login-btn:hover {
          border-color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.04);
        }

        .reg-right-body {
          flex: 1;
          max-width: 560px;
          width: 100%;
          margin: 0 auto;
          padding: 40px 48px 60px;
        }

        /* Step tracker */
        .reg-step-tracker { margin-bottom: 28px; }
        .reg-step-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .reg-step-label {
          font-size: 11px;
          color: #47ff86;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .reg-step-label strong { color: #47ff86; font-weight: 700; }
        .reg-step-pct { font-size: 12px; color: #64748b; }
        .reg-step-bar {
          height: 3px;
          border-radius: 99px;
          background: rgba(255,255,255,0.07);
          overflow: hidden;
        }
        .reg-step-bar-fill {
          height: 100%;
          border-radius: 99px;
          background: #47ff86;
          transition: width 0.4s ease;
        }

        /* Heading */
        .reg-heading { margin-bottom: 28px; }
        .reg-heading h2 {
          font-size: 26px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
          margin: 0 0 6px 0;
        }
        .reg-heading p {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        /* Error */
        .reg-error {
          padding: 11px 14px;
          border-radius: 8px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          color: #f87171;
          font-size: 13px;
          margin-bottom: 18px;
        }

        /* Form body */
        .reg-form-body {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* Row of 2 */
        .reg-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        /* Field */
        .reg-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .reg-field label {
          font-size: 13px;
          font-weight: 500;
          color: #e2e8f0;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .reg-label-required {
          font-size: 11px;
          font-weight: 600;
          color: #f87171;
        }
        .reg-req { color: #f87171; }
        .reg-optional { font-size: 11px; color: #64748b; font-weight: 400; }

        .reg-field input,
        .reg-field select {
          padding: 12px 14px;
          border-radius: 8px;
          border: 1px solid #1e293b;
          background: #1a2332;
          color: #e2e8f0;
          font-size: 14px;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        .reg-field input::placeholder { color: #334155; }
        .reg-field input:focus,
        .reg-field select:focus {
          border-color: #47ff86;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .reg-field input.gst-valid {
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34,197,94,0.08);
        }
        .reg-field-hint {
          font-size: 11px;
          color: #475569;
          margin: 0;
        }

        /* GST row */
        .reg-gst-row {
          display: flex;
          gap: 10px;
        }
        .reg-gst-row input {
          flex: 1;
          font-family: 'SF Mono', 'Fira Code', monospace;
          letter-spacing: 0.05em;
        }
        .reg-validate-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 16px;
          border-radius: 8px;
          border: none;
          background: #188356ff;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s, opacity 0.15s;
          flex-shrink: 0;
        }
        .reg-validate-btn:hover:not(:disabled) { background: rgb(21, 77, 54); }
        .reg-validate-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .reg-validate-btn.validated { background: #16a34a; }

        /* Select */
        .reg-select-wrap {
          position: relative;
        }
        .reg-select-wrap select {
          appearance: none;
          -webkit-appearance: none;
          padding-right: 36px;
          cursor: pointer;
        }
        .reg-select-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: #475569;
          pointer-events: none;
        }

        /* Password wrap */
        .reg-pass-wrap {
          position: relative;
        }
        .reg-pass-wrap input { padding-right: 44px; }
        .reg-eye {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #475569;
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.15s;
        }
        .reg-eye:hover { color: #94a3b8; }

        /* Terms */
        .reg-terms {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          user-select: none;
        }
        .reg-terms input[type="checkbox"] {
          width: 15px;
          height: 15px;
          border-radius: 4px;
          border: 1px solid #334155;
          background: #1a2332;
          cursor: pointer;
          flex-shrink: 0;
          margin-top: 2px;
          accent-color: #47ff86;
        }
        .reg-terms span {
          font-size: 12px;
          color: rgb(255, 255, 255);
          line-height: 1.55;
        }
        .reg-terms a {
          color: #47ff86;
          text-decoration: none;
        }
        .reg-terms a:hover { color: rgb(21, 77, 54); }

        /* CTA Button */
        .reg-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px 24px;
          border-radius: 8px;
          border: none;
          background: #188356ff;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: -0.01em;
          transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
        }
        .reg-cta:hover:not(:disabled) {
          background: rgb(21, 77, 54);
          box-shadow: 0 8px 24px rgb(36, 61, 51);
          transform: translateY(-1px);
        }
        .reg-cta:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .reg-cta-flex { flex: 1; }

        /* Back + CTA row */
        .reg-row-btns {
          display: flex;
          gap: 10px;
        }
        .reg-back-btn {
          padding: 14px 20px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.12);
          background: transparent;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: border-color 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .reg-back-btn:hover {
          border-color: rgba(255,255,255,0.25);
          color: #e2e8f0;
        }

        /* Help banner */
        .reg-help {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 10px;
          background: rgba(59,130,246,0.06);
          border: 1px solid rgba(59,130,246,0.15);
        }
        .reg-help-icon {
          color: #47ff86;
          flex-shrink: 0;
          margin-top: 2px;
          width: 16px;
          height: 16px;
        }
        .reg-help div {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .reg-help-title {
          font-size: 13px;
          font-weight: 600;
          color: #e2e8f0;
        }
        .reg-help-sub {
          font-size: 12px;
          color: #64748b;
        }
        .reg-help-sub a {
          color: #47ff86;
          text-decoration: none;
          font-weight: 500;
        }
        .reg-help-sub a:hover { color: rgb(21, 77, 54); }

        /* Spin */
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Responsive */
        @media (max-width: 768px) {
          .reg-root { flex-direction: column; }
          .reg-left {
            width: 100%;
            padding: 28px 24px;
          }
          .reg-left-trust, .reg-left-footer { display: none; }
          .reg-right-body { padding: 28px 20px 48px; }
          .reg-right-topnav { padding: 16px 20px; }
          .reg-row-2 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
