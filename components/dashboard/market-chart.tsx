"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

const data = [
  { month: "Jan", retail: 4200, ecommerce: 2800, marketplace: 1900 },
  { month: "Feb", retail: 3900, ecommerce: 3100, marketplace: 2100 },
  { month: "Mar", retail: 4800, ecommerce: 3400, marketplace: 2300 },
  { month: "Apr", retail: 4600, ecommerce: 3200, marketplace: 2500 },
  { month: "May", retail: 5200, ecommerce: 3800, marketplace: 2700 },
  { month: "Jun", retail: 5500, ecommerce: 4200, marketplace: 3000 },
  { month: "Jul", retail: 5100, ecommerce: 4500, marketplace: 3200 },
  { month: "Aug", retail: 5800, ecommerce: 4800, marketplace: 3400 },
  { month: "Sep", retail: 6100, ecommerce: 5100, marketplace: 3700 },
  { month: "Oct", retail: 6500, ecommerce: 5400, marketplace: 4000 },
  { month: "Nov", retail: 7200, ecommerce: 6100, marketplace: 4500 },
  { month: "Dec", retail: 8100, ecommerce: 6800, marketplace: 5100 },
]

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg px-3 py-2.5 border border-border text-xs">
      <p className="font-semibold text-foreground mb-1.5">{label} 2025</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-0.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: entry.color }}
          />
          <span className="text-muted-foreground capitalize">{entry.name}:</span>
          <span className="font-medium text-foreground">
            ${(entry.value / 1000).toFixed(1)}B
          </span>
        </div>
      ))}
    </div>
  )
}

export default function MarketChart() {
  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground leading-none">
            Market Revenue Trends
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Retail, E-commerce & Marketplace — FY 2025
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {[
            { label: "1M", active: false },
            { label: "3M", active: false },
            { label: "1Y", active: true },
            { label: "ALL", active: false },
          ].map((btn) => (
            <button
              key={btn.label}
              className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium ${
                btn.active
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRetail" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorEcommerce" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00e896" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00e896" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorMarketplace" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.25 0.04 240)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "oklch(0.55 0.04 235)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "oklch(0.55 0.04 235)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}B`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="retail"
              name="Retail"
              stroke="#00d4ff"
              strokeWidth={2}
              fill="url(#colorRetail)"
              dot={false}
              activeDot={{ r: 4, fill: "#00d4ff" }}
            />
            <Area
              type="monotone"
              dataKey="ecommerce"
              name="E-commerce"
              stroke="#00e896"
              strokeWidth={2}
              fill="url(#colorEcommerce)"
              dot={false}
              activeDot={{ r: 4, fill: "#00e896" }}
            />
            <Area
              type="monotone"
              dataKey="marketplace"
              name="Marketplace"
              stroke="#a78bfa"
              strokeWidth={2}
              fill="url(#colorMarketplace)"
              dot={false}
              activeDot={{ r: 4, fill: "#a78bfa" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 pt-1 border-t border-border">
        {[
          { label: "Retail", color: "#00d4ff", value: "+18.2%" },
          { label: "E-commerce", color: "#00e896", value: "+24.6%" },
          { label: "Marketplace", color: "#a78bfa", value: "+31.4%" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: item.color }}
            />
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span
              className="text-xs font-semibold"
              style={{ color: item.color }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
