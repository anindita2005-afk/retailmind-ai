"use client"

import { useState } from "react"
import { Search, Loader2, Star, Package } from "lucide-react"

type SimilarProduct = {
  name: string
  brand: string
  price_min: number
  price_max: number
  quality_tier: string
  rating: number
  availability: string
  platforms: string[]
  key_features: string[]
  pros: string
  cons: string
}

type SearchResult = {
  search_term: string
  category: string
  similar_products: SimilarProduct[]
  price_comparison: { budget_range: string; mid_range: string; premium_range: string }
  buying_recommendation: string
  gst_rate: number
}

const TIER_COLOR: Record<string, string> = {
  Premium: "#a78bfa",
  Standard: "#09755a",
  Budget: "#34d399",
}
const AVAIL_COLOR: Record<string, string> = {
  "Widely Available": "#34d399",
  "Moderately Available": "#f59e0b",
  "Limited": "#f87171",
}

export default function ProductSearchClient() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState("")

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setError("")
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/product-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Search failed"); return }
      setResult(data.result)
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const cardStyle = { background: "rgba(15,23,42,0.5)", borderColor: "rgba(255,255,255,0.07)" }

  return (
    <div className="flex flex-col gap-5">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any product to find alternatives and compare prices (e.g. 'OnePlus 12', 'Cotton kurti')…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm bg-input border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold"
          style={{ background: "#16a34a", color: "#060d1f" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#097245" }} />
          <p className="text-sm text-muted-foreground">Finding similar products in the Indian market…</p>
        </div>
      )}

      {result && !loading && (
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Results for "{result.search_term}"</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Category: {result.category} · GST: {result.gst_rate}%</p>
            </div>
          </div>

          {/* Price ranges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Budget Range", value: result.price_comparison.budget_range, color: "#34d399" },
              { label: "Mid Range", value: result.price_comparison.mid_range, color: "#037958" },
              { label: "Premium Range", value: result.price_comparison.premium_range, color: "#a78bfa" },
            ].map((r) => (
              <div key={r.label} className="rounded-xl border p-4" style={cardStyle}>
                <p className="text-xs text-muted-foreground mb-1">{r.label}</p>
                <p className="font-semibold" style={{ color: r.color }}>{r.value}</p>
              </div>
            ))}
          </div>

          {/* Products grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {result.similar_products.map((p) => (
              <div key={`${p.brand}-${p.name}`} className="rounded-xl border p-5 flex flex-col gap-3" style={cardStyle}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.brand}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0" style={{ background: `${TIER_COLOR[p.quality_tier]}18`, color: TIER_COLOR[p.quality_tier] }}>
                    {p.quality_tier}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      ₹{Number(p.price_min).toLocaleString("en-IN")} – ₹{Number(p.price_max).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs text-foreground">{p.rating}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${AVAIL_COLOR[p.availability] || "#94a3b8"}18`, color: AVAIL_COLOR[p.availability] || "#94a3b8" }}>
                    {p.availability}
                  </span>
                </div>

                {p.key_features?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {p.key_features.slice(0, 3).map((f) => (
                      <span key={f} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(148,163,184,0.9)" }}>{f}</span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-green-400 font-medium mb-0.5">Pros</p>
                    <p className="text-muted-foreground">{p.pros}</p>
                  </div>
                  <div>
                    <p className="text-red-400 font-medium mb-0.5">Cons</p>
                    <p className="text-muted-foreground">{p.cons}</p>
                  </div>
                </div>

                {p.platforms?.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{p.platforms.join(", ")}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Recommendation */}
          <div className="rounded-xl border p-5" style={{ background: "rgba(0,212,255,0.05)", borderColor: "rgba(0,212,255,0.15)" }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: "#00d4ff" }}>Buying Recommendation</h3>
            <p className="text-sm text-foreground leading-relaxed">{result.buying_recommendation}</p>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div
          className="rounded-xl border p-12 flex flex-col items-center gap-3 text-center"
          style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(15,23,42,0.3)" }}
        >
          <Search className="w-10 h-10 text-muted-foreground" />
          <p className="font-medium text-foreground">Search for any product</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Find similar products, compare prices, and get AI-powered buying recommendations for the Indian market.
          </p>
        </div>
      )}
    </div>
  )
}
