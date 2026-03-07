"use client"

import { useState } from "react"
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react"


export default function LoginCard() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [otpMode, setOtpMode] = useState(false)
  const [otp, setOtp] = useState("")
  const [otpToken, setOtpToken] = useState("")

  const [forgotMode, setForgotMode] = useState<false | "request" | "reset">(false)
  const [newPassword, setNewPassword] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      if (forgotMode) {
        if (forgotMode === "request") {
          const res = await fetch(`/api/auth/forgot-password?step=request`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          })
          const data = await res.json()
          if (!res.ok) {
            setError(data.error || "Failed to send reset OTP")
          } else {
            setOtpToken(data.otpToken)
            setForgotMode("reset")
          }
        } else {
          // Reset password step
          const res = await fetch(`/api/auth/forgot-password?step=reset`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp, otpToken, newPassword }),
          })
          const data = await res.json()
          if (!res.ok) {
            setError(data.error || "Password reset failed")
          } else {
            // Success
            setForgotMode(false)
            setOtpMode(false)
            setPassword("")
            setNewPassword("")
            setError("Password reset successfully. Please sign in.")
          }
        }
      } else {
        if (!otpMode) {
          const res = await fetch(`/api/auth/login?step=verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          })
          const data = await res.json()
          if (!res.ok) {
            setError(data.error || "Login failed")
          } else {
            setOtpToken(data.otpToken)
            setOtpMode(true)
          }
        } else {
          const res = await fetch(`/api/auth/login?step=confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp, otpToken }),
          })
          const data = await res.json()
          if (!res.ok) {
            setError(data.error || "OTP Verification failed")
          } else {
            document.cookie = `retailiq_session=${data.token}; path=/; max-age=604800; samesite=lax`;
            window.location.href = "/dashboard"
          }
        }
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-root">
      {/* ── Left Panel: Form ─────────────────────────────────── */}
      <div className="login-left">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-wrap">
            <img
              src="/image copy.png"
              alt="RetailMind AI"
              className="login-logo-img"
            />
          </div>
        </div>

        {/* Heading */}
        <div className="login-heading">
          <h1>{forgotMode ? "Reset Password" : "Welcome Back"}</h1>
          <p>{forgotMode ? "Enter your email to receive a password reset OTP" : "Enter your credentials to access your retail analytics dashboard"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="login-error">{error}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {forgotMode === "request" ? (
            <div className="login-field">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                autoComplete="email"
              />
            </div>
          ) : forgotMode === "reset" ? (
            <>
              <div className="login-field">
                <label htmlFor="login-otp">Verify Email OTP</label>
                <input
                  id="login-otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  required
                  autoComplete="one-time-code"
                  maxLength={6}
                  style={{ textAlign: "center", letterSpacing: "4px", fontSize: "18px", fontWeight: "bold" }}
                />
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
                  An OTP has been sent to your email. Please enter it here.
                </p>
              </div>
              <div className="login-field">
                <label htmlFor="login-new-password">New Password</label>
                <div className="login-password-wrap">
                  <input
                    id="login-new-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="login-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </>
          ) : !otpMode ? (
            <>
              <div className="login-field">
                <label htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="login-field">
                <div className="login-field-header">
                  <label htmlFor="login-password">Password</label>
                  <button type="button" onClick={() => setForgotMode("request")} className="login-forgot bg-transparent border-0 cursor-pointer text-[13px] font-medium transition-colors" style={{ color: "#47ff86" }}>Forgot password?</button>
                </div>
                <div className="login-password-wrap">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Keep me logged in</span>
              </label>
            </>
          ) : (
            <div className="login-field">
              <label htmlFor="login-otp">Verify Email OTP</label>
              <input
                id="login-otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                required
                autoComplete="one-time-code"
                maxLength={6}
                style={{ textAlign: "center", letterSpacing: "4px", fontSize: "18px", fontWeight: "bold" }}
              />
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
                An OTP has been sent to your email. Please enter it here.
              </p>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} className="login-btn">
            {loading ? (
              <Loader2 size={16} className="spin" />
            ) : (
              <>
                {forgotMode === "request" ? "Send Reset OTP" 
                 : forgotMode === "reset" ? "Reset Password" 
                 : otpMode ? "Verify OTP" 
                 : "Sign In & Get OTP"} <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {forgotMode && (
          <button 
            onClick={() => { setForgotMode(false); setError(""); }}
            className="mt-4 text-[13px] text-muted-foreground hover:text-white transition-colors bg-transparent border-0 cursor-pointer w-fit mx-auto"
          >
            ← Back to Login
          </button>
        )}

        {/* Footer link */}
        <p className="login-footer">
          {"Don't have an account? "}
          <a href="/register">Create account</a>
        </p>
      </div>

      {/* ── Right Panel: Background image + animated ECG line ── */}
      <div className="login-right" id="login-hero-panel">
        {/* Background image */}
        <div className="login-right-bg" />

        {/* Dark overlay for readability */}
        <div className="login-right-overlay" />



        {/* Hero text content */}
        <div className="login-hero-content">
          <div className="login-hero-badge" style={{ color: "#47ff86" }}>
            RETAILMIND AI
          </div>
          <h2 className="login-hero-title">
            Predictive<br />
            Inventory<br />
            <span className="login-hero-highlight">at your<br />fingertips.</span>
          </h2>
          <p className="login-hero-desc">
            Harness the power of neural networks to optimize your supply chain and maximize retail performance in real-time.
          </p>
          <div className="login-hero-divider" />

          {/* ── Unified Capability Panel ── */}
          <div className="lf-panel">

            {/* Row 1 */}
            <div className="lf-row" style={{ animationDelay: "0ms" }}>
              <div className="lf-accent" />
              <span className="lf-num">01</span>
              <div className="lf-info">
                <span className="lf-title">Demand Intelligence</span>
                <span className="lf-desc">AI-powered forecasting that prevents stockouts before they happen</span>
              </div>
              <div className="lf-ico" style={{ background: "rgba(71,255,134,0.07)", border: "1px solid rgba(71,255,134,0.15)" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="9.5" width="3" height="5" rx="1" fill="#47ff86" opacity="0.35"/>
                  <rect x="6" y="6" width="3" height="8.5" rx="1" fill="#47ff86" opacity="0.65"/>
                  <rect x="11" y="2" width="3" height="12.5" rx="1" fill="#47ff86"/>
                  <path d="M2 9L6.5 5.5L11 7.5L15 2" stroke="#47ff86" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="15" cy="2" r="1.2" fill="#47ff86"/>
                </svg>
              </div>
            </div>

            <div className="lf-divider" />

            {/* Row 2 */}
            <div className="lf-row" style={{ animationDelay: "75ms" }}>
              <div className="lf-accent" />
              <span className="lf-num">02</span>
              <div className="lf-info">
                <span className="lf-title">GST &amp; Billing</span>
                <span className="lf-desc">Automated compliance tracking &amp; real-time invoice insights</span>
              </div>
              <div className="lf-ico" style={{ background: "rgba(96,165,250,0.07)", border: "1px solid rgba(96,165,250,0.15)" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="1.5" width="10" height="13" rx="2" stroke="#60a5fa" strokeWidth="1.3" fill="rgba(96,165,250,0.05)"/>
                  <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" stroke="#60a5fa" strokeWidth="1.1" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            <div className="lf-divider" />

            {/* Row 3 */}
            <div className="lf-row" style={{ animationDelay: "150ms" }}>
              <div className="lf-accent" />
              <span className="lf-num">03</span>
              <div className="lf-info">
                <span className="lf-title">Retail Copilot</span>
                <span className="lf-desc">Conversational AI trained on your live business data</span>
              </div>
              <div className="lf-ico" style={{ background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.15)" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4a1.5 1.5 0 011.5-1.5h9A1.5 1.5 0 0114 4v6a1.5 1.5 0 01-1.5 1.5H8.5L6 13.5V11.5H3.5A1.5 1.5 0 012 10V4z" stroke="#a78bfa" strokeWidth="1.3" fill="rgba(167,139,250,0.06)"/>
                  <circle cx="5.5" cy="7" r="0.9" fill="#a78bfa"/>
                  <circle cx="8" cy="7" r="0.9" fill="#a78bfa"/>
                  <circle cx="10.5" cy="7" r="0.9" fill="#a78bfa"/>
                </svg>
              </div>
            </div>

            <div className="lf-divider" />

            {/* Row 4 */}
            <div className="lf-row" style={{ animationDelay: "225ms" }}>
              <div className="lf-accent" />
              <span className="lf-num">04</span>
              <div className="lf-info">
                <span className="lf-title">Risk &amp; Churn</span>
                <span className="lf-desc">Early signals for supplier issues &amp; customer attrition</span>
              </div>
              <div className="lf-ico" style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.15)" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="#fbbf24" strokeWidth="1.3"/>
                  <circle cx="8" cy="8" r="3.2" stroke="#fbbf24" strokeWidth="0.9" opacity="0.4"/>
                  <circle cx="8" cy="8" r="1.2" fill="#fbbf24"/>
                  <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14" stroke="#fbbf24" strokeWidth="0.9" strokeLinecap="round" opacity="0.4"/>
                </svg>
              </div>
            </div>

          </div>

        </div>
      </div>

      <style>{`
        /* ── Root ── */
        .login-root {
          display: flex;
          min-height: 100vh;
          width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #0f1923;
        }

        /* ── Left Panel ── */
        .login-left {
          width: 100%;
          max-width: 600px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 64px 72px;
          background: #111820;
          flex-shrink: 0;
        }

        /* Logo */
        .login-logo {
          margin-bottom: 32px;
        }
        .login-logo-wrap {
          display: inline-block;
          border-radius: 16px;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(20,60,35,0.90) 0%, rgba(10,35,20,0.95) 100%);
          border: 0.5px solid rgba(71,255,134,0.10);
          box-shadow:
            0 0 20px rgba(71,255,134,0.18),
            0 0 50px rgba(71,255,134,0.06),
            inset 0 0 20px rgba(71,255,134,0.06);
          padding: 3px;
        }
        .login-logo-img {
          height: 76px;
          width: auto;
          object-fit: contain;
          border-radius: 10px;
          display: block;
          filter:
            drop-shadow(0 0 10px rgba(71,255,134,0.45))
            drop-shadow(0 2px 8px rgba(0,0,0,0.5));
        }

        /* Heading */
        .login-heading { margin-bottom: 32px; }
        .login-heading h1 {
          font-size: 32px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
          margin: 0 0 8px 0;
          line-height: 1.1;
        }
        .login-heading p {
          font-size: 14px;
          color: #94a3b8;
          margin: 0;
          line-height: 1.5;
        }

        /* Error */
        .login-error {
          margin-bottom: 16px;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13px;
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.3);
          color: #f87171;
        }

        /* Form */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .login-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .login-field label {
          font-size: 13px;
          font-weight: 500;
          color: #e2e8f0;
        }
        .login-field-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .login-forgot {
          font-size: 13px;
          color: #47ff86;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
        }
        .login-forgot:hover { color: #2a9e53ff; }

        .login-field input {
          width: 100%;
          padding: 13px 16px;
          border-radius: 8px;
          border: 1px solid #1e293b;
          background: #1a2332;
          color: #e2e8f0;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }
        .login-field input::placeholder { color: #475569; }
        .login-field input:focus {
          border-color: #47ff86;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
        }
        .login-password-wrap { position: relative; }
        .login-password-wrap input { padding-right: 44px; }
        .login-eye {
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
        .login-eye:hover { color: #94a3b8; }

        /* Remember me */
        .login-remember {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
        }
        .login-remember input[type="checkbox"] {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1px solid #334155;
          background: #1a2332;
          cursor: pointer;
          flex-shrink: 0;
          accent-color: #47ff86;
        }
        .login-remember span { font-size: 13px; color: #94a3b8; }

        /* Submit Button */
        .login-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px 24px;
          border-radius: 8px;
          border: none;
          background: #188356ff;
          color: #ffffff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
          letter-spacing: -0.01em;
          margin-top: 4px;
        }
        .login-btn:hover:not(:disabled) {
          background: #105b3cff;
          box-shadow: 0 8px 24px #3a4e41ff;
          transform: translateY(-1px);
        }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer */
        .login-footer {
          margin-top: 28px;
          font-size: 13px;
          color: #fcfdfdff;
          text-align: center;
        }
        .login-footer a {
          color: #47ff86;
          text-decoration: none;
          font-weight: 500;
        }
        .login-footer a:hover { color: #24b375ff; }

        /* ── Right Panel ── */
        .login-right {
          flex: 1;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          padding: 56px 44px;
        }

        /* Actual background image */
        .login-right-bg {
          position: absolute;
          inset: 0;
          background-image: url('/image.png');
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;
        }

        /* Dark overlay for text readability */
        .login-right-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(0, 5, 15, 0.88) 0%,
            rgba(0, 10, 20, 0.50) 45%,
            rgba(0, 5, 10, 0.15) 100%
          );
          z-index: 1;
        }


        /* Hero Content */
        .login-hero-content {
          position: relative;
          z-index: 3;
          max-width: 520px;
          width: 100%;
        }

        .login-hero-badge {
          display: inline-flex;
          align-items: center;
          padding: 5px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(8px);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.75);
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .login-hero-title {
          font-size: 48px;
          font-weight: 800;
          line-height: 1.05;
          color: #ffffff;
          letter-spacing: -0.03em;
          margin: 0 0 16px 0;
        }
        .login-hero-highlight { color: #47ff86; }

        .login-hero-desc {
          font-size: 15px;
          color: rgba(255,255,255,0.65);
          line-height: 1.65;
          margin: 0 0 24px 0;
          max-width: 360px;
        }

        .login-hero-divider {
          width: 100%;
          height: 1px;
          background: rgba(255,255,255,0.10);
          margin-bottom: 20px;
        }

        /* ─────────────────────────────────────────────────
           UNIFIED CAPABILITY PANEL  (professional row list)
        ───────────────────────────────────────────────── */
        @keyframes lfUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Outer container – one unified glass panel */
        .lf-panel {
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          overflow: hidden;
          background: rgba(4,12,8,0.55);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 0 0 1px rgba(71,255,134,0.04) inset,
                      0 24px 48px rgba(0,0,0,0.3);
        }

        /* Each row */
        .lf-row {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          cursor: default;
          transition: background 0.18s ease;
          animation: lfUp 0.4s ease both;
          overflow: hidden;
        }
        .lf-row:hover {
          background: rgba(71,255,134,0.04);
        }
        .lf-row:hover .lf-accent {
          transform: scaleY(1);
          opacity: 1;
        }

        /* Sliding green left-edge accent */
        .lf-accent {
          position: absolute;
          left: 0; top: 6px; bottom: 6px;
          width: 2.5px;
          background: linear-gradient(180deg, #47ff86 0%, rgba(71,255,134,0.3) 100%);
          border-radius: 0 2px 2px 0;
          transform: scaleY(0);
          opacity: 0;
          transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease;
          transform-origin: center;
        }

        /* Monospace row number */
        .lf-num {
          font-size: 10px;
          font-weight: 800;
          color: rgba(71,255,134,0.28);
          font-family: 'SF Mono', 'Courier New', monospace;
          letter-spacing: 0.04em;
          flex-shrink: 0;
          width: 18px;
          user-select: none;
          transition: color 0.18s ease;
        }
        .lf-row:hover .lf-num {
          color: rgba(71,255,134,0.55);
        }

        /* Text block */
        .lf-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .lf-title {
          font-size: 12.5px;
          font-weight: 700;
          color: rgba(255,255,255,0.87);
          letter-spacing: -0.02em;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .lf-row:hover .lf-title {
          color: rgba(255,255,255,0.97);
        }
        .lf-desc {
          font-size: 10.5px;
          color: rgba(255,255,255,0.28);
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.18s ease;
        }
        .lf-row:hover .lf-desc {
          color: rgba(255,255,255,0.42);
        }

        /* Icon on the right */
        .lf-ico {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: filter 0.18s ease, transform 0.18s ease;
        }
        .lf-row:hover .lf-ico {
          filter: brightness(1.25);
          transform: scale(1.06);
        }

        /* Hairline divider */
        .lf-divider {
          height: 1px;
          background: rgba(255,255,255,0.055);
          margin: 0 16px;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .login-right { display: none; }
          .login-left { max-width: 100%; padding: 40px 24px; }
        }
      `}</style>
    </div>
  )
}
