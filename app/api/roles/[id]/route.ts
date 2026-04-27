import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requirePermission("users:manage")
  const { id } = await params
  if (error) return error

  const role = await prisma.customRole.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  })

  if (!role) return NextResponse.json({ error: "Rôle introuvable" }, { status: 404 })
  return NextResponse.json(role)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requirePermission("users:manage")
  const { id } = await params
  if (error) return error

  const { name, description, permissions } = await req.json()

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name.trim()
  if (description !== undefined) data.description = description?.trim() || null
  if (permissions !== undefined) data.permissions = JSON.stringify(Array.isArray(permissions) ? permissions : [])

  try {
    const role = await prisma.customRole.update({ where: { id }, data })
    return NextResponse.json(role)
  } catch {
    return NextResponse.json({ error: "Rôle introuvable ou nom déjà utilisé" }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requirePermission("users:manage")
  const { id } = await params
  if (error) return error

  const usersCount = await prisma.user.count({ where: { customRoleId: id } })
  if (usersCount > 0) {
    return NextResponse.json(
      { error: `Ce rôle est assigné à ${usersCount} utilisateur(s). Réassignez-les d'abord.` },
      { status: 400 }
    )
  }

  await prisma.customRole.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
