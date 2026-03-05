"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, LayoutGrid, Search } from "lucide-react"

interface Props {
  title: string
  subtitle?: string
}

export default function DashboardHeader({ title, subtitle }: Props) {
  const router = useRouter()

  const [query, setQuery] = useState("")
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 1, title: "System Update", desc: "RetailMind AI has been updated to v1.2", time: "2m ago" },
    { id: 2, title: "New Feature", desc: "Try the new Market Analysis Copilot", time: "1h ago" }
  ])

  function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return

    e.preventDefault()
    const q = query.toLowerCase().trim()

    if (!q) return

    const routes: Record<string, string> = {
      // DASHBOARD
      "dashboard": "/dashboard",
      "home": "/dashboard",
      "main dashboard": "/dashboard",
      "overview": "/dashboard",
      "home dashboard": "/dashboard",
      "admin dashboard": "/dashboard",

      // PRODUCTS
      "products": "/dashboard/products",
      "product": "/dashboard/products",
      "product list": "/dashboard/products",
      "product manager": "/dashboard/products",
      "manage products": "/dashboard/products",
      "product management": "/dashboard/products",
      "inventory": "/dashboard/products",
      "inventory products": "/dashboard/products",
      "catalog": "/dashboard/products",
      "product catalog": "/dashboard/products",
      "stock products": "/dashboard/products",
      "catalog page": "/dashboard/products",
      "catalog manager": "/dashboard/products",
      "inventory catalog": "/dashboard/products",
      "product inventory": "/dashboard/products",
      "inventory manager": "/dashboard/products",
      "inventory management": "/dashboard/products",
      "stock inventory": "/dashboard/products",
      "stock management": "/dashboard/products",
      "stock list": "/dashboard/products",
      "product stock": "/dashboard/products",
      "inventory stock": "/dashboard/products",
      "sku": "/dashboard/products",
      "sku list": "/dashboard/products",
      "product sku": "/dashboard/products",
      "sku manager": "/dashboard/products",
      "categories": "/dashboard/products",
      "product categories": "/dashboard/products",
      "category manager": "/dashboard/products",
      "manage categories": "/dashboard/products",
      "inventory categories": "/dashboard/products",
      "add product": "/dashboard/products",
      "add products": "/dashboard/products",
      "create product": "/dashboard/products",
      "new product": "/dashboard/products",
      "bulk add": "/dashboard/products",
      "bulk products": "/dashboard/products",
      "import products": "/dashboard/products",
      "import catalog": "/dashboard/products",
      "upload products": "/dashboard/products",
      "stock value": "/dashboard/products",
      "total stock": "/dashboard/products",
      "low stock": "/dashboard/products",
      "out of stock": "/dashboard/products",
      "stock overview": "/dashboard/products",

      // ORDERS
      "orders": "/dashboard/orders",
      "order": "/dashboard/orders",
      "order list": "/dashboard/orders",
      "order management": "/dashboard/orders",
      "customer orders": "/dashboard/orders",
      "all orders": "/dashboard/orders",
      "order history": "/dashboard/orders",
      "purchase orders": "/dashboard/orders",

      // BILLING
      "bill": "/dashboard/bills",
      "bills": "/dashboard/bills",
      "billing": "/dashboard/bills",
      "bill generation": "/dashboard/bills",
      "generate bill": "/dashboard/bills",
      "create bill": "/dashboard/bills",
      "invoice": "/dashboard/bills",
      "invoices": "/dashboard/bills",
      "billing system": "/dashboard/bills",
      "billing dashboard": "/dashboard/bills",
      "payment bills": "/dashboard/bills",
      "sales bill": "/dashboard/bills",

      // MARKET ANALYSIS
      "market": "/dashboard/market-analysis",
      "market analysis": "/dashboard/market-analysis",
      "market research": "/dashboard/market-analysis",
      "market insights": "/dashboard/market-analysis",
      "market trends": "/dashboard/market-analysis",
      "market intelligence": "/dashboard/market-analysis",
      "competitor analysis": "/dashboard/market-analysis",
      "market data": "/dashboard/market-analysis",
      "market analytics": "/dashboard/market-analysis",
      "market report": "/dashboard/market-analysis",

      // PRODUCT SEARCH
      "search product": "/dashboard/product-search",
     
      "product search": "/dashboard/product-search",
      "find product": "/dashboard/product-search",
      "lookup product": "/dashboard/product-search",
      "search inventory": "/dashboard/product-search",
      "inventory search": "/dashboard/product-search",
      "product finder": "/dashboard/product-search",
      "product lookup": "/dashboard/product-search",

      // AI COPILOT
      "ai": "/dashboard/copilot",
      "copilot": "/dashboard/copilot",
      "ai copilot": "/dashboard/copilot",
      "assistant": "/dashboard/copilot",
      "ai assistant": "/dashboard/copilot",
      "retail ai": "/dashboard/copilot",
      "ai help": "/dashboard/copilot",
      "ai analysis": "/dashboard/copilot",
      

      // MARKET SEGMENTATION
      "segmentation": "/dashboard/market-segmentation",
      "market segmentation": "/dashboard/market-segmentation",
      "customer segmentation": "/dashboard/market-segmentation",
      "market segments": "/dashboard/market-segmentation",
      "customer groups": "/dashboard/market-segmentation",
      "target market": "/dashboard/market-segmentation",
      "segment analysis": "/dashboard/market-segmentation",
      "audience segmentation": "/dashboard/market-segmentation",

      "segmentation dashboard": "/dashboard/market-segmentation",
      "market segmentation dashboard": "/dashboard/market-segmentation",
      "customer segmentation dashboard": "/dashboard/market-segmentation",
      "market segmentation analysis": "/dashboard/market-segmentation",

      "customer segment prediction": "/dashboard/market-segmentation",
      "predict customer segment": "/dashboard/market-segmentation",
      "customer segment model": "/dashboard/market-segmentation",
      "customer clustering": "/dashboard/market-segmentation",

      "clustering": "/dashboard/market-segmentation",
      "k means clustering": "/dashboard/market-segmentation",
      "kmeans clustering": "/dashboard/market-segmentation",
      "clustering model": "/dashboard/market-segmentation",
      "clustering analysis": "/dashboard/market-segmentation",
      "clustering output": "/dashboard/market-segmentation",

      "customer clustering model": "/dashboard/market-segmentation",
      "customer behavior clustering": "/dashboard/market-segmentation",
      "customer group analysis": "/dashboard/market-segmentation",

      "model categories": "/dashboard/market-segmentation",
      "customer categories": "/dashboard/market-segmentation",
      "segment categories": "/dashboard/market-segmentation",

      "low activity customers": "/dashboard/market-segmentation",
      "balanced buyers": "/dashboard/market-segmentation",
      "high spenders": "/dashboard/market-segmentation",
      "cash advance heavy": "/dashboard/market-segmentation",

      "initialize clustering": "/dashboard/market-segmentation",
      "run clustering": "/dashboard/market-segmentation",
      "start clustering": "/dashboard/market-segmentation",
      "customer clustering prediction": "/dashboard/market-segmentation",

      "customer spending segmentation": "/dashboard/market-segmentation",
      "purchase behavior segmentation": "/dashboard/market-segmentation",
      "customer spending groups": "/dashboard/market-segmentation",
      "customer spending clusters": "/dashboard/market-segmentation",


      // CHURN PREDICTION
      "churn": "/dashboard/churn-prediction",
      "churn prediction": "/dashboard/churn-prediction",
      "customer churn": "/dashboard/churn-prediction",
      "churn analysis": "/dashboard/churn-prediction",
      "customer retention": "/dashboard/churn-prediction",
      "retention analysis": "/dashboard/churn-prediction",
      "churn model": "/dashboard/churn-prediction",
      "predict churn": "/dashboard/churn-prediction",

      "churn dashboard": "/dashboard/churn-prediction",
      "customer churn dashboard": "/dashboard/churn-prediction",
      "churn intelligence": "/dashboard/churn-prediction",
      "churn insights": "/dashboard/churn-prediction",
      "churn analytics": "/dashboard/churn-prediction",

      "churn probability": "/dashboard/churn-prediction",
      "predict churn probability": "/dashboard/churn-prediction",
      "churn probability prediction": "/dashboard/churn-prediction",
      "customer churn probability": "/dashboard/churn-prediction",

      "customer prediction": "/dashboard/churn-prediction",
      "customer prediction model": "/dashboard/churn-prediction",
      "customer behavior prediction": "/dashboard/churn-prediction",

      "customer information": "/dashboard/churn-prediction",
      "customer data": "/dashboard/churn-prediction",
      "customer details": "/dashboard/churn-prediction",

      "prediction output": "/dashboard/churn-prediction",
      "model output": "/dashboard/churn-prediction",
      "prediction result": "/dashboard/churn-prediction",
      "prediction results": "/dashboard/churn-prediction",

      "churn factors": "/dashboard/churn-prediction",
      "key churn factors": "/dashboard/churn-prediction",
      "churn drivers": "/dashboard/churn-prediction",
      "customer churn factors": "/dashboard/churn-prediction",

      "customer risk": "/dashboard/churn-prediction",
      "customer risk analysis": "/dashboard/churn-prediction",
      "customer risk prediction": "/dashboard/churn-prediction",

      "random forest churn": "/dashboard/churn-prediction",
      "random forest prediction": "/dashboard/churn-prediction",
      "ml churn prediction": "/dashboard/churn-prediction",
      "ai churn prediction": "/dashboard/churn-prediction",

      "customer retention dashboard": "/dashboard/churn-prediction",
      "retention prediction": "/dashboard/churn-prediction",
      "retention model": "/dashboard/churn-prediction",
      "retention insights": "/dashboard/churn-prediction",


      // QUALITY DASHBOARD
      "quality": "/dashboard/quality-dashboard",
      "quality dashboard": "/dashboard/quality-dashboard",
      "quality analysis": "/dashboard/quality-dashboard",
      "quality metrics": "/dashboard/quality-dashboard",
      "quality control": "/dashboard/quality-dashboard",
      "product quality": "/dashboard/quality-dashboard",
      "quality insights": "/dashboard/quality-dashboard",
      "system quality": "/dashboard/quality-dashboard",
      "system health": "/dashboard/quality-dashboard",
      "infrastructure quality": "/dashboard/quality-dashboard",
      "system performance": "/dashboard/quality-dashboard",
      "quality performance": "/dashboard/quality-dashboard",
      "quality monitoring": "/dashboard/quality-dashboard",
      "quality score": "/dashboard/quality-dashboard",
      "overall quality score": "/dashboard/quality-dashboard",
      "system score": "/dashboard/quality-dashboard",
      "quality rating": "/dashboard/quality-dashboard",
      "quality status": "/dashboard/quality-dashboard",
      "defects": "/dashboard/quality-dashboard",
      "defect analysis": "/dashboard/quality-dashboard",
      "error analysis": "/dashboard/quality-dashboard",
      "errors": "/dashboard/quality-dashboard",
      "fatal errors": "/dashboard/quality-dashboard",
      "system errors": "/dashboard/quality-dashboard",
      "bug tracking": "/dashboard/quality-dashboard",
      "quality tasks": "/dashboard/quality-dashboard",
      "tasks": "/dashboard/quality-dashboard",
      "quality samples": "/dashboard/quality-dashboard",
      "samples": "/dashboard/quality-dashboard",
      "test samples": "/dashboard/quality-dashboard",
      "quality testing": "/dashboard/quality-dashboard",
      "quality trend": "/dashboard/quality-dashboard",
      "quality trends": "/dashboard/quality-dashboard",
      "monthly quality": "/dashboard/quality-dashboard",
      "quality report": "/dashboard/quality-dashboard",
      "quality reports": "/dashboard/quality-dashboard",
      "quality data": "/dashboard/quality-dashboard",
      "export quality": "/dashboard/quality-dashboard",
      "export csv": "/dashboard/quality-dashboard",
      "download quality report": "/dashboard/quality-dashboard",
      "trend": "/dashboard/quality-dashboard",
      "monthly trend": "/dashboard/quality-dashboard",
      "monthly quality trend": "/dashboard/quality-dashboard",
      "quality performance trend": "/dashboard/quality-dashboard",
      "performance trend": "/dashboard/quality-dashboard",
      "trend analysis": "/dashboard/quality-dashboard",
      "quality trend analysis": "/dashboard/quality-dashboard",
      "product health": "/dashboard/quality-dashboard",
      "product health report": "/dashboard/quality-dashboard",
      "product health analysis": "/dashboard/quality-dashboard",
      "product health dashboard": "/dashboard/quality-dashboard",
      "margins": "/dashboard/quality-dashboard",
      "product margins": "/dashboard/quality-dashboard",
      "profit margins": "/dashboard/quality-dashboard",
      
      
      "analysis by category": "/dashboard/quality-dashboard",
      "category analysis": "/dashboard/quality-dashboard",
      "category quality": "/dashboard/quality-dashboard",
      "product category analysis": "/dashboard/quality-dashboard",
      "category insights": "/dashboard/quality-dashboard",
      "insights": "/dashboard/quality-dashboard",
      "recent insights": "/dashboard/quality-dashboard",
      "quality insights panel": "/dashboard/quality-dashboard",
      "quality intelligence": "/dashboard/quality-dashboard",
      "quality findings": "/dashboard/quality-dashboard",

        // SALES ANALYSIS
      "sales": "/dashboard/sales-analysis",
      "sales analysis": "/dashboard/sales-analysis",
      "sales analytics": "/dashboard/sales-analysis",
      "sales data": "/dashboard/sales-analysis",
      "sales insights": "/dashboard/sales-analysis",
      "sales trends": "/dashboard/sales-analysis",
      "sales report": "/dashboard/sales-analysis",
      "revenue analysis": "/dashboard/sales-analysis",
      "sales performance": "/dashboard/sales-analysis",

      "sales intelligence": "/dashboard/sales-analysis",
      "sales dashboard": "/dashboard/sales-analysis",
      "sales intelligence dashboard": "/dashboard/sales-analysis",
      "business sales": "/dashboard/sales-analysis",

      "revenue": "/dashboard/sales-analysis",
      "revenue data": "/dashboard/sales-analysis",
      "revenue report": "/dashboard/sales-analysis",
      "revenue trends": "/dashboard/sales-analysis",
      "revenue growth": "/dashboard/sales-analysis",
      "revenue projection": "/dashboard/sales-analysis",

      "projected growth": "/dashboard/sales-analysis",
      "revenue forecast": "/dashboard/sales-analysis",
      "growth forecast": "/dashboard/sales-analysis",
      "growth analysis": "/dashboard/sales-analysis",

      "gross margin": "/dashboard/sales-analysis",
      "profit margin": "/dashboard/sales-analysis",
      "margin analysis": "/dashboard/sales-analysis",
      "margin report": "/dashboard/sales-analysis",

      "order value": "/dashboard/sales-analysis",
      "average order value": "/dashboard/sales-analysis",
      "avg order value": "/dashboard/sales-analysis",
      "order analytics": "/dashboard/sales-analysis",
      "order metrics": "/dashboard/sales-analysis",

      "customer ltv": "/dashboard/sales-analysis",
      "customer lifetime value": "/dashboard/sales-analysis",
      "ltv": "/dashboard/sales-analysis",
      "customer revenue": "/dashboard/sales-analysis",
      "customer value": "/dashboard/sales-analysis",

      "category sales": "/dashboard/sales-analysis",
      "sales by category": "/dashboard/sales-analysis",
      "category revenue": "/dashboard/sales-analysis",
      "product sales": "/dashboard/sales-analysis",
      "sales categories": "/dashboard/sales-analysis",

      "transactions": "/dashboard/sales-analysis",
      "sales transactions": "/dashboard/sales-analysis",
      "transaction analysis": "/dashboard/sales-analysis",
      "high value transactions": "/dashboard/sales-analysis",
      "transaction report": "/dashboard/sales-analysis",

      "ai insights": "/dashboard/sales-analysis",
      "ai growth insights": "/dashboard/sales-analysis",
      "sales ai": "/dashboard/sales-analysis",
      "ai sales analysis": "/dashboard/sales-analysis",
      "sales predictions": "/dashboard/sales-analysis",
      "generate report": "/dashboard/sales-analysis",
      "sales report generator": "/dashboard/sales-analysis",
      "sales reports": "/dashboard/sales-analysis",
      "download sales report": "/dashboard/sales-analysis",

      // SETTINGS
      "settings": "/dashboard/settings",
      "setting": "/dashboard/settings",
      "account settings": "/dashboard/settings",
      "profile settings": "/dashboard/settings",
      "app settings": "/dashboard/settings",
      "system settings": "/dashboard/settings",
      "preferences": "/dashboard/settings",
      "configuration": "/dashboard/settings",
      "setup": "/dashboard/settings",
      "business": "/dashboard/settings",
      "business profile": "/dashboard/settings",
      "business info": "/dashboard/settings",
      "business information": "/dashboard/settings",
      "company": "/dashboard/settings",
      "company profile": "/dashboard/settings",
      "company info": "/dashboard/settings",
      "owner": "/dashboard/settings",
      "owner details": "/dashboard/settings",
      "business details": "/dashboard/settings",
      "logo": "/dashboard/settings",
      "business logo": "/dashboard/settings",
      "upload logo": "/dashboard/settings",
      "change logo": "/dashboard/settings",
      "brand logo": "/dashboard/settings",
      "branding": "/dashboard/settings",
      "gst": "/dashboard/settings",
      "gst number": "/dashboard/settings",
      "tax": "/dashboard/settings",
      "tax settings": "/dashboard/settings",
      "pan": "/dashboard/settings",
      "pan number": "/dashboard/settings",
      "registration": "/dashboard/settings",
      "business registration": "/dashboard/settings",
      "business reg": "/dashboard/settings",
      "phone": "/dashboard/settings",
      "contact": "/dashboard/settings",
      "contact details": "/dashboard/settings",
      "business contact": "/dashboard/settings",
      "profile": "/dashboard/settings",
      "store profile": "/dashboard/settings",
      "store settings": "/dashboard/settings",
      "store information": "/dashboard/settings",
    }

    for (const key in routes) {
      if (q.includes(key)) {
        router.push(routes[key])
        return
      }
    }

    // fallback
    router.push("/dashboard")
  }

  return (
    <header
      className="h-14 flex items-center gap-4 px-6 flex-shrink-0 relative z-[50]"
      style={{
        borderBottom: "1px solid rgba(71,255,134,0.08)",
        background: "rgba(5,12,8,0.80)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Search bar */}
      <div
        className="flex items-center gap-2 flex-1 max-w-sm rounded-lg px-3 py-1.5"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(71,255,134,0.10)",
        }}
      >
        <Search style={{ width: 13, height: 13, color: "rgba(255,255,255,0.30)", flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search market data, products, or AI predictions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearch}
          style={{
            background: "none",
            border: "none",
            outline: "none",
            fontSize: 12,
            color: "rgba(255,255,255,0.55)",
            width: "100%",
          }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Bell Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all relative"
          style={{
            background: showNotifications ? "rgba(71,255,134,0.15)" : "rgba(255,255,255,0.04)",
            border: showNotifications ? "1px solid rgba(71,255,134,0.3)" : "1px solid rgba(71,255,134,0.12)",
            color: showNotifications ? "#47ff86" : "rgba(255,255,255,0.45)",
            cursor: "pointer",
          }}
          aria-label="Notifications"
        >
          <Bell style={{ width: 14, height: 14 }} />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border border-[#050c08] rounded-full"></span>
          )}
        </button>

        {showNotifications && (
          <div
            className="absolute right-0 top-11 w-80 rounded-xl flex flex-col overflow-hidden shadow-2xl z-[9999] border origin-top-right animate-in fade-in zoom-in-95 duration-200"
            style={{
              background: "rgba(10,20,14,0.98)",
              borderColor: "rgba(71,255,134,0.2)",
              backdropFilter: "blur(24px)",
              boxShadow: "0 10px 40px -10px rgba(0,0,0,0.8), 0 0 20px -5px rgba(71,255,134,0.15)"
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b bg-white/[0.02]"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <span className="text-sm font-bold text-white flex items-center gap-2">
                Notifications
                {notifications.length > 0 && (
                  <span className="bg-[#47ff86]/20 text-[#47ff86] text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {notifications.length}
                  </span>
                )}
              </span>

              {notifications.length > 0 && (
                <button
                  onClick={() => setNotifications([])}
                  className="text-[10px] font-semibold text-muted-foreground hover:text-[#47ff86] transition-colors uppercase tracking-wider"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="max-h-[320px] overflow-y-auto flex flex-col">
              {notifications.length === 0 ? (
                <div className="p-8 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-white/[0.03] border border-white/5">
                    <Bell className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-white mb-1">Your inbox is empty</p>
                  <p className="text-xs text-muted-foreground">You have no new notifications.</p>
                </div>
              ) : (
                notifications.map((n, i) => (
                  <div
                    key={n.id}
                    className="p-4 border-b last:border-0 hover:bg-[#47ff86]/[0.03] cursor-pointer transition-all flex items-start gap-3 relative group"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background: i === 0 ? "rgba(71,255,134,0.15)" : "rgba(255,255,255,0.05)",
                        border: i === 0 ? "1px solid rgba(71,255,134,0.3)" : "1px solid rgba(255,255,255,0.1)"
                      }}
                    >
                      <Bell
                        className="w-3.5 h-3.5"
                        style={{ color: i === 0 ? "#47ff86" : "rgba(255,255,255,0.6)" }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white mb-0.5 group-hover:text-[#47ff86] transition-colors">
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{n.desc}</p>
                      <p className="text-[10px] font-medium text-[#47ff86]/60 mt-1.5">{n.time}</p>
                    </div>

                    {i === 0 && (
                      <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#47ff86] shadow-[0_0_8px_rgba(71,255,134,0.6)]"></span>
                    )}
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div
                className="p-2 border-t text-center bg-black/20"
                style={{ borderColor: "rgba(255,255,255,0.04)" }}
              >
                <button className="text-[11px] font-medium text-muted-foreground hover:text-white transition-colors w-full py-1.5">
                  View all settings
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      <button
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
        style={{
          background: "rgba(71,255,134,0.10)",
          border: "1px solid rgba(71,255,134,0.20)",
          color: "#47ff86",
          cursor: "pointer",
        }}
        aria-label="Apps"
      >
        <LayoutGrid style={{ width: 14, height: 14 }} />
      </button>
    </header>
  )
}