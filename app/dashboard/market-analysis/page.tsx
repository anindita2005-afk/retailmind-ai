import DashboardHeader from "@/components/dashboard/header"
import MarketAnalysisClient from "@/components/dashboard/market-analysis-client"

export default async function MarketAnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{
    product?: string
    category?: string
  }>
}) {
  const params = await searchParams

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <DashboardHeader
        title="Market Analysis"
        subtitle="AI-powered market intelligence for your business"
      />
      <main className="flex-1 overflow-y-auto p-6">
        <MarketAnalysisClient
          userCity="Kolkata"
          userState="West Bengal"
          initialQuery={params.product || ""}
          initialCategory={params.category || ""}
        />
      </main>
    </div>
  )
}