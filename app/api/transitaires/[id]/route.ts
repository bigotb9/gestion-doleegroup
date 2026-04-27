import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requirePermission("logistique:read")
  const { id } = await params
  if (error) return error

  const transitaire = await prisma.transitaire.findUnique({
    where: { id },
    include: {
      logistiques: {
        include: {
          commande: { select: { id: true, numero: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!transitaire) return NextResponse.json({ error: "Transitaire introuvable" }, { status: 404 })
  return NextResponse.json(transitaire)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requirePermission("logistique:manage")
  const { id } = await params
  if (error) return error

  const body = await req.json()
  const transitaire = await prisma.transitaire.update({
    where: { id },
    data: body,
  })
  return NextResponse.json(transitaire)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requirePermission("logistique:manage")
  const { id } = await params
  if (error) return error

  await prisma.transitaire.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
