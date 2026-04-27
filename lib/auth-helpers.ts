import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { Role } from "@prisma/client"
import { canDo, type Action } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

// Fetch user permissions directly from DB — bypasses session/JWT entirely
async function fetchUserPermissions(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      permissions: true,
      isActive: true,
      customRole: { select: { permissions: true } },
    },
  })
  if (!u || !u.isActive) return null

  let perms: string[] | null = null
  if (u.role === "CUSTOM" && u.customRole) {
    // Individual user.permissions takes priority over the shared custom role
    const raw = u.permissions ?? u.customRole.permissions
    try { perms = JSON.parse(raw) } catch { perms = null }
  } else if (u.permissions) {
    try { perms = JSON.parse(u.permissions) } catch { perms = null }
  }

  return { role: u.role as Role, permissions: perms }
}

// For API route handlers: keeps backward-compat role check
export async function requireAuth(allowedRoles?: Role[]) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }), session: null }
  }
  if (allowedRoles && !allowedRoles.includes(session.user.role as Role)) {
    return { error: NextResponse.json({ error: "Accès refusé" }, { status: 403 }), session: null }
  }
  return { error: null, session }
}

// For API route handlers: checks granular permissions via fresh DB query
export async function requirePermission(action: Action) {
  const session = await auth()
  if (!session?.user?.id) {
    console.log(`[requirePermission] action=${action} → 401 (no session)`)
    return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }), session: null }
  }

  const up = await fetchUserPermissions(session.user.id)
  if (!up) {
    console.log(`[requirePermission] action=${action} userId=${session.user.id} → 401 (user not found or inactive)`)
    return { error: NextResponse.json({ error: "Accès refusé" }, { status: 401 }), session: null }
  }

  const allowed = canDo(up.role, action, up.permissions)
  console.log(
    `[requirePermission] userId=${session.user.id} role=${up.role} action=${action} → ${allowed ? "ALLOW" : "DENY"} (perms=${JSON.stringify(up.permissions)})`
  )

  if (!allowed) {
    return { error: NextResponse.json({ error: "Permission insuffisante", debug: { role: up.role, action, perms: up.permissions } }, { status: 403 }), session: null }
  }

  return { error: null, session }
}

// For server component layouts: redirects if permission missing
export async function requirePagePermission(action: Action, fallback = "/dashboard") {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const up = await fetchUserPermissions(session.user.id)
  if (!up) redirect("/login")

  if (!canDo(up.role, action, up.permissions)) redirect(fallback)
}
