"use client"

import dynamic from "next/dynamic"

const LoginCard = dynamic(() => import("@/components/login-card"), { ssr: false })

export default function LoginClientWrapper() {
  return (
    <main style={{ minHeight: "100vh", width: "100%", display: "flex" }}>
      <LoginCard />
    </main>
  )
}
