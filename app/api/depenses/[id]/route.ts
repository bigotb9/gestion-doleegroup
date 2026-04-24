import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER"])
  const { id } = await params
  if (error) return error

  const body = await req.json()

  const depense = await prisma.depense.update({
    where: { id },
    data: {
      ...(body.titre != null && { titre: body.titre.trim() }),
      ...(body.montant != null && { montant: Number(body.montant) }),
      ...(body.categorie !== undefined && { categorie: body.categorie || null }),
      ...(body.date != null && { date: new Date(body.date) }),
      ...(body.description !== undefined && { description: body.description?.trim() || null }),
      ...(body.justificatifUrl !== undefined && { justificatifUrl: body.justificatifUrl?.trim() || null }),
    },
  })

  return NextResponse.json(depense)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER"])
  const { id } = await params
  if (error) return error

  await prisma.depense.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
