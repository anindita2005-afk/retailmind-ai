import { NextResponse, type NextRequest } from "next/server"
import { jwtVerify } from "jose"

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "retailiq-super-secret-key-change-in-production"
)
const COOKIE_NAME = "retailiq_session"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verify session cookie for dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
    try {
      await jwtVerify(token, SECRET)
    } catch {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      const response = NextResponse.redirect(url)
      response.cookies.delete(COOKIE_NAME)
      return response
    }
  }

  // Redirect logged-in users away from auth pages
  if (pathname === "/login" || pathname === "/register") {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (token) {
      try {
        await jwtVerify(token, SECRET)
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      } catch {
        // invalid token — let them through
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
