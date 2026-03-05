import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import DashboardHeader from "@/components/dashboard/header"
import MarketSegmentationClient from "@/components/dashboard/market-segmentation-client"

export default async function MarketSegmentationPage() {
    const session = await getSession()
    if (!session) redirect("/login")

    return (
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <DashboardHeader title="Market Segmentation" subtitle="Customer clustering & segment prediction using K-Means" />
            <main className="flex-1 overflow-y-auto p-6">
                <MarketSegmentationClient />
            </main>
        </div>
    )
}
