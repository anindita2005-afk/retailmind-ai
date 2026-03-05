import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import DashboardHeader from "@/components/dashboard/header"
import ChurnPredictionClient from "@/components/dashboard/churn-prediction-client"

export default async function ChurnPredictionPage() {
    const session = await getSession()
    if (!session) redirect("/login")

    return (
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <DashboardHeader title="Churn Prediction" subtitle="ML-powered customer churn analysis using Random Forest" />
            <main className="flex-1 overflow-y-auto p-6">
                <ChurnPredictionClient />
            </main>
        </div>
    )
}
