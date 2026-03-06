import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { db, TABLE_PREFIX } from "@/lib/dynamodb"
import { GetCommand } from "@aws-sdk/lib-dynamodb"
import DashboardSidebar from "@/components/dashboard/sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login")

  let profile = null;
  let user = null;
  let dbError = null;

  try {
    const profileRes = await db.send(new GetCommand({
      TableName: `${TABLE_PREFIX}BusinessProfiles`,
      Key: { user_id: session.id }
    }));
    profile = profileRes.Item;

    const userRes = await db.send(new GetCommand({
      TableName: `${TABLE_PREFIX}Users`,
      Key: { id: session.id }
    }));
    user = userRes.Item;
  } catch (err: any) {
    console.error("Layout DDB Error:", err);
    dbError = err.message;
  }

  const businessName = profile?.business_name ?? session.business_name ?? session.email ?? "Unknown"
  const displayId = user?.display_id ?? session.display_id ?? "RIQ-0000"
  const logoUrl = profile?.logo_url ?? null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar businessName={businessName} displayId={displayId} logoUrl={logoUrl} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {children}
      </div>
    </div>
  )
}
