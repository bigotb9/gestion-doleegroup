import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requirePermission("production:read")
  const { id } = await params
  if (error) return error

  const fournisseur = await prisma.fournisseur.findUnique({
    where: { id: id },
    include: { productions: { include: { commande: { select: { id: true, numero: true, status: true } } } } },
  })

  if (!fournisseur) return NextResponse.json({ error: "Fournisseur introuvable" }, { status: 404 })
  return NextResponse.json(fournisseur)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requirePermission("production:manage")
  const { id } = await params
  if (error) return error

  const body = await req.json()

  const fournisseur = await prisma.fournisseur.update({
    where: { id: id },
    data: body,
  })
  return NextResponse.json(fournisseur)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requirePermission("production:manage")
  const { id } = await params
  if (error) return error

  await prisma.fournisseur.delete({ where: { id: id } })
  return NextResponse.json({ success: true })
}
