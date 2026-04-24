import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { Role } from "@prisma/client"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

// Routes accessibles uniquement aux MANAGER
const MANAGER_ONLY_ROUTES = [
  "/parametres/utilisateurs",
  "/parametres/audit",
]

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const role = (session?.user as { role?: Role })?.role

  for (const route of MANAGER_ONLY_ROUTES) {
    if (nextUrl.pathname.startsWith(route) && role !== "MANAGER") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon\\.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp|.*\\.ico|uploads).*)",
  ],
}
