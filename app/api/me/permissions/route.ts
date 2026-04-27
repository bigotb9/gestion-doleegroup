import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ALL_ACTIONS, canDo, getDefaultPermissions } from "@/lib/permissions"
import { Role } from "@prisma/client"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const u = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      permissions: true,
      customRoleId: true,
      customRole: { select: { id: true, name: true, permissions: true } },
    },
  })

  if (!u) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  }

  const userPermsRaw = u.permissions
  const customRolePermsRaw = u.customRole?.permissions ?? null

  let effectivePermissions: string[] | null = null
  let source: string

  if (u.role === "CUSTOM" && u.customRole) {
    if (u.permissions !== null) {
      try {
        effectivePermissions = JSON.parse(u.permissions)
        source = "user.permissions (override individuel)"
      } catch {
        effectivePermissions = null
        source = "user.permissions (parse error → null)"
      }
    } else {
      try {
        effectivePermissions = JSON.parse(u.customRole.permissions)
        source = `customRole "${u.customRole.name}".permissions`
      } catch {
        effectivePermissions = null
        source = "customRole.permissions (parse error → null)"
      }
    }
  } else if (u.permissions) {
    try {
      effectivePermissions = JSON.parse(u.permissions)
      source = "user.permissions (override individuel)"
    } catch {
      effectivePermissions = null
      source = "user.permissions (parse error → null)"
    }
  } else {
    effectivePermissions = null
    source = `défauts du rôle ${u.role}`
  }

  const role = u.role as Role
  const defaultsForRole = getDefaultPermissions(role)
  const actionResults = ALL_ACTIONS.map((action) => ({
    action,
    granted: canDo(role, action, effectivePermissions),
  }))

  return NextResponse.json({
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      customRoleId: u.customRoleId,
      customRoleName: u.customRole?.name ?? null,
    },
    raw: {
      userPermissions: userPermsRaw,
      customRolePermissions: customRolePermsRaw,
    },
    computed: {
      source,
      effectivePermissions,
      defaultsForRole,
    },
    actions: actionResults,
  })
}
