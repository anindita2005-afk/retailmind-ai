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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      if (!otpMode) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/auth/login?step=verify`, {
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/auth/login?step=confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp, otpToken }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "OTP Verification failed")
        } else {
          window.location.href = "/dashboard"
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
          <h1>Welcome Back</h1>
          <p>Enter your credentials to access your retail analytics dashboard</p>
        </div>

        {/* Error */}
        {error && (
          <div className="login-error">{error}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {!otpMode ? (
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
                  <a href="#" className="login-forgot">Forgot password?</a>
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
                {otpMode ? "Verify OTP" : "Sign In & Get OTP"} <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

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
          <div className="login-hero-badge">NEW FEATURE AVAILABLE</div>
          <h2 className="login-hero-title">
            Predictive<br />
            Inventory<br />
            <span className="login-hero-highlight">at your<br />fingertips.</span>
          </h2>
          <p className="login-hero-desc">
            Harness the power of neural networks to optimize your supply chain and maximize retail performance in real-time.
          </p>
          <div className="login-hero-divider" />
          <div className="login-hero-stats">
            <div className="login-stat">
              <span className="login-stat-value">24%</span>
              <span className="login-stat-label">Average ROI increase</span>
            </div>
            <div className="login-stat">
              <span className="login-stat-value">12k+</span>
              <span className="login-stat-label">Stores optimized daily</span>
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
          padding: 56px 64px;
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
          max-width: 420px;
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
          background: rgba(255,255,255,0.12);
          margin-bottom: 24px;
        }

        .login-hero-stats { display: flex; gap: 48px; }
        .login-stat { display: flex; flex-direction: column; gap: 4px; }
        .login-stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .login-stat-label { font-size: 12px; color: rgba(255,255,255,0.5); }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .login-right { display: none; }
          .login-left { max-width: 100%; padding: 40px 24px; }
        }
      `}</style>
    </div>
  )
}
