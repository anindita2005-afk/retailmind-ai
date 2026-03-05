"use client"

import dynamic from "next/dynamic"

const RegisterForm = dynamic(() => import("@/components/register-form"), { ssr: false })

export default function RegisterClientWrapper() {
  return (
    <main style={{ minHeight: "100vh", width: "100%", display: "flex" }}>
      <RegisterForm />
    </main>
  )
}
