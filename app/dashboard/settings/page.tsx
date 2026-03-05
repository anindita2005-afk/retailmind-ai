import { redirect } from "next/navigation"
import { getSession, getUserById } from "@/lib/auth"
import DashboardHeader from "@/components/dashboard/header"
import SettingsForm from "@/components/dashboard/settings-form"

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const user = await getUserById(session.id)

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <DashboardHeader title="Settings" subtitle="Manage your business profile" />
      <main className="flex-1 overflow-y-auto p-6">
        <SettingsForm user={user} />
      </main>
    </div>
  )
}
