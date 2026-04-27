import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { Role } from "@prisma/client"
import { canDo, type Action } from "@/lib/permissions"

export async function requireAuth(allowedRoles?: Role[]) {
  const session = await auth()

  if (!session?.user?.id) {
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

export async function requirePermission(action: Action) {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
      session: null,
    }
  }

  const permissions = (session.user.permissions ?? null) as string[] | null
  if (!canDo(session.user.role as Role, action, permissions)) {
    return {
      error: NextResponse.json({ error: "Permission insuffisante" }, { status: 403 }),
      session: null,
    }
  }

  return { error: null, session }
}
