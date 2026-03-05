// Login page — uses client wrapper to allow dynamic imports with ssr:false
import LoginClientWrapper from "@/components/login-client-wrapper"

export default function LoginPage() {
  return <LoginClientWrapper />
}
