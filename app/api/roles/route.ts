import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { error } = await requirePermission("users:manage")
  if (error) return error

  const roles = await prisma.customRole.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  })

  return NextResponse.json(roles)
}

export async function POST(req: NextRequest) {
  const { error } = await requirePermission("users:manage")
  if (error) return error

  const { name, description, permissions } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: "Le nom du rôle est obligatoire" }, { status: 400 })
  }

  const existing = await prisma.customRole.findUnique({ where: { name: name.trim() } })
  if (existing) {
    return NextResponse.json({ error: "Un rôle avec ce nom existe déjà" }, { status: 409 })
  }

  const role = await prisma.customRole.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      permissions: JSON.stringify(Array.isArray(permissions) ? permissions : []),
    },
  })

  return NextResponse.json(role, { status: 201 })
}
