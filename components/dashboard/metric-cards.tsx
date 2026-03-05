import { TrendingUp, TrendingDown, DollarSign, BarChart2, ShieldAlert, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

const metrics = [
  {
    label: "Revenue Intelligence",
    value: "$4.82B",
    change: "+12.4%",
    trend: "up",
    sub: "vs. last quarter",
    icon: DollarSign,
    color: "text-chart-1",
    bg: "bg-chart-1/10",
    border: "border-chart-1/20",
  },
  {
    label: "Market Share Index",
    value: "68.3",
    change: "+3.7 pts",
    trend: "up",
    sub: "vs. last period",
    icon: BarChart2,
    color: "text-chart-2",
    bg: "bg-chart-2/10",
    border: "border-chart-2/20",
  },
  {
    label: "Demand Forecast",
    value: "91.6%",
    change: "+1.2%",
    trend: "up",
    sub: "accuracy score",
    icon: Activity,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    label: "Risk Score",
    value: "Low",
    change: "-0.8",
    trend: "down-good",
    sub: "risk index",
    icon: ShieldAlert,
    color: "text-chart-4",
    bg: "bg-chart-4/10",
    border: "border-chart-4/20",
  },
]

export default function MetricCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <div
          key={m.label}
          className={cn(
            "glass rounded-xl p-5 flex flex-col gap-3 hover:border-primary/30 transition-all group",
            m.border
          )}
        >
          <div className="flex items-start justify-between">
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                m.bg,
                `border ${m.border}`
              )}
            >
              <m.icon className={cn("w-4.5 h-4.5", m.color)} />
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
                m.trend === "up"
                  ? "bg-chart-2/15 text-chart-2"
                  : m.trend === "down-good"
                  ? "bg-chart-2/15 text-chart-2"
                  : "bg-destructive/15 text-destructive"
              )}
            >
              {m.trend === "up" || m.trend === "down-good" ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {m.change}
            </span>
          </div>

          <div>
            <div
              className={cn(
                "text-2xl font-bold tracking-tight leading-none",
                m.color
              )}
            >
              {m.value}
            </div>
            <div className="text-sm font-medium text-foreground mt-1 leading-none">
              {m.label}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{m.sub}</div>
          </div>

          {/* Mini sparkline */}
          <div className="h-1 w-full rounded-full bg-border overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all group-hover:w-full",
                m.color.replace("text-", "bg-")
              )}
              style={{ width: m.trend === "down-good" ? "30%" : `${60 + Math.random() * 30}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
