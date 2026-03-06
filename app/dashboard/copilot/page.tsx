"use client"

import { useChat } from "ai/react"
import { useRef, useEffect, useState, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import {
  Send, Bot, User, Loader2, Plus, Trash2, Download,
  MessageSquare, Zap, ShoppingCart, Package, TrendingUp,
  FileText, Users, BarChart2, ChevronRight, Mic, Paperclip,
  AlertTriangle, Cpu, Copy, Check,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────
interface SessionMeta {
  id: string; title: string; createdAt: string; updatedAt: string
  provider?: string; messageCount: number; preview: string
}
interface DashStats {
  products?: number; lowStock?: number
  monthly?: { month: string; revenue: number; profit: number }[]
}

// ─── Constants ───────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { icon: Zap, text: "What GST rate applies to mobile phones?" },
  { icon: TrendingUp, text: "How to improve my profit margins in retail?" },
  { icon: ShoppingCart, text: "Best e-commerce platforms to sell in India" },
  { icon: Package, text: "How to handle slow-moving inventory?" },
  { icon: FileText, text: "Explain GSTR-1 filing process" },
  { icon: Users, text: "Tips for negotiating with suppliers" },
]

const QUICK_PROMPTS = [
  "Analyse my slow-moving SKUs",
  "Draft a supplier negotiation email",
  "Calculate my GST liability",
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
const genId = () => `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
const titleFromMsg = (t: string) => t.slice(0, 44).trim() + (t.length > 44 ? "…" : "")

function formatDate(iso: string) {
  const d = new Date(iso), now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return "Today"
  if (diff === 1) return "Yesterday"
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

function formatMsgTime(date: Date | undefined) {
  if (!date) return ""
  return new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
}

function providerColor(p: string) {
  if (p.includes("Gemini")) return "#47ff86"
  if (p.includes("Groq")) return "#f59e0b"
  if (p.includes("Puter")) return "#a78bfa"
  return "#94a3b8"
}

// Server-side fallback handles Puter now

// ─── Export helpers ───────────────────────────────────────────────────────────
function buildMarkdownExport(
  title: string,
  messages: { role: string; content: string; createdAt?: Date }[]
) {
  const now = new Date().toLocaleString("en-IN", {
    dateStyle: "long", timeStyle: "short",
  })
  const header = `# RetailIQ Copilot — ${title}\n_Exported on ${now}_\n\n---\n\n`
  const body = messages.map((m) => {
    const who = m.role === "user" ? "**You**" : "**RetailIQ Copilot**"
    const ts = m.createdAt ? `  \n_${formatMsgTime(m.createdAt)}_` : ""
    return `${who}${ts}\n\n${m.content}`
  }).join("\n\n---\n\n")
  return header + body
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement("a"), { href: url, download: filename })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CopilotPage() {
  const [sessionId, setSessionId] = useState(genId)
  const [sessionTitle, setSessionTitle] = useState("New Chat")
  const [sessions, setSessions] = useState<SessionMeta[]>([])
  const [sessionsLoad, setSessionsLoad] = useState(true)
  const [stats, setStats] = useState<DashStats>({})
  const [statsLoad, setStatsLoad] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeProvider, setActiveProvider] = useState("Gemini 2.5 Flash")
  const [copied, setCopied] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Tracks how many type-2 data items we've already processed to avoid
  // re-running on every streaming text chunk (which recreates the array ref)
  const dataLenRef = useRef(0)



  const {
    messages, input, handleInputChange, handleSubmit,
    isLoading, append, setMessages, error, data,
  } = useChat({
    api: "/api/chat",
    body: { sessionId },
    onFinish() {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(persistSession, 800)
    },
  })

  // Track active provider from type-2 data chunks.
  // Guard with dataLenRef so we only act when the array genuinely grows,
  // NOT on every re-render where SWR hands us a new array reference.
  useEffect(() => {
    const arr = data as any[] | undefined
    if (!arr?.length || arr.length <= dataLenRef.current) return
    dataLenRef.current = arr.length
    const last = arr[arr.length - 1]
    if (last?.provider) setActiveProvider(String(last.provider))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-title from first user message
  useEffect(() => {
    if (messages.length > 0 && sessionTitle === "New Chat") {
      const first = messages.find(m => m.role === "user")
      if (first) setSessionTitle(titleFromMsg(first.content))
    }
  }, [messages, sessionTitle])

  // Initial data fetch
  useEffect(() => { fetchSessions(); fetchStats() }, [])

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchSessions = async () => {
    setSessionsLoad(true)
    try {
      const r = await fetch(`/api/chat/history`)
      if (r.ok) setSessions((await r.json()).sessions ?? [])
    } finally { setSessionsLoad(false) }
  }

  const fetchStats = async () => {
    setStatsLoad(true)
    try {
      const r = await fetch(`/api/dashboard/stats`)
      if (r.ok) setStats(await r.json())
    } finally { setStatsLoad(false) }
  }

  // ── Session persistence ───────────────────────────────────────────────────
  const persistSession = useCallback(async () => {
    if (!messages.length) return
    setSaving(true)
    try {
      const sessionData = {
        id: sessionId, title: sessionTitle,
        messages: messages.map(m => ({
          id: m.id, role: m.role, content: m.content,
          createdAt: m.createdAt?.toISOString?.() ?? new Date().toISOString(),
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        provider: activeProvider,
      }
      await fetch(`/api/chat/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", sessionId, sessionData }),
      })
      await fetchSessions()
    } finally { setSaving(false) }
  }, [messages, sessionId, sessionTitle, activeProvider])



  // ── New chat ──────────────────────────────────────────────────────────────
  const handleNewChat = () => {
    if (messages.length) persistSession()
    setSessionId(genId()); setSessionTitle("New Chat"); setMessages([])
    setActiveProvider("Gemini 2.5 Flash")
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // ── Load existing session ─────────────────────────────────────────────────
  const handleLoadSession = async (meta: SessionMeta) => {
    if (messages.length) persistSession()
    const r = await fetch(`/api/chat/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get", sessionId: meta.id }),
    })
    if (!r.ok) return
    const { session } = await r.json()
    if (!session) return
    setSessionId(meta.id); setSessionTitle(meta.title)
    setMessages(session.messages.map((m: any) => ({ ...m, createdAt: new Date(m.createdAt) })))
    if (meta.provider) setActiveProvider(meta.provider)
  }

  // ── Delete session ────────────────────────────────────────────────────────
  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await fetch(`/api/chat/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", sessionId: id }),
    })
    setSessions(prev => prev.filter(s => s.id !== id))
    if (id === sessionId) handleNewChat()
  }

  // ── Export session ────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!messages.length) return
    const md = buildMarkdownExport(sessionTitle, messages)
    const safe = sessionTitle.replace(/[^a-z0-9_\-]/gi, "_").replace(/_+/g, "_")
    downloadFile(md, `RetailIQ_${safe}_${Date.now()}.md`, "text/markdown;charset=utf-8")
  }

  // ── Copy message ─────────────────────────────────────────────────────────
  const copyMsg = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopied(id)
    setTimeout(() => setCopied(null), 1800)
  }

  // ── Derived KPIs ──────────────────────────────────────────────────────────
  const invHealth = stats.products
    ? Math.max(0, Math.min(100, ((stats.products - (stats.lowStock ?? 0)) / stats.products) * 100))
    : null
  const months = stats.monthly ?? []
  const last = months[months.length - 1], prev = months[months.length - 2]
  const revGrowth = last && prev && prev.revenue > 0
    ? (((last.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1)
    : null

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#080d0b", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ═══ LEFT SIDEBAR ═══ */}
      <aside className="flex flex-col flex-shrink-0" style={{ width: 216, borderRight: "1px solid rgba(71,255,134,0.08)", background: "#080d0b" }}>

        {/* New Chat */}
        <div className="p-3 flex-shrink-0">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 active:scale-95"
            style={{ background: "rgba(71,255,134,0.13)", border: "1px solid rgba(71,255,134,0.35)", color: "#47ff86" }}
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto px-2 pb-3" style={{ scrollbarWidth: "none" }}>
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] mb-2 px-1" style={{ color: "rgba(71,255,134,0.35)" }}>
            Recent Chats
          </p>

          {sessionsLoad ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "rgba(71,255,134,0.35)" }} />
            </div>
          ) : !sessions.length ? (
            <p className="text-[11px] px-2 py-3" style={{ color: "rgba(148,163,184,0.35)" }}>No previous chats</p>
          ) : (
            sessions.map(s => (
              <div
                key={s.id}
                onClick={() => handleLoadSession(s)}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === "Enter" && handleLoadSession(s)}
                className="group w-full text-left rounded-lg px-2.5 py-2 mb-0.5 flex items-start gap-2 cursor-pointer transition-all"
                style={{
                  background: s.id === sessionId ? "rgba(71,255,134,0.07)" : "transparent",
                  border: s.id === sessionId ? "1px solid rgba(71,255,134,0.18)" : "1px solid transparent",
                }}
              >
                <MessageSquare className="w-3 h-3 mt-1 flex-shrink-0" style={{ color: s.id === sessionId ? "#47ff86" : "rgba(148,163,184,0.4)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate" style={{ color: s.id === sessionId ? "#e2e8f0" : "rgba(148,163,184,0.7)" }}>{s.title}</p>
                  <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: "rgba(148,163,184,0.35)" }}>
                    {formatDate(s.updatedAt)}
                    {s.provider && <span>· {s.provider.split(" ")[0]}</span>}
                  </p>
                </div>
                <button
                  onClick={e => deleteSession(e, s.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all flex-shrink-0"
                  style={{ color: "#ef4444" }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ═══ MAIN CHAT ═══ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(71,255,134,0.08)", background: "rgba(8,13,11,0.96)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0" style={{ border: "1px solid rgba(71,255,134,0.25)", boxShadow: "0 0 10px rgba(71,255,134,0.15)" }}>
              <img src="/copilot-logo.png" alt="RetailIQ Copilot" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight" style={{ color: "#e2e8f0" }}>
                Active Session: {sessionTitle}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                  style={{
                    background: `${providerColor(activeProvider)}14`,
                    border: `1px solid ${providerColor(activeProvider)}30`,
                    color: providerColor(activeProvider),
                  }}
                >
                  {activeProvider}
                </span>
                <span className="text-[10px]" style={{ color: "rgba(148,163,184,0.4)" }}>
                  {saving ? "Saving to S3…" : "Auto-saved"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={() => deleteSession({ stopPropagation: () => { } } as any, sessionId)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:brightness-110"
                style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
              >
                <Trash2 className="w-3 h-3" /> Delete Chat
              </button>
            )}
            <button
              onClick={handleExport}
              disabled={!messages.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "rgba(71,255,134,0.12)", border: "1px solid rgba(71,255,134,0.3)", color: "#47ff86" }}
            >
              <Download className="w-3.5 h-3.5" /> Export Session
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(71,255,134,0.1) transparent" }}>
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)", color: "#f87171" }}>
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {error.message || "Connection error. Please try again."}
            </div>
          )}

          {messages.length === 0 ? (
            /* ── Welcome ── */
            <div className="flex flex-col items-center justify-center flex-1 gap-6">
              {/* Robot Logo */}
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl overflow-hidden" style={{ boxShadow: "0 0 40px rgba(71,255,134,0.25), 0 0 80px rgba(71,255,134,0.1)" }}>
                  <img src="/copilot-logo.png" alt="RetailIQ Copilot" className="w-full h-full object-cover" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full" style={{ background: "#47ff86", border: "2px solid #080d0b", boxShadow: "0 0 6px #47ff86" }} />
              </div>
              <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                  <span style={{ color: "#c8e6d4" }}>RetailIQ </span>
                  <span style={{ color: "#47ff86" }}>Copilot</span>
                </h1>
                <p className="text-sm max-w-md mx-auto" style={{ color: "rgba(148,163,184,0.65)" }}>
                  Your AI assistant for Indian retail business — GST, market intelligence, pricing, and growth strategies.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 w-full max-w-2xl">
                {SUGGESTIONS.map(({ icon: Icon, text }) => (
                  <button
                    key={text}
                    onClick={() => append({ role: "user", content: text })}
                    className="flex items-start gap-3 px-4 py-4 rounded-2xl text-sm text-left transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
                    style={{ background: "rgba(15,42,28,0.45)", border: "1px solid rgba(71,255,134,0.1)", color: "rgba(203,213,225,0.85)" }}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(71,255,134,0.09)" }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: "#47ff86" }} />
                    </div>
                    <span className="font-medium leading-snug">{text}</span>
                  </button>
                ))}
              </div>
            </div>

          ) : (
            <>
              {messages.map((m, i) => (
                <div key={m.id || i} className={`group flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  {/* Avatar */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={m.role === "user"
                      ? { background: "rgba(71,255,134,0.12)", border: "1px solid rgba(71,255,134,0.2)" }
                      : { background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }
                    }
                  >
                    {m.role === "user"
                      ? <User className="w-3.5 h-3.5" style={{ color: "#47ff86" }} />
                      : <img src="/copilot-logo.png" alt="AI" className="w-full h-full object-cover rounded-lg" />
                    }
                  </div>

                  {/* Bubble */}
                  <div className="max-w-[76%] flex flex-col gap-1">
                    <div
                      className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${m.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                      style={m.role === "user"
                        ? { background: "rgba(71,255,134,0.08)", color: "#dde9e0", border: "1px solid rgba(71,255,134,0.13)" }
                        : { background: "rgba(17,24,39,0.75)", color: "#d1d9e0", border: "1px solid rgba(255,255,255,0.055)" }
                      }
                    >
                      {m.role === "assistant" ? (
                        <div className="prose-sm" style={{ color: "#d1d9e0" }}>
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-0.5">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-0.5">{children}</ol>,
                              li: ({ children }) => <li className="text-[13px]">{children}</li>,
                              strong: ({ children }) => <strong style={{ color: "#47ff86", fontWeight: 600 }}>{children}</strong>,
                              em: ({ children }) => <em style={{ color: "#94a3b8" }}>{children}</em>,
                              code: ({ children }) => <code className="px-1.5 py-0.5 rounded text-[12px]" style={{ background: "rgba(71,255,134,0.08)", color: "#86efac", fontFamily: "monospace" }}>{children}</code>,
                              pre: ({ children }) => <pre className="p-3 rounded-lg my-2 overflow-x-auto text-[12px]" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(71,255,134,0.1)" }}>{children}</pre>,
                              h1: ({ children }) => <h1 className="text-base font-bold mb-1" style={{ color: "#e2e8f0" }}>{children}</h1>,
                              h2: ({ children }) => <h2 className="text-sm font-bold mb-1" style={{ color: "#e2e8f0" }}>{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-semibold mb-1" style={{ color: "#e2e8f0" }}>{children}</h3>,
                            }}
                          >
                            {m.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <span>{m.content}</span>
                      )}
                    </div>

                    {/* Timestamp + copy */}
                    <div className={`flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                      <span className="text-[10px]" style={{ color: "rgba(148,163,184,0.4)" }}>
                        {formatMsgTime(m.createdAt)}
                      </span>
                      {m.role === "assistant" && (
                        <button onClick={() => copyMsg(m.id, m.content)} className="flex items-center gap-1 text-[10px] transition-colors" style={{ color: "rgba(148,163,184,0.4)" }}>
                          {copied === m.id
                            ? <><Check className="w-3 h-3" style={{ color: "#47ff86" }} /> Copied</>
                            : <><Copy className="w-3 h-3" /> Copy</>
                          }
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0" style={{ border: "1px solid rgba(71,255,134,0.2)", boxShadow: "0 0 8px rgba(71,255,134,0.15)" }}>
                    <img src="/copilot-logo.png" alt="AI" className="w-full h-full object-cover" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-center gap-3" style={{ background: "rgba(17,24,39,0.75)", border: "1px solid rgba(255,255,255,0.055)" }}>
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "#47ff86", opacity: 0.5, animation: `copilotBounce 1.1s ease-in-out ${i * 0.18}s infinite` }} />
                      ))}
                    </div>
                    <span className="text-[11px]" style={{ color: "rgba(148,163,184,0.45)" }}>
                      {activeProvider} is thinking…
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-5 pb-4 pt-2" style={{ borderTop: "1px solid rgba(71,255,134,0.06)" }}>
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
            style={{ background: "rgba(15,23,42,0.65)", border: "1px solid rgba(71,255,134,0.14)" }}
          >
            <button type="button" className="p-1 rounded-lg opacity-30 hover:opacity-60 transition-opacity flex-shrink-0">
              <Paperclip className="w-4 h-4" style={{ color: "#94a3b8" }} />
            </button>
            <button type="button" className="p-1 rounded-lg opacity-30 hover:opacity-60 transition-opacity flex-shrink-0">
              <Mic className="w-4 h-4" style={{ color: "#94a3b8" }} />
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && !isLoading && input.trim() && handleSubmit(e as any)}
              placeholder="Ask anything about your retail business..."
              className="flex-1 bg-transparent text-[13px] outline-none py-1"
              style={{ color: "#e2e8f0" }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-110 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
              style={{ background: "#47ff86", color: "#04200f" }}
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </form>
          <p className="text-center text-[10px] mt-2" style={{ color: "rgba(148,163,184,0.25)" }}>
            RetailIQ can make mistakes. Verify important financial data.
          </p>
        </div>
      </div>

      {/* ═══ RIGHT PANEL ═══ */}
      <aside
        className="flex flex-col flex-shrink-0 gap-2.5 p-3 overflow-y-auto"
        style={{ width: 214, borderLeft: "1px solid rgba(71,255,134,0.08)", background: "#080d0b", scrollbarWidth: "none" }}
      >
        {/* Market Focus */}
        <div className="rounded-xl p-3" style={{ background: "rgba(12,28,20,0.6)", border: "1px solid rgba(71,255,134,0.08)" }}>
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] mb-2.5" style={{ color: "rgba(71,255,134,0.4)" }}>Market Focus</p>
          <div className="flex items-center gap-2 mb-1.5">
            <BarChart2 className="w-3.5 h-3.5" style={{ color: "#47ff86" }} />
            <span className="text-[11px] font-semibold" style={{ color: "#d1fae5" }}>Indian Retail</span>
            <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#47ff86", boxShadow: "0 0 5px #47ff86" }} />
          </div>
          <p className="text-[10px] leading-relaxed" style={{ color: "rgba(148,163,184,0.4)" }}>
            Live data from your RetailMind inventory &amp; billing records
          </p>
        </div>

        {/* Live KPIs */}
        <div className="rounded-xl p-3" style={{ background: "rgba(12,28,20,0.6)", border: "1px solid rgba(71,255,134,0.08)" }}>
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: "rgba(71,255,134,0.4)" }}>Live KPIs</p>

          {/* Inventory Health */}
          <div className="mb-4">
            <p className="text-[9px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: "rgba(148,163,184,0.45)" }}>Inventory Health</p>
            {statsLoad ? (
              <div className="h-9 rounded-lg animate-pulse" style={{ background: "rgba(71,255,134,0.04)" }} />
            ) : (
              <>
                <p className="text-2xl font-bold tabular-nums" style={{ color: "#e2e8f0" }}>
                  {invHealth !== null ? `${invHealth.toFixed(1)}%` : "—"}
                </p>
                <div className="flex justify-between items-center text-[10px] mt-0.5 mb-1.5">
                  <span style={{ color: "rgba(148,163,184,0.4)" }}>{stats.lowStock ?? 0} low stock</span>
                  {(stats.lowStock ?? 0) > 0 && (
                    <span className="flex items-center gap-1" style={{ color: "#fbbf24" }}>
                      <AlertTriangle className="w-2.5 h-2.5" /> Alert
                    </span>
                  )}
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${invHealth ?? 0}%`,
                      background: (invHealth ?? 0) > 70 ? "#47ff86" : (invHealth ?? 0) > 40 ? "#fbbf24" : "#ef4444",
                      transition: "width 1s ease",
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Revenue Growth */}
          <div>
            <p className="text-[9px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: "rgba(148,163,184,0.45)" }}>Revenue Growth</p>
            {statsLoad ? (
              <div className="h-9 rounded-lg animate-pulse" style={{ background: "rgba(71,255,134,0.04)" }} />
            ) : (
              <>
                <p className="text-2xl font-bold tabular-nums" style={{ color: revGrowth ? (parseFloat(revGrowth) >= 0 ? "#47ff86" : "#ef4444") : "#e2e8f0" }}>
                  {revGrowth !== null ? `${parseFloat(revGrowth) >= 0 ? "+" : ""}${revGrowth}%` : "—"}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(148,163,184,0.35)" }}>vs last 30 days</p>
              </>
            )}
          </div>
        </div>

        {/* Top Strategies */}
        <div className="rounded-xl p-3" style={{ background: "rgba(12,28,20,0.6)", border: "1px solid rgba(71,255,134,0.08)" }}>
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] mb-2.5" style={{ color: "rgba(71,255,134,0.4)" }}>Top Strategies</p>
          {[
            { title: "Dynamic Pricing Hack", desc: "Adjust markup based on footfall trends to boost margins." },
            { title: "GST Reconciliation", desc: "Reconcile GSTR-2B monthly to catch ITC mismatches." },
            { title: "Reorder Automation", desc: "Set reorder points for top 20% SKUs by velocity." },
          ].map(s => (
            <div key={s.title} className="mb-2 last:mb-0 rounded-lg p-2" style={{ background: "rgba(71,255,134,0.03)", border: "1px solid rgba(71,255,134,0.07)" }}>
              <p className="text-[11px] font-semibold mb-0.5" style={{ color: "#c8e6d4" }}>{s.title}</p>
              <p className="text-[10px] leading-relaxed" style={{ color: "rgba(148,163,184,0.45)" }}>{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Quick Prompts */}
        <div className="rounded-xl p-3" style={{ background: "rgba(12,28,20,0.6)", border: "1px solid rgba(71,255,134,0.08)" }}>
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: "rgba(71,255,134,0.4)" }}>Quick Prompts</p>
          {QUICK_PROMPTS.map(q => (
            <button
              key={q}
              onClick={() => append({ role: "user", content: q })}
              className="w-full text-left flex items-center gap-1.5 py-1.5 text-[10px] transition-all hover:opacity-100"
              style={{ color: "rgba(148,163,184,0.5)" }}
            >
              <ChevronRight className="w-2.5 h-2.5 flex-shrink-0" style={{ color: "#47ff86" }} />
              {q}
            </button>
          ))}
        </div>
      </aside>

      <style>{`
        @keyframes copilotBounce {
          0%, 100% { transform: scaleY(0.6); opacity: 0.3; }
          50% { transform: scaleY(1.3); opacity: 1; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(71,255,134,0.08); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(71,255,134,0.18); }
      `}</style>
    </div>
  )
}