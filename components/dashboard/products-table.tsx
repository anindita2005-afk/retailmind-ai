import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"


const products = [
  {
    rank: 1,
    category: "Consumer Electronics",
    revenue: "$1.24B",
    growth: "+22.3%",
    trend: "up",
    demand: "High",
    risk: "Low",
    forecast: "+18%",
  },
  {
    rank: 2,
    category: "Fashion & Apparel",
    revenue: "$987M",
    growth: "+14.7%",
    trend: "up",
    demand: "Medium",
    risk: "Low",
    forecast: "+12%",
  },
  {
    rank: 3,
    category: "Home & Garden",
    revenue: "$756M",
    growth: "+9.1%",
    trend: "up",
    demand: "Medium",
    risk: "Low",
    forecast: "+8%",
  },
  {
    rank: 4,
    category: "Health & Wellness",
    revenue: "$634M",
    growth: "+31.4%",
    trend: "up",
    demand: "Very High",
    risk: "Low",
    forecast: "+28%",
  },
  {
    rank: 5,
    category: "Automotive Parts",
    revenue: "$412M",
    growth: "-3.2%",
    trend: "down",
    demand: "Low",
    risk: "High",
    forecast: "-2%",
  },
  {
    rank: 6,
    category: "Food & Grocery",
    revenue: "$1.89B",
    growth: "+5.8%",
    trend: "up",
    demand: "High",
    risk: "Medium",
    forecast: "+4%",
  },
]

const demandColor: Record<string, string> = {
  "Very High": "text-chart-2 bg-chart-2/10",
  High: "text-primary bg-primary/10",
  Medium: "text-chart-4 bg-chart-4/10",
  Low: "text-muted-foreground bg-muted",
}

const riskColor: Record<string, string> = {
  Low: "text-chart-2 bg-chart-2/10",
  Medium: "text-chart-4 bg-chart-4/10",
  High: "text-destructive bg-destructive/10",
}

export default function ProductsTable() {
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground leading-none">
            Category Performance
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Top categories by revenue · AI-ranked
          </p>
        </div>
        <button className="text-xs text-primary hover:underline">
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs" role="table">
          <thead>
            <tr className="border-b border-border">
              {["#", "Category", "Revenue", "Growth", "Demand", "Risk", "Forecast"].map(
                (col) => (
                  <th
                    key={col}
                    className="text-left pb-3 px-1 text-muted-foreground font-medium first:pl-0"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {products.map((row) => (
              <tr
                key={row.rank}
                className="border-b border-border/50 hover:bg-accent/30 transition-colors group cursor-pointer"
              >
                <td className="py-3 pl-0 pr-1 text-muted-foreground font-medium">
                  {row.rank}
                </td>
                <td className="py-3 px-1 font-medium text-foreground whitespace-nowrap">
                  {row.category}
                </td>
                <td className="py-3 px-1 font-semibold text-foreground">
                  {row.revenue}
                </td>
                <td className="py-3 px-1">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 font-semibold",
                      row.trend === "up" ? "text-chart-2" : "text-destructive"
                    )}
                  >
                    {row.trend === "up" ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {row.growth}
                  </span>
                </td>
                <td className="py-3 px-1">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-medium",
                      demandColor[row.demand] ?? ""
                    )}
                  >
                    {row.demand}
                  </span>
                </td>
                <td className="py-3 px-1">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-medium",
                      riskColor[row.risk] ?? ""
                    )}
                  >
                    {row.risk}
                  </span>
                </td>
                <td
                  className={cn(
                    "py-3 px-1 font-semibold",
                    row.forecast.startsWith("+")
                      ? "text-chart-2"
                      : "text-destructive"
                  )}
                >
                  {row.forecast}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
