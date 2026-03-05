import { redirect } from "next/navigation"
import { Suspense } from "react"
import { getSession } from "@/lib/auth"
import DashboardHeader from "@/components/dashboard/header"
import InventorySearchClient from "@/components/dashboard/inventory-search-client"

export default async function InventorySearchPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <DashboardHeader
        title="Inventory Search"
        subtitle="Search products, view stock levels, sales analytics & revenue from bill data"
      />
      <main className="flex-1 overflow-y-auto p-6 bg-[#060B09]">
        <div className="max-w-[1400px] mx-auto w-full">
          <Suspense fallback={null}>
            <InventorySearchClient userId={session.id} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
