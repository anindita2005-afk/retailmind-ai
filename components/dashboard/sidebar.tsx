"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  FileText,
  TrendingUp,
  Bot,
  Search,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Layers,
  UserX,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    ],
  },
  {
    section: "Business",
    items: [
      { label: "Products", icon: Package, href: "/dashboard/products" },
      { label: "Orders", icon: ShoppingBag, href: "/dashboard/orders" },
      { label: "Bill Generation", icon: FileText, href: "/dashboard/bills" },
    ],
  },
  {
    section: "Intelligence",
    items: [
      { label: "Market Analysis", icon: TrendingUp, href: "/dashboard/market-analysis" },
      { label: "Product Search", icon: Search, href: "/dashboard/search" },
      { label: "AI Copilot", icon: Bot, href: "/dashboard/copilot" },
    ],
  },
  {
    section: "Projects",
    items: [
      { label: "Market Segmentation", icon: Layers, href: "/dashboard/market-segmentation" },
      { label: "Churn Prediction", icon: UserX, href: "/dashboard/churn-prediction" },
      { label: "Quality Dashboard", icon: ShieldCheck, href: "/dashboard/quality-dashboard" },
      { label: "Sales Analysis", icon: BarChart3, href: "/dashboard/sales-analysis" },
    ],
  },
]

interface Props {
  businessName: string
  displayId: string
  logoUrl?: string | null
}

export default function DashboardSidebar({ businessName, displayId, logoUrl }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  const router = useRouter()

  async function handleLogout() {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/auth/logout`, { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <aside
      className={cn(
        "flex flex-col h-full transition-all duration-300 relative",
        collapsed ? "w-16" : "w-60"
      )}
      style={{
        background: "rgba(5, 12, 8, 0.95)",
        borderRight: "1px solid rgba(71,255,134,0.10)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5"
        style={{ borderBottom: "1px solid rgba(71,255,134,0.08)" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{
            background: "transparent",
            border: "1px solid rgba(71,255,134,0.30)",
            boxShadow: "0 0 14px rgba(71,255,134,0.18)",
          }}
        >
          {/* RetailMind AI logo image */}
          <img
            src="/image copy.png"
            alt="RetailMind AI Logo"
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px" }}
          />
        </div>
        {!collapsed && (
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "-0.01em",
                color: "#fff",
                lineHeight: 1,
              }}
            >
              RetailMind AI
            </div>
            <div
              style={{
                fontSize: 9,
                marginTop: 3,
                letterSpacing: "0.08em",
                color: "#47ff86",
                lineHeight: 1,
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              See Trends &amp; Lead Markets
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-1.5">
        {navItems.map((section) => (
          <div key={section.section}>
            {!collapsed && (
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.28)",
                  padding: "10px 12px 4px",
                  margin: 0,
                }}
              >
                {section.section}
              </p>
            )}
            <ul className="flex flex-col gap-0.5" role="list">
              {section.items.map((item) => {
                const isActive = mounted && pathname === item.href
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all relative group",
                      )}
                      style={
                        isActive
                          ? {
                            background: "rgba(71,255,134,0.12)",
                            color: "#47ff86",
                            border: "1px solid rgba(71,255,134,0.20)",
                            boxShadow: "0 0 12px rgba(71,255,134,0.08)",
                            textDecoration: "none",
                          }
                          : {
                            color: "rgba(255,255,255,0.55)",
                            border: "1px solid transparent",
                            textDecoration: "none",
                          }
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <span
                          style={{
                            position: "absolute",
                            left: 0,
                            top: "20%",
                            height: "60%",
                            width: 3,
                            borderRadius: "0 2px 2px 0",
                            background: "#47ff86",
                            boxShadow: "0 0 8px rgba(71,255,134,0.6)",
                          }}
                        />
                      )}
                      <item.icon
                        style={{
                          width: 15,
                          height: 15,
                          flexShrink: 0,
                          color: isActive ? "#47ff86" : "rgba(255,255,255,0.40)",
                        }}
                      />
                      {!collapsed && (
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.label}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div
        className="p-2 flex flex-col gap-0.5"
        style={{ borderTop: "1px solid rgba(71,255,134,0.08)" }}
      >
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
          style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none" }}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings style={{ width: 15, height: 15, flexShrink: 0 }} />
          {!collapsed && <span>Settings</span>}
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
          style={{ color: "rgba(255,255,255,0.45)", background: "none", border: "none", cursor: "pointer" }}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut style={{ width: 15, height: 15, flexShrink: 0 }} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

      {/* User info */}
      <div
        className={cn("p-3 flex items-center gap-3", collapsed && "justify-center")}
        style={{ borderTop: "1px solid rgba(71,255,134,0.08)" }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
          style={{
            background: logoUrl ? "transparent" : "rgba(71,255,134,0.15)",
            border: logoUrl ? "none" : "1px solid rgba(71,255,134,0.30)",
            color: "#47ff86",
          }}
        >
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            businessName?.charAt(0)?.toUpperCase() || "B"
          )}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }} className="truncate">
              {businessName}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }} className="truncate">
              {displayId}
            </div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center transition-all z-10"
        style={{
          background: "#0a1a0f",
          border: "1px solid rgba(71,255,134,0.25)",
          color: "rgba(255,255,255,0.5)",
        }}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight style={{ width: 11, height: 11 }} />
        ) : (
          <ChevronLeft style={{ width: 11, height: 11 }} />
        )}
      </button>
    </aside>
  )
}
