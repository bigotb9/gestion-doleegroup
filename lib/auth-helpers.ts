import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { Role } from "@prisma/client"

export async function requireAuth(allowedRoles?: Role[]) {
  const session = await auth()

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
      session: null,
    }
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role as Role)) {
    return {
      error: NextResponse.json({ error: "Accès refusé" }, { status: 403 }),
      session: null,
    }
  }

  return { error: null, session }
}
