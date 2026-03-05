"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import DashboardHeader from "@/components/dashboard/header"
import { Printer, ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react"
import Link from "next/link"

interface BillItem { id: string; name: string; unit: string; qty: number; price: number; gst_rate: number; gst_amount: number; amount: number }
interface Bill { id: string; customer_name: string; customer_email: string | null; customer_phone: string | null; customer_address: string | null; customer_gst: string | null; subtotal: number; gst_amount: number; total: number; status: string; bill_date: string; notes: string | null; display_id?: string }
interface Profile { business_name: string; gst_number: string | null; display_id: string; email: string; address: string | null; city: string | null; state: string | null; phone: string | null }

function convertNumberToWords(amount: number) {
  const words = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  if (amount === 0) return "Zero";
  const numStr = amount.toString();
  const [rupees, paise] = numStr.split('.');

  function getWords(numValue: number): string {
    let str = "";
    if (numValue > 9999999) { str += getWords(Math.floor(numValue / 10000000)) + " Crore "; numValue %= 10000000; }
    if (numValue > 99999) { str += getWords(Math.floor(numValue / 100000)) + " Lakh "; numValue %= 100000; }
    if (numValue > 999) { str += getWords(Math.floor(numValue / 1000)) + " Thousand "; numValue %= 1000; }
    if (numValue > 99) { str += getWords(Math.floor(numValue / 100)) + " Hundred "; numValue %= 100; }
    if (numValue > 0) {
      if (numValue < 20) str += words[numValue] + " ";
      else {
        str += tens[Math.floor(numValue / 10)] + " ";
        if (numValue % 10 > 0) str += words[numValue % 10] + " ";
      }
    }
    return str.trim();
  }

  let result = getWords(parseInt(rupees));
  if (paise && parseInt(paise) > 0) {
    const p = parseInt((paise + '00').substring(0, 2));
    result += " and " + getWords(p) + " Paise";
  }
  return result ? result + " Only" : "";
}

export default function BillDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [bill, setBill] = useState<Bill | null>(null)
  const [items, setItems] = useState<BillItem[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/bills/${id}?t=${Date.now()}`)
    if (!res.ok) { router.push("/dashboard/bills"); return }
    const data = await res.json()
    setBill(data.bill); setItems(data.items ?? []); setProfile(data.profile)
    setLoading(false)
  }, [id, router])

  useEffect(() => { load() }, [load])

  async function markPaid() {
    if (updating || !bill) return
    setUpdating(true)

    // Optimistic Update
    setBill({ ...bill, status: "paid" })

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/bills/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" })
      })
      if (!res.ok) {
        // Revert on failure
        setBill({ ...bill })
      }
    } catch {
      // Revert on failure
      setBill({ ...bill })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#00E58F]" /></div>
  if (!bill) return null

  const displayId = bill.display_id || `ALP-2023-${bill.id.substring(0, 4).toUpperCase()}`
  const statusDisplay = bill.status === "paid" ? "Paid" : bill.status === "cancelled" ? "Cancelled" : "Pending Payment";

  return (
    <>
      <DashboardHeader title={`Bill — ${bill.customer_name}`} subtitle={`${new Date(bill.bill_date).toLocaleDateString("en-IN", { dateStyle: "long" })}`} />
      <main className="flex-1 overflow-y-auto p-6 bg-[#0A0A0A]">
        <div className="flex items-center gap-3 mb-6 flex-wrap max-w-5xl mx-auto">
          <Link href="/dashboard/bills" className="inline-flex items-center gap-1.5 text-sm text-[#94A39D] hover:text-[#00E58F] transition-colors"><ArrowLeft className="w-4 h-4" />All Bills</Link>
        </div>

        {/* Printable invoice wrapper */}
        <div id="invoice" className="max-w-5xl mx-auto rounded-xl border border-[#1A2623] shadow-2xl overflow-hidden print:shadow-none print:border-0 font-sans" style={{ background: "#0D1513" }}>

          <div className="p-10 pb-12">
            {/* Header Area */}
            <div className="flex items-start justify-between mb-16 gap-4">
              {/* Left Side: Brand and Info */}
              <div>
                <h1 className="text-[32px] font-black text-[#00E58F] tracking-wide mb-4 whitespace-nowrap">{profile?.business_name?.toUpperCase() ?? "ALPANA"}</h1>
                <div className="flex flex-col gap-1.5 text-[13px] text-[#94A39D]">
                  {profile?.gst_number && <p>GSTIN: <span className="text-white ml-2">{profile.gst_number}</span></p>}
                  {profile?.email && <p>Email: <span className="text-white ml-2">{profile.email}</span></p>}
                  {(profile?.address || profile?.city) && <p className="mt-1">{profile?.address ? profile.address + ', ' : ''}{profile?.city ? profile.city + ', ' : ''}{profile?.state ? profile.state + ', ' : ''}India</p>}
                </div>
              </div>

              {/* Right Side: Actions & Invoice Details */}
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-3 mb-8 print:hidden">
                  <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2 rounded border border-[#00E58F] text-xs font-bold bg-[#00E58F] text-[#0A110F] hover:bg-[#00FFAA] hover:border-[#00FFAA] transition-colors uppercase tracking-wide">
                    <Printer className="w-[14px] h-[14px]" /> PRINT PDF
                  </button>
                  {bill.status === "draft" && (
                    <button onClick={markPaid} disabled={updating} className="flex items-center gap-2 px-5 py-2 rounded text-xs font-bold border border-[#00E58F]/40 text-[#00E58F] hover:bg-[#00E58F]/10 transition-colors uppercase tracking-wide">
                      {updating ? <Loader2 className="w-[14px] h-[14px] animate-spin" /> : <CheckCircle2 className="w-[14px] h-[14px]" />} MARK AS PAID
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <span className="px-4 py-1 rounded-[100px] text-[10px] font-bold uppercase tracking-widest border border-[#00E58F]/40 text-[#00E58F] bg-[#00E58F]/10">
                    {bill.status === "paid" ? "PAID" : bill.status === "cancelled" ? "CANCELLED" : "DRAFT"}
                  </span>
                  <div className="text-[26px] font-light tracking-[0.2em] text-[#E1E7E5] uppercase">TAX INVOICE</div>
                </div>

                <div className="text-right text-[13px] text-[#94A39D] flex flex-col gap-1.5 pt-2">
                  <p>Invoice #: <span className="text-white font-medium ml-2">{displayId}</span></p>
                  <p>Date: <span className="text-white font-medium ml-2">{new Date(bill.bill_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span></p>
                </div>
              </div>
            </div>

            <div className="h-[1px] w-full bg-[#1A2623] mb-10 opacity-50"></div>

            {/* Bill To & Payment Status */}
            <div className="flex justify-between items-start mb-16 relative">
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#00E58F] mb-4">BILL TO</p>
                <div className="flex flex-col gap-1.5 text-[13px] text-[#94A39D]">
                  <p className="font-bold text-white text-[17px] mb-2">{bill.customer_name}</p>
                  {bill.customer_address && <p className="max-w-xs leading-relaxed">{bill.customer_address}</p>}
                  {bill.customer_phone && <p className="mt-1">Phone: <span className="text-white ml-2">{bill.customer_phone}</span></p>}
                  {bill.customer_email && <p>Email: <span className="text-white ml-2">{bill.customer_email}</span></p>}
                </div>
              </div>

              {/* Payment Status Box */}
              <div className="w-[260px] border border-dashed border-[#00E58F]/20 bg-[#00E58F]/[0.02] p-6 rounded-lg flex flex-col items-center justify-center -mt-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#00E58F]/60 mb-3">PAYMENT STATUS</p>
                <p className="text-[#00E58F] italic text-[15px]">{statusDisplay}</p>
              </div>
            </div>

            {/* Items table */}
            <div className="mb-14">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#00E58F] mb-4">LINE ITEMS</p>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#1A2623]">
                    {["#", "ITEM DESCRIPTION", "UNIT", "QTY", "RATE (₹)", "GST %", "GST (₹)", "AMOUNT (₹)"].map((h, i) => (
                      <th key={h} className={`py-4 px-2 text-[10px] font-bold text-[#00E58F] uppercase tracking-wider ${i === 0 ? 'text-left w-12' : i === 1 ? 'text-left' : 'text-right'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id} className="border-b border-[#1A2623]/60 hover:bg-[#00E58F]/[0.02] transition-colors">
                      <td className="py-5 px-2 text-[#94A39D] font-mono text-xs">{(i + 1).toString().padStart(2, '0')}</td>
                      <td className="py-5 px-2 font-medium text-white">{item.name}</td>
                      <td className="py-5 px-2 text-[#94A39D] text-right uppercase text-[12px]">{item.unit}</td>
                      <td className="py-5 px-2 text-white text-right">{item.qty}</td>
                      <td className="py-5 px-2 text-white text-right">{Number(item.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="py-5 px-2 text-[#94A39D] text-right italic text-[12px]">{item.gst_rate}%</td>
                      <td className="py-5 px-2 text-white text-right">{Number(item.gst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="py-5 px-2 font-semibold text-[#00E58F] text-right">{Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Notes Row */}
            <div className="flex justify-between items-start mb-4">
              {/* Notes */}
              <div className="w-[45%] border border-[#1A2623]/60 bg-[#0A0D0C]/40 p-5 rounded-lg mt-auto">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#00E58F]/80 mb-2">NOTES</p>
                <p className="text-[#94A39D]/80 text-[12px] italic leading-relaxed">
                  {bill.notes || "Please include the invoice number with your payment. Goods once sold are not returnable unless defective. Custom orders are non-refundable."}
                </p>
              </div>

              {/* Totals */}
              <div className="w-[340px] flex flex-col gap-4 text-[13px]">
                <div className="flex justify-between items-center px-2">
                  <span className="text-[#94A39D]">Subtotal</span>
                  <span className="text-white font-medium">₹ {Number(bill.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-[#94A39D]">Total GST</span>
                  <span className="text-white font-medium">₹ {Number(bill.gst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex flex-col gap-2 mt-2 pt-5 border-t border-[#1A2623]">
                  <div className="flex justify-between items-baseline px-2">
                    <span className="text-white font-bold uppercase tracking-wide text-[14px]">TOTAL AMOUNT</span>
                    <span className="text-[#00E58F] text-[28px] font-bold tracking-tight">₹ {Number(bill.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <span className="text-right text-[#00E58F]/60 text-[10px] italic pr-2">Amount in words: {convertNumberToWords(bill.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-[#0B110F] border-t border-[#1A2623]/60 pt-7 pb-8 text-center flex flex-col items-center justify-center gap-2.5">
            <p className="text-[#D1D9D6] font-medium text-[14px]">Thank you for your business with {profile?.business_name ?? "Alpana"}.</p>
            <p className="text-[#5B6B66] text-[9px] uppercase tracking-[0.1em]">THIS IS A COMPUTER-GENERATED INVOICE AND DOES NOT REQUIRE A PHYSICAL SIGNATURE.</p>
          </div>
        </div>

        <style>{`
          @media print { 
            body, main { background: #0A0F0D !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; } 
            #invoice { background: #0A0F0D !important; color: white !important; border: none !important; box-shadow: none !important; max-width: 100%; border-radius: 0; }
            ::-webkit-scrollbar { display: none; }
          }
        `}</style>
      </main>
    </>
  )
}
