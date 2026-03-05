"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import DashboardHeader from "@/components/dashboard/header"
import {
  Plus, Pencil, Trash2, Loader2, X, Package, AlertCircle,
  Upload, Download, FileText, CheckCircle2, XCircle, ChevronDown,
  ChevronRight, Search, Filter, Grid3X3, List, RefreshCw,
  TableProperties, Sparkles, ClipboardList, Info, Image as ImageIcon, Share2
} from "lucide-react"
import * as XLSX from "xlsx"
import Papa from "papaparse"

interface Product {
  id: string; name: string; sku: string | null; category: string | null
  unit: string; price: number; cost_price: number; gst_rate: number
  stock_qty: number; description: string | null; image_url?: string
}

interface ParsedProduct {
  name: string; sku: string; category: string; unit: string
  price: string; cost_price: string; gst_rate: string; stock_qty: string; description: string
  _error?: string
}

type ImportResult = { name: string; status: "inserted" | "skipped" | "error"; reason?: string }

const EMPTY = { name: "", sku: "", category: "", unit: "pcs", price: "", cost_price: "", gst_rate: "18", stock_qty: "0", description: "", image_url: "" }
const GST_RATES = [0, 5, 12, 18, 28]
const UNITS = ["pcs", "kg", "g", "litre", "ml", "box", "pack", "dozen", "meter", "sqft"]
const inp = "w-full px-3 py-2 rounded-lg text-sm outline-none transition-all bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50"
const accent = "#00d4ff"; const green = "#16a34a"; const amber = "#f59e0b"; const red = "#ef4444"
const PAGE_SIZE = 15

// ── CSV Template headers
const CSV_TEMPLATE = `name,sku,category,unit,price,cost_price,gst_rate,stock_qty,description
Basmati Rice 5kg,RICE-5KG,Groceries,kg,450,300,5,100,Premium basmati rice
Surf Excel 1kg,SURF-1KG,Household,pcs,220,150,18,50,Detergent powder
`

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" })
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob)
  a.download = "products_template.csv"; a.click()
}

// ── Parse CSV/Excel file client-side
function parseCSV(text: string): ParsedProduct[] {
  const result = Papa.parse<Record<string, string>>(text.trim(), { header: true, skipEmptyLines: true })
  return result.data.map(row => {
    const name = (row.name || row.Name || row.PRODUCT || row["Product Name"] || "").trim()
    const sku = (row.sku || row.SKU || row.Sku || "").trim()
    const category = (row.category || row.Category || row.CATEGORY || row.Zone || row.zone || "").trim()
    const unit = (row.unit || row.Unit || "pcs").trim()
    const price = (row.price || row.Price || row["Selling Price"] || row["Sale Price"] || "0").trim()
    const cost_price = (row.cost_price || row["Cost Price"] || row.CostPrice || "0").trim()
    const gst_rate = (row.gst_rate || row.GST || row["GST Rate"] || "18").trim()
    const stock_qty = (row.stock_qty || row.Stock || row.Quantity || row.Qty || "0").trim()
    const description = (row.description || row.Description || "").trim()
    const _error = !name ? "Missing name" : !price || isNaN(Number(price)) ? "Invalid price" : undefined
    return { name, sku, category, unit, price, cost_price, gst_rate, stock_qty, description, _error }
  })
}

function parseExcel(buffer: ArrayBuffer): ParsedProduct[] {
  const wb = XLSX.read(buffer, { type: "array" })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" })
  return rows.map(row => {
    const name = String(row.name || row.Name || row.PRODUCT || row["Product Name"] || "").trim()
    const sku = String(row.sku || row.SKU || row.Sku || "").trim()
    const category = String(row.category || row.Category || row.Zone || row.zone || "").trim()
    const unit = String(row.unit || row.Unit || "pcs").trim()
    const price = String(row.price || row.Price || row["Selling Price"] || "0").trim()
    const cost_price = String(row.cost_price || row["Cost Price"] || "0").trim()
    const gst_rate = String(row.gst_rate || row.GST || "18").trim()
    const stock_qty = String(row.stock_qty || row.Stock || row.Quantity || row.Qty || "0").trim()
    const description = String(row.description || row.Description || "").trim()
    const _error = !name ? "Missing name" : !price || isNaN(Number(price)) ? "Invalid price" : undefined
    return { name, sku, category, unit, price, cost_price, gst_rate, stock_qty, description, _error }
  })
}

// ── Bulk row editor (spreadsheet-style)
function BulkEditor({ onImport }: { onImport: (rows: ParsedProduct[]) => void }) {
  const [rows, setRows] = useState<ParsedProduct[]>([{ ...EMPTY }])
  const addRow = () => setRows(r => [...r, { ...EMPTY }])
  const removeRow = (i: number) => setRows(r => r.filter((_, j) => j !== i))
  const setCell = (i: number, k: keyof ParsedProduct, v: string) =>
    setRows(r => r.map((row, j) => j === i ? { ...row, [k]: v } : row))

  const valid = rows.filter(r => r.name.trim() && r.price && !isNaN(Number(r.price)))

  const thCls = "px-2 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
  const tdInp = "px-1.5 py-1 rounded text-xs bg-secondary border border-border text-foreground outline-none focus:border-primary/50 w-full"

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Fill in product details row-by-row. Required: Name & Price.</p>
        <div className="flex gap-2">
          <button onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
            style={{ background: "rgba(0, 255, 170, 0.12)", color: accent, border: `1px solid ${accent}30` }}>
            <Plus className="w-3 h-3" /> Add Row
          </button>
          <button disabled={valid.length === 0} onClick={() => onImport(valid)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: green, color: "#060d1f" }}>
            <CheckCircle2 className="w-3 h-3" /> Import {valid.length > 0 ? `(${valid.length})` : ""}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <table className="text-sm w-full">
          <thead style={{ background: "rgba(15,23,42,0.8)" }}>
            <tr>
              {["#", "Name *", "SKU", "Category", "Unit", "Price ₹ *", "Cost ₹", "GST %", "Stock", ""].map(h => (
                <th key={h} className={thCls}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-border" style={{ background: i % 2 === 0 ? "rgba(15,23,42,0.4)" : "rgba(15,23,42,0.2)" }}>
                <td className="px-2 text-xs text-muted-foreground">{i + 1}</td>
                <td className="px-1 py-1 min-w-[140px]"><input className={tdInp} value={row.name} onChange={e => setCell(i, "name", e.target.value)} placeholder="Product name" /></td>
                <td className="px-1 py-1 min-w-[90px]"><input className={tdInp} value={row.sku} onChange={e => setCell(i, "sku", e.target.value)} placeholder="SKU-001" /></td>
                <td className="px-1 py-1 min-w-[100px]"><input className={tdInp} value={row.category} onChange={e => setCell(i, "category", e.target.value)} placeholder="Category" /></td>
                <td className="px-1 py-1 min-w-[70px]">
                  <select className={tdInp} value={row.unit} onChange={e => setCell(i, "unit", e.target.value)}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </td>
                <td className="px-1 py-1 min-w-[80px]"><input type="number" className={tdInp} value={row.price} onChange={e => setCell(i, "price", e.target.value)} placeholder="0.00" /></td>
                <td className="px-1 py-1 min-w-[80px]"><input type="number" className={tdInp} value={row.cost_price} onChange={e => setCell(i, "cost_price", e.target.value)} placeholder="0.00" /></td>
                <td className="px-1 py-1 min-w-[65px]">
                  <select className={tdInp} value={row.gst_rate} onChange={e => setCell(i, "gst_rate", e.target.value)}>
                    {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </td>
                <td className="px-1 py-1 min-w-[65px]"><input type="number" className={tdInp} value={row.stock_qty} onChange={e => setCell(i, "stock_qty", e.target.value)} placeholder="0" /></td>
                <td className="px-2"><button onClick={() => removeRow(i)} className="text-muted-foreground hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 5 && (
        <p className="text-xs text-muted-foreground text-center">{rows.length} rows · {valid.length} valid · {rows.length - valid.length} incomplete</p>
      )}
    </div>
  )
}

// ── Import Preview with category grouping
function ImportPreview({
  products, onConfirm, onBack, importing
}: {
  products: ParsedProduct[]
  onConfirm: () => void
  onBack: () => void
  importing: boolean
}) {
  const valid = products.filter(p => !p._error)
  const invalid = products.filter(p => p._error)
  const catMap: Record<string, ParsedProduct[]> = {}
  for (const p of valid) {
    const cat = p.category || "Uncategorised"
    catMap[cat] = [...(catMap[cat] || []), p]
  }
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(Object.keys(catMap).map(c => [c, true]))
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 justify-between flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-white">Review Import</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span style={{ color: green }}>{valid.length} valid</span>
            {invalid.length > 0 && <span style={{ color: amber }}> · {invalid.length} will be skipped (errors)</span>}
            {" "}· grouped by category
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onBack} disabled={importing}
            className="px-3 py-1.5 rounded-lg text-xs border text-muted-foreground hover:text-foreground transition-all"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            ← Back
          </button>
          <button onClick={onConfirm} disabled={importing || valid.length === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
            style={{ background: green, color: "#060d1f" }}>
            {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            {importing ? "Importing…" : `Confirm Import (${valid.length})`}
          </button>
        </div>
      </div>

      {/* Category groups */}
      <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
        {Object.entries(catMap).map(([cat, items]) => (
          <div key={cat} className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <button
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
              style={{ background: "rgba(15,23,42,0.7)" }}
              onClick={() => setExpanded(e => ({ ...e, [cat]: !e[cat] }))}>
              <div className="flex items-center gap-2">
                {expanded[cat] ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                <span style={{ color: accent }}>{cat}</span>
                <span className="text-xs font-normal text-muted-foreground">({items.length} products)</span>
              </div>
            </button>
            {expanded[cat] && (
              <table className="w-full text-xs">
                <thead><tr style={{ background: "rgba(15,23,42,0.5)" }}>
                  {["Name", "SKU", "Price", "Cost", "GST", "Stock", "Unit"].map(h => (
                    <th key={h} className="px-3 py-1.5 text-left text-[10px] font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {items.map((p, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-2 font-medium text-white">{p.name}</td>
                      <td className="px-3 py-2 text-muted-foreground font-mono">{p.sku || "—"}</td>
                      <td className="px-3 py-2" style={{ color: accent }}>₹{p.price}</td>
                      <td className="px-3 py-2 text-muted-foreground">₹{p.cost_price || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{p.gst_rate}%</td>
                      <td className="px-3 py-2 text-white">{p.stock_qty}</td>
                      <td className="px-3 py-2 text-muted-foreground">{p.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
        {invalid.length > 0 && (
          <div className="rounded-xl border p-3" style={{ borderColor: `${amber}30`, background: `${amber}08` }}>
            <p className="text-xs font-semibold mb-2" style={{ color: amber }}>⚠ Skipped rows ({invalid.length})</p>
            {invalid.map((p, i) => (
              <p key={i} className="text-xs text-muted-foreground">• {p.name || "(unnamed)"} — {p._error}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Import Results summary
function ImportResults({ results, onDone }: { results: ImportResult[]; onDone: () => void }) {
  const inserted = results.filter(r => r.status === "inserted")
  const skipped = results.filter(r => r.status === "skipped")
  const errors = results.filter(r => r.status === "error")
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Imported", count: inserted.length, color: green, icon: CheckCircle2 },
          { label: "Skipped", count: skipped.length, color: amber, icon: Info },
          { label: "Errors", count: errors.length, color: red, icon: XCircle },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-4 text-center" style={{ borderColor: `${s.color}25`, background: `${s.color}08` }}>
            <s.icon className="w-5 h-5 mx-auto mb-1" style={{ color: s.color }} />
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      {skipped.length > 0 && (
        <div className="rounded-lg p-3 text-xs" style={{ background: `${amber}08`, border: `1px solid ${amber}20` }}>
          <p className="font-semibold mb-1" style={{ color: amber }}>Skipped (duplicate SKU or invalid):</p>
          {skipped.map((r, i) => <p key={i} className="text-muted-foreground">• {r.name} — {r.reason}</p>)}
        </div>
      )}
      <button onClick={onDone} className="py-2 rounded-lg text-sm font-semibold" style={{ background: green, color: "#060d1f" }}>
        ✓ Done
      </button>
    </div>
  )
}

// ── Main Page
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Import state
  const [importMode, setImportMode] = useState<"none" | "upload" | "bulk" | "preview" | "results">("none")
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([])
  const [importResults, setImportResults] = useState<ImportResult[]>([])
  const [importing, setImporting] = useState(false)
  const [fileLoading, setFileLoading] = useState(false)
  const [aiParsing, setAiParsing] = useState(false)
  const [uploadError, setUploadError] = useState("")

  // Table state
  const [search, setSearch] = useState("")
  const [filterCat, setFilterCat] = useState("")
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const fileRef = useRef<HTMLInputElement>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [networkIp, setNetworkIp] = useState<string | null>(null)
  const [copiedShare, setCopiedShare] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/products`); const d = await r.json()
    setProducts(d.products ?? [])
    if (d.userId) setUserId(d.userId)
    if (d.networkIp) setNetworkIp(d.networkIp)
    setLoading(false)
  }, [])

  function handleShare() {
    if (!userId) return;
    const origin = window.location.origin;
    const isLocalHost = origin.includes("localhost") || origin.includes("127.0.0.1");

    let shareUrl = `${origin}/store/${userId}`;
    if (isLocalHost && networkIp) {
      shareUrl = `http://${networkIp}:${window.location.port || "3000"}/store/${userId}`;
    }

    navigator.clipboard.writeText(shareUrl)
    setCopiedShare(true)
    setTimeout(() => setCopiedShare(false), 2000)
  }

  useEffect(() => { load() }, [load])

  function openAdd() { setEditing(null); setForm(EMPTY); setError(""); setShowModal(true) }
  function openEdit(p: Product) {
    setEditing(p)
    setForm({ name: p.name, sku: p.sku ?? "", category: p.category ?? "", unit: p.unit, price: String(p.price), cost_price: String(p.cost_price), gst_rate: String(p.gst_rate), stock_qty: String(p.stock_qty), description: p.description ?? "", image_url: p.image_url ?? "" })
    setError(""); setShowModal(true)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingImage(true); setError("")
    const formData = new FormData(); formData.append("file", file)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/upload`, { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) setError(data.error || "Upload failed")
      else setForm(f => ({ ...f, image_url: data.url }))
    } catch { setError("Network error during upload.") }
    finally { setUploadingImage(false) }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.price) { setError("Name and price are required."); return }
    setSaving(true); setError("")
    const body = { ...form, price: Number(form.price), cost_price: Number(form.cost_price), gst_rate: Number(form.gst_rate), stock_qty: Number(form.stock_qty), image_url: form.image_url }
    const res = await fetch(editing ? `${process.env.NEXT_PUBLIC_API_URL || ""}/api/products/${editing.id}` : `${process.env.NEXT_PUBLIC_API_URL || ""}/api/products`, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) { setError(data.error || "Save failed"); setSaving(false); return }
    setShowModal(false); load(); setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return
    setDeletingId(id)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/products/${id}`, { method: "DELETE" })
    setDeletingId(null); load()
  }

  // ── File Upload Handler
  async function handleFileUpload(file: File) {
    setUploadError(""); setFileLoading(true)
    const ext = file.name.split(".").pop()?.toLowerCase()

    try {
      if (ext === "csv") {
        const text = await file.text()
        const parsed = parseCSV(text)
        setParsedProducts(parsed); setImportMode("preview")
      } else if (ext === "xlsx" || ext === "xls") {
        const buffer = await file.arrayBuffer()
        const parsed = parseExcel(buffer)
        setParsedProducts(parsed); setImportMode("preview")
      } else if (ext === "pdf" || ext === "doc" || ext === "docx" || ext === "txt") {
        // For PDF/DOC: read as text (works for txt/doc), then send to AI
        setAiParsing(true)
        let text = ""
        try { text = await file.text() } catch { text = `File: ${file.name}` }
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/products/parse-file`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, filename: file.name })
        })
        const data = await res.json()
        setAiParsing(false)
        if (!res.ok || !data.products) { setUploadError(data.error || "AI parsing failed"); setFileLoading(false); return }
        const mapped: ParsedProduct[] = data.products.map((p: any) => ({
          name: String(p.name || ""), sku: String(p.sku || ""), category: String(p.category || ""),
          unit: String(p.unit || "pcs"), price: String(p.price || ""), cost_price: String(p.cost_price || "0"),
          gst_rate: String(p.gst_rate || "18"), stock_qty: String(p.stock_qty || "0"), description: String(p.description || ""),
          _error: !p.name ? "Missing name" : (!p.price || isNaN(Number(p.price))) ? "Invalid price" : undefined
        }))
        setParsedProducts(mapped); setImportMode("preview")
      } else {
        setUploadError("Unsupported file type. Use CSV, XLSX, XLS, PDF, DOC, DOCX, or TXT.")
      }
    } catch (err: any) {
      setUploadError(err?.message || "Failed to parse file")
    }
    setFileLoading(false)
  }

  // ── Confirm Bulk Import
  async function confirmImport(rows: ParsedProduct[]) {
    setImporting(true)
    const body = rows.map(r => ({
      name: r.name, sku: r.sku || null, category: r.category || null, unit: r.unit || "pcs",
      price: Number(r.price), cost_price: Number(r.cost_price) || 0,
      gst_rate: Number(r.gst_rate) || 18, stock_qty: Number(r.stock_qty) || 0, description: r.description || null
    }))
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/products/bulk`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ products: body }) })
    const data = await res.json()
    setImportResults(data.results || [])
    setImporting(false); setImportMode("results"); load()
  }

  // ── Filtered/paginated list
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[]
  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q)
    const matchCat = !filterCat || p.category === filterCat
    return matchQ && matchCat
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetImport = () => { setImportMode("none"); setParsedProducts([]); setImportResults([]); setUploadError("") }

  return (
    <>
      <main className="flex-1 overflow-y-auto p-6 bg-[#060B09]">

        {/* ── Import Panel */}
        {importMode !== "none" && (
          <div className="mb-6 rounded-2xl border p-5 bg-[#0A110F] border-[#1A2623]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                {importMode === "upload" && <><Upload className="w-4 h-4 text-[#00E58F]" /> Upload & Auto-Import</>}
                {importMode === "bulk" && <><TableProperties className="w-4 h-4 text-[#00E58F]" /> Bulk Add (Spreadsheet)</>}
                {importMode === "preview" && <><ClipboardList className="w-4 h-4 text-[#00E58F]" /> Preview Before Import</>}
                {importMode === "results" && <><CheckCircle2 className="w-4 h-4 text-[#00E58F]" /> Import Complete</>}
              </h2>
              <button onClick={resetImport} className="p-1.5 rounded-lg hover:bg-[#1A2623] text-[#5B6B66] hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>

            {/* Upload mode */}
            {importMode === "upload" && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Bulk Import & <span className="text-[#00E58F]">AI</span> Auto-Import</h1>
                    <p className="text-sm text-[#94A39D]">Intelligent data ingestion for modern retail enterprises.</p>
                  </div>
                  <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#0A110F] border border-[#1A2623] text-[#00E58F] rounded-xl hover:bg-[#0D1513] transition-colors">
                    <Download className="w-4 h-4" /> Download Template
                  </button>
                </div>

                <div
                  className="rounded-3xl border border-dashed border-[#1A2623] p-16 flex flex-col items-center gap-5 cursor-pointer transition-all hover:border-[#00E58F]/50 bg-[#060B09] relative"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f) }}>

                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#00E58F]"></div>

                  {fileLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-10 h-10 animate-spin text-[#00E58F]" />
                      <p className="text-sm text-[#94A39D] font-medium">{aiParsing ? "🤖 AI is reading your file…" : "Parsing file…"}</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-[#0D1513] flex items-center justify-center">
                        <Upload className="w-8 h-8 text-[#00E58F]" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-white mb-2">Drop your retail data here</h3>
                        <p className="text-sm text-[#94A39D] max-w-sm mx-auto">
                          Support for CSV, Excel, and PDF files. Let our AI automatically map headers and parse content.
                        </p>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <button className="bg-[#00E58F] text-[#0A0A0A] font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-[#00FFAA] transition-colors">
                          Browse Files
                        </button>
                        <button className="bg-[#0A110F] text-white border border-[#1A2623] font-medium px-6 py-2.5 rounded-xl text-sm hover:bg-[#0D1513] transition-colors">
                          Paste URL
                        </button>
                      </div>
                      <div className="w-full max-w-xs h-px bg-[#1A2623] my-2 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex items-center gap-6 bg-[#060B09] px-4 text-xs font-semibold text-[#5B6B66]">
                            <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> CSV</span>
                            <span className="flex items-center gap-1.5"><TableProperties className="w-3.5 h-3.5" /> EXCEL</span>
                            <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> PDF</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  <input ref={fileRef} type="file" className="hidden"
                    accept=".csv,.xlsx,.xls,.pdf,.doc,.docx,.txt"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = "" }} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  <div className="bg-[#0A110F] rounded-2xl border border-[#1A2623] p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-[#00E58F]" />
                      <h3 className="text-white font-bold">AI Parsing Technology</h3>
                    </div>
                    <p className="text-[#94A39D] text-sm mb-6 leading-relaxed">
                      Our proprietary RetailMind Engine uses NLP to understand your data context. No more manual header mapping or format conversion.
                    </p>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2.5 text-sm text-[#E1E7E5]">
                        <div className="w-4 h-4 rounded-full bg-[#00E58F] flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-[#0A0A0A]" /></div>
                        Automatic Header Normalization
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-[#E1E7E5]">
                        <div className="w-4 h-4 rounded-full bg-[#00E58F] flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-[#0A0A0A]" /></div>
                        OCR for Scanned Invoices (PDF)
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-[#E1E7E5]">
                        <div className="w-4 h-4 rounded-full bg-[#00E58F] flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-[#0A0A0A]" /></div>
                        Intelligent Anomaly Detection
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0A110F] rounded-2xl border border-[#1A2623] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-bold flex items-center gap-2">Recent Activity</h3>
                    </div>
                    <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-[#1A2623] rounded-xl bg-[#060B09]">
                      <FileText className="w-6 h-6 text-[#5B6B66] mb-2" />
                      <p className="text-[#94A39D] text-sm font-medium">No recent imports to display.</p>
                      <p className="text-[#5B6B66] text-xs">Your AI auto-import logs will appear here.</p>
                    </div>
                  </div>
                </div>

                {uploadError && (
                  <div className="px-4 py-3 rounded-xl text-sm flex items-center gap-2 bg-[#FF4D4D]/10 border border-[#FF4D4D]/30 text-[#FF4D4D]">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {uploadError}
                  </div>
                )}
              </div>
            )}

            {/* Bulk editor mode */}
            {importMode === "bulk" && (
              <BulkEditor onImport={rows => { setParsedProducts(rows); setImportMode("preview") }} />
            )}

            {/* Preview mode */}
            {importMode === "preview" && (
              <ImportPreview
                products={parsedProducts}
                importing={importing}
                onBack={() => setImportMode(parsedProducts.length > 0 ? "upload" : "bulk")}
                onConfirm={() => confirmImport(parsedProducts.filter(p => !p._error))}
              />
            )}

            {/* Results mode */}
            {importMode === "results" && (
              <ImportResults results={importResults} onDone={resetImport} />
            )}
          </div>
        )}

        {/* ── Toolbar */}
        {importMode === "none" && (
          <div className="flex flex-col gap-6 mb-8">
            {/* Top row */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Catalog</h1>
                <p className="text-sm text-[#94A39D] font-medium">Add and organize your products with AI assistance</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => { resetImport(); setImportMode("upload") }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all bg-[#0A110F] border border-[#1A2623] text-white hover:bg-[#0D1513]">
                  <FileText className="w-4 h-4 text-[#00E58F]" /> Import File
                </button>
                <button onClick={() => { resetImport(); setImportMode("bulk") }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all bg-[#0A110F] border border-[#1A2623] text-white hover:bg-[#0D1513]">
                  <Grid3X3 className="w-4 h-4 text-[#00E58F]" /> Bulk Add
                </button>
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-[#00E58F] text-[#0A0A0A] hover:bg-[#00FFAA] transition-all shadow-[0_0_15px_rgba(0,229,143,0.3)]">
                  <Plus className="w-4 h-4" /> Add Single
                </button>
                {userId && (
                  <button onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all bg-[#0A110F] border border-[#1A2623] hover:bg-[#131B19] shadow-lg text-[#00d4ff]">
                    {copiedShare ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    {copiedShare ? "Link Copied!" : "Share Store"}
                  </button>
                )}
              </div>
            </div>
            {/* Search + filter row */}
            <div className="flex gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B6B66]" />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Search by name, SKU, category..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-[#060B09] border border-[#1A2623] text-white placeholder:text-[#5B6B66] outline-none focus:border-[#00E58F]/50 transition-colors shadow-inner shadow-black/20" />
              </div>
              {categories.length > 0 && (
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B6B66]" />
                  <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1) }}
                    className="pl-11 pr-10 py-3 rounded-xl text-sm bg-[#060B09] border border-[#1A2623] text-white outline-none appearance-none focus:border-[#00E58F]/50 transition-colors shadow-inner shadow-black/20 font-medium">
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              )}
              {(search || filterCat) && (
                <button onClick={() => { setSearch(""); setFilterCat(""); setPage(1) }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border border-[#1A2623] text-[#94A39D] hover:text-white hover:bg-[#0A110F] transition-all">
                  <RefreshCw className="w-4 h-4" /> Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Product List */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#00E58F]" /></div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 w-full max-w-2xl mx-auto">
            <div className="w-full bg-[#060B09] border border-[#1A2623] rounded-[32px] p-12 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-10 w-64 h-64 bg-[#00E58F]/5 rounded-full blur-3xl -z-10"></div>

              <div className="w-20 h-20 rounded-3xl bg-[#0D1513] border border-[#1A2623] flex flex-col items-center justify-center mb-8 shadow-[0_0_40px_rgba(0,229,143,0.15)] relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00E58F]/10 to-transparent rounded-3xl z-0"></div>
                <ClipboardList className="w-10 h-10 text-[#00E58F] relative z-10" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">No products found</h2>
              <p className="text-[#94A39D] text-sm max-w-sm mx-auto mb-10 leading-relaxed font-medium">
                Your product catalog is currently empty. Start by adding your first item or import your existing inventory via CSV or Excel.
              </p>

              <div className="flex items-center gap-4 mb-12 w-full justify-center">
                <button onClick={openAdd} className="bg-[#00E58F] text-[#0A0A0A] px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#00FFAA] transition-all shadow-[0_0_20px_rgba(0,229,143,0.2)]">
                  <Plus className="w-4 h-4" strokeWidth={3} /> Get Started
                </button>
                <button onClick={() => { resetImport(); setImportMode("upload") }} className="bg-[#0A110F] border border-[#1A2623] text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#0D1513] transition-all">
                  <FileText className="w-4 h-4 text-[#94A39D]" /> View Guide
                </button>
              </div>

              <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-[#1A2623] to-transparent mb-10"></div>

              <div className="grid grid-cols-3 gap-4 w-full divide-x divide-[#1A2623] max-w-md mx-auto">
                <div className="flex flex-col items-center">
                  <p className="text-[#00E58F] text-2xl font-extrabold mb-1 tracking-tight">0</p>
                  <p className="text-[#5B6B66] text-[10px] font-bold uppercase tracking-widest">ACTIVE SKUS</p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-[#00E58F] text-2xl font-extrabold mb-1 tracking-tight">N/A</p>
                  <p className="text-[#5B6B66] text-[10px] font-bold uppercase tracking-widest">TOTAL VALUE</p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-[#00E58F] text-2xl font-extrabold mb-1 tracking-tight">100%</p>
                  <p className="text-[#5B6B66] text-[10px] font-bold uppercase tracking-widest">EFFICIENCY</p>
                </div>
              </div>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-[#0A110F] rounded-2xl border border-[#1A2623]">
            <Search className="w-8 h-8 text-[#5B6B66] mx-auto mb-4" />
            <p className="text-white font-medium mb-2">No products match your search.</p>
            <button onClick={() => { setSearch(""); setFilterCat("") }} className="mt-2 text-sm text-[#00E58F] hover:underline font-medium">Clear all filters</button>
          </div>
        ) : viewMode === "table" ? (
          <>
            <div className="rounded-2xl overflow-hidden border border-[#1A2623] bg-[#0A110F]">
              <table className="w-full text-sm">
                <thead><tr className="bg-[#131B19] border-b border-[#1A2623]">
                  {["Image", "Name", "SKU", "Category", "Unit", "Price (₹)", "GST %", "Stock", "Actions"].map(h => (
                    <th key={h} className="text-left px-5 py-4 text-[10px] font-bold text-[#5B6B66] uppercase tracking-widest">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {paginated.map((p, i) => (
                    <tr key={p.id} className="border-b border-[#1A2623] hover:bg-[#131B19]/50 transition-colors bg-[#060B09]">
                      <td className="px-5 py-4">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded-md object-cover border border-[#1A2623] inline-block" />
                        ) : (
                          <div className="w-8 h-8 rounded-md bg-[#0A110F] border border-[#1A2623] flex items-center justify-center inline-flex">
                            <ImageIcon className="w-3 h-3 text-[#5B6B66]" />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 font-bold text-white text-xs">{p.name}</td>
                      <td className="px-5 py-4 text-[#5B6B66] font-mono text-xs uppercase">{p.sku || "—"}</td>
                      <td className="px-5 py-4 text-[#94A39D] text-xs font-medium uppercase">{p.category || "—"}</td>
                      <td className="px-5 py-4 text-[#5B6B66] text-xs">{p.unit}</td>
                      <td className="px-5 py-4 font-bold text-[#00E58F] text-xs">₹{Number(p.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-4 text-[#5B6B66] text-xs">{p.gst_rate}%</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full text-xs font-bold ${Number(p.stock_qty) > 0 ? "bg-[#00E58F]/10 text-[#00E58F] border border-[#00E58F]/20" : "bg-[#FF4D4D]/10 text-[#FF4D4D] border border-[#FF4D4D]/20"}`}>{p.stock_qty}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openEdit(p)} className="text-[#5B6B66] hover:text-white transition-colors" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} className="text-[#5B6B66] hover:text-[#FF4D4D] transition-colors" aria-label="Delete">
                            {deletingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-5 px-2">
                <p className="text-xs text-[#5B6B66] font-medium">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
                <div className="flex items-center gap-1.5">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2.5 py-1.5 rounded-lg text-sm bg-[#0A110F] border border-[#1A2623] text-[#94A39D] hover:text-white disabled:opacity-40 transition-all font-medium">←</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1).map((n, i, arr) => (
                    <span key={n}>
                      {i > 0 && arr[i - 1] !== n - 1 && <span className="text-xs text-[#5B6B66] px-1">…</span>}
                      <button onClick={() => setPage(n)} className="min-w-[32px] py-1.5 rounded-lg text-sm border font-bold transition-all" style={{ borderColor: page === n ? "#00E58F" : "#1A2623", background: page === n ? "rgba(0,229,143,0.1)" : "#0A110F", color: page === n ? "#00E58F" : "#94A39D" }}>{n}</button>
                    </span>
                  ))}
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-2.5 py-1.5 rounded-lg text-sm bg-[#0A110F] border border-[#1A2623] text-[#94A39D] hover:text-white disabled:opacity-40 transition-all font-medium">→</button>
                </div>
              </div>
            )}
          </>
        ) : (
          // Grid view
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map(p => (
              <div key={p.id} className="rounded-2xl border p-5 flex flex-col gap-4 transition-all hover:scale-[1.01] bg-[#0A110F] border-[#1A2623]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-[#1A2623] flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#060B09] border border-[#1A2623] flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-4 h-4 text-[#5B6B66]" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-white text-base leading-snug">{p.name}</p>
                      {p.sku && <p className="text-xs font-mono text-[#5B6B66] mt-1 uppercase">{p.sku}</p>}
                    </div>
                  </div>
                  {p.category && <span className="text-[10px] px-2.5 py-1 rounded-full flex-shrink-0 font-bold bg-[#00E58F]/10 text-[#00E58F] uppercase tracking-wider">{p.category}</span>}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><p className="text-[#5B6B66] font-medium uppercase tracking-wider text-[10px] mb-0.5">Price</p><p className="font-bold text-white text-sm">₹{Number(p.price).toLocaleString("en-IN")}</p></div>
                  <div><p className="text-[#5B6B66] font-medium uppercase tracking-wider text-[10px] mb-0.5">GST</p><p className="font-bold text-white text-sm">{p.gst_rate}%</p></div>
                  <div><p className="text-[#5B6B66] font-medium uppercase tracking-wider text-[10px] mb-0.5">Stock</p><span className={`font-bold text-sm ${Number(p.stock_qty) > 0 ? "text-[#00E58F]" : "text-[#FF4D4D]"}`}>{p.stock_qty} {p.unit}</span></div>
                  {p.cost_price > 0 && <div><p className="text-[#5B6B66] font-medium uppercase tracking-wider text-[10px] mb-0.5">Margin</p><p className="font-bold text-[#00E58F] text-sm">{Math.round(((p.price - p.cost_price) / p.price) * 100)}%</p></div>}
                </div>
                <div className="flex gap-2 pt-4 border-t border-[#1A2623] mt-1">
                  <button onClick={() => openEdit(p)} className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-[#131B19] hover:bg-[#1A2623] transition-all flex items-center justify-center gap-1.5"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                  <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} className="flex-1 py-2 rounded-xl text-xs font-bold text-[#FF4D4D] bg-[#FF4D4D]/10 hover:bg-[#FF4D4D]/20 transition-all flex items-center justify-center gap-1.5">
                    {deletingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Trash2 className="w-3.5 h-3.5" /> Delete</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Stats bar at bottom */}
        {products.length > 0 && importMode === "none" && (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Products", value: products.length, color: "#00E58F" },
              { label: "Total Stock Value", value: `₹${products.reduce((s, p) => s + p.price * p.stock_qty, 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, color: "#a78bfa" },
              { label: "Low Stock (<10)", value: products.filter(p => p.stock_qty > 0 && p.stock_qty < 10).length, color: "#f59e0b" },
              { label: "Out of Stock", value: products.filter(p => p.stock_qty === 0).length, color: "#ef4444" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-[#1A2623] bg-[#0A110F] p-5 shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <p className="text-[10px] text-[#5B6B66] font-bold uppercase tracking-widest mb-2 relative z-10">{s.label}</p>
                <p className="text-2xl font-extrabold tracking-tight relative z-10" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Single Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-lg rounded-3xl border p-8 backdrop-blur-xl max-h-[90vh] overflow-y-auto" style={{ background: "#060B09", borderColor: "#1A2623", boxShadow: "0 0 40px rgba(0,229,143,0.05)" }}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-white tracking-tight">{editing ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl border border-transparent hover:border-[#1A2623] hover:bg-[#0A110F] text-[#5B6B66] hover:text-white transition-all"><X className="w-5 h-5" /></button>
            </div>
            {error && <div className="mb-6 px-4 py-3 rounded-xl text-sm flex items-center gap-2 bg-[#FF4D4D]/10 border border-[#FF4D4D]/30 text-[#FF4D4D]"><AlertCircle className="w-4 h-4" />{error}</div>}

            <form onSubmit={handleSave} className="grid grid-cols-2 gap-x-4 gap-y-5">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-white mb-2">Product Image</label>
                <div className="flex items-center gap-4">
                  {form.image_url ? (
                    <img src={form.image_url} alt="Product" className="w-16 h-16 rounded-xl object-cover border border-[#1A2623]" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[#060B09] border border-[#1A2623] flex items-center justify-center text-[#5B6B66] shadow-inner shadow-black/50">
                      <ImageIcon className="w-6 h-6 opacity-50" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      id="product-image-upload-page"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    <label
                      htmlFor="product-image-upload-page"
                      className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#0A110F] border border-[#1A2623] text-white hover:bg-[#0D1513] transition-colors w-fit shadow-lg"
                    >
                      {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin text-[#00E58F]" /> : <Upload className="w-4 h-4 text-[#00E58F]" />}
                      {uploadingImage ? "Uploading..." : "Upload Image"}
                    </label>
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-semibold text-white mb-2">Product Name *</label>
                <input className="w-full px-4 py-3 rounded-xl text-sm bg-[#060B09] border border-[#1A2623] text-white placeholder:text-[#5B6B66] outline-none focus:border-[#00E58F]/50 transition-colors shadow-inner shadow-black/50" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Basmati Rice 5kg" required />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">SKU</label>
                <input className="w-full px-4 py-3 rounded-xl text-sm bg-[#060B09] border border-[#1A2623] text-white placeholder:text-[#5B6B66] outline-none focus:border-[#00E58F]/50 transition-colors shadow-inner shadow-black/50" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="RICE-5KG" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Category</label>
                <input className="w-full px-4 py-3 rounded-xl text-sm bg-[#060B09] border border-[#1A2623] text-white placeholder:text-[#5B6B66] outline-none focus:border-[#00E58F]/50 transition-colors shadow-inner shadow-black/50" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Groceries" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Sale Price (₹) *</label>
                <input type="number" min="0" step="0.01" className="w-full px-4 py-3 rounded-xl text-sm bg-[#060B09] border border-[#1A2623] text-white placeholder:text-[#5B6B66] outline-none focus:border-[#00E58F]/50 transition-colors shadow-inner shadow-black/50" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" required />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Cost Price (₹)</label>
                <input type="number" min="0" step="0.01" className="w-full px-4 py-3 rounded-xl text-sm bg-[#060B09] border border-[#1A2623] text-white placeholder:text-[#5B6B66] outline-none focus:border-[#00E58F]/50 transition-colors shadow-inner shadow-black/50" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))} placeholder="0.00" />
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-white mb-2">GST Rate</label>
                <select className="w-full pl-4 pr-10 py-3 rounded-xl text-sm bg-[#060B09] border border-[#1A2623] text-white outline-none appearance-none focus:border-[#00E58F]/50 transition-colors shadow-inner shadow-black/50" value={form.gst_rate} onChange={e => setForm(f => ({ ...f, gst_rate: e.target.value }))}>{GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}</select>
                <ChevronDown className="absolute right-4 top-[38px] w-4 h-4 text-[#5B6B66] pointer-events-none" />
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-white mb-2">Unit</label>
                <select className="w-full pl-4 pr-10 py-3 rounded-xl text-sm bg-[#060B09] border border-[#1A2623] text-white outline-none appearance-none focus:border-[#00E58F]/50 transition-colors shadow-inner shadow-black/50" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>{UNITS.map(u => <option key={u}>{u}</option>)}</select>
                <ChevronDown className="absolute right-4 top-[38px] w-4 h-4 text-[#5B6B66] pointer-events-none" />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-white mb-2">Stock Qty</label>
                <input type="number" min="0" className="w-full px-4 py-3 rounded-xl text-sm bg-[#060B09] border border-[#1A2623] text-white placeholder:text-[#5B6B66] outline-none focus:border-[#00E58F]/50 transition-colors shadow-inner shadow-black/50" value={form.stock_qty} onChange={e => setForm(f => ({ ...f, stock_qty: e.target.value }))} placeholder="0" />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-semibold text-white mb-2">Description</label>
                <input className="w-full px-4 py-3 rounded-xl text-sm bg-[#060B09] border border-[#1A2623] text-white placeholder:text-[#5B6B66] outline-none focus:border-[#00E58F]/50 transition-colors shadow-inner shadow-black/50" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" />
              </div>

              <div className="col-span-2 flex gap-4 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 rounded-xl text-sm font-bold bg-[#0A110F] border border-[#1A2623] text-[#94A39D] hover:bg-[#0D1513] hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={saving || uploadingImage} className="flex-1 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-[#1B9B53] hover:bg-[#20b25e] text-white transition-colors disabled:opacity-50">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? "Saving…" : editing ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )
      }
    </>
  )
}
