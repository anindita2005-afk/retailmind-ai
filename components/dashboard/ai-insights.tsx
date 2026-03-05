import { Brain, TrendingUp, AlertCircle, Zap, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const insights = [
  {
    type: "opportunity",
    icon: TrendingUp,
    title: "Electronics demand surge predicted",
    body: "AI model forecasts 23% spike in consumer electronics over next 6 weeks, driven by seasonal patterns and competitor pricing gaps.",
    severity: "positive",
    time: "2 min ago",
  },
  {
    type: "alert",
    icon: AlertCircle,
    title: "Supply chain disruption risk",
    body: "Tier-2 supplier network shows early-warning signals in Southeast Asia corridor. Recommended: diversify sourcing.",
    severity: "warning",
    time: "18 min ago",
  },
  {
    type: "action",
    icon: Zap,
    title: "Pricing optimization available",
    body: "Dynamic pricing algorithm identified 147 SKUs where 5-12% price increase won't reduce conversion — potential +$2.1M revenue.",
    severity: "info",
    time: "1 hr ago",
  },
]

const severityConfig = {
  positive: {
    dot: "bg-chart-2",
    badge: "bg-chart-2/15 text-chart-2",
    border: "border-chart-2/20 hover:border-chart-2/40",
  },
  warning: {
    dot: "bg-chart-4",
    badge: "bg-chart-4/15 text-chart-4",
    border: "border-chart-4/20 hover:border-chart-4/40",
  },
  info: {
    dot: "bg-primary",
    badge: "bg-primary/15 text-primary",
    border: "border-primary/20 hover:border-primary/40",
  },
}

export default function AiInsights() {
  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground leading-none">
              AI Insights
            </h2>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">
              Powered by RetailIQ Intelligence
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
          <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
          Live
        </span>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {insights.map((insight, i) => {
          const cfg = severityConfig[insight.severity as keyof typeof severityConfig]
          return (
            <div
              key={i}
              className={cn(
                "rounded-lg p-3.5 border bg-card/40 transition-all cursor-pointer group",
                cfg.border
              )}
            >
              <div className="flex items-start gap-2.5">
                <span className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", cfg.dot)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground leading-tight">
                      {insight.title}
                    </p>
                    <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                    {insight.body}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize", cfg.badge)}>
                      {insight.type}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{insight.time}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button className="w-full py-2 text-xs font-medium text-primary hover:text-primary/80 border border-primary/20 hover:border-primary/40 rounded-lg transition-all hover:bg-primary/5">
        View all insights
      </button>
    </div>
  )
}
