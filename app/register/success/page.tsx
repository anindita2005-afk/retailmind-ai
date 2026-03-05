"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, BarChart3, Copy } from "lucide-react"
import { useState, Suspense } from "react"

function RegisterSuccessContent() {
  const params = useSearchParams()
  const displayId = params.get("id") || "RIQ-0000"
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(displayId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="rounded-2xl border p-10 max-w-md w-full mx-4 text-center"
      style={{ background: "rgba(6,13,31,0.95)", borderColor: "rgba(0,212,255,0.2)", backdropFilter: "blur(20px)", boxShadow: "0 0 60px rgba(0,212,255,0.1)" }}
    >
      <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "rgba(0,212,255,0.12)", border: "2px solid rgba(0,212,255,0.3)" }}>
        <CheckCircle2 className="w-8 h-8" style={{ color: "#00d4ff" }} />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2 font-sans">Account Created!</h1>
      <p className="text-sm mb-6" style={{ color: "rgba(148,163,184,0.7)" }}>
        Your business account has been registered. Save your unique User ID below.
      </p>

      <div className="rounded-xl p-4 mb-6 flex items-center justify-between gap-3" style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.2)" }}>
        <div className="text-left">
          <p className="text-xs font-medium mb-1" style={{ color: "rgba(148,163,184,0.7)" }}>Your RetailIQ User ID</p>
          <p className="text-xl font-bold font-mono" style={{ color: "#00d4ff" }}>{displayId}</p>
        </div>
        <button
          onClick={copy}
          className="p-2 rounded-lg transition-all"
          style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff" }}
          aria-label="Copy User ID"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
      {copied && <p className="text-xs mb-4" style={{ color: "#00d4ff" }}>Copied to clipboard!</p>}

      <div className="flex items-center gap-2 mb-6 text-xs rounded-lg px-3 py-2.5" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", color: "rgba(234,179,8,0.9)" }}>
        <BarChart3 className="w-4 h-4 flex-shrink-0" />
        <span>Please verify your email before logging in. Check your inbox.</span>
      </div>

      <Link
        href="/login"
        className="block w-full py-2.5 rounded-lg text-sm font-semibold text-center transition-all"
        style={{ background: "rgba(0,212,255,0.9)", color: "#060d1f" }}
      >
        Go to Login
      </Link>
    </div>
  )
}

export default function RegisterSuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: "#060d1f" }}>
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <RegisterSuccessContent />
      </Suspense>
    </main>
  )
}
