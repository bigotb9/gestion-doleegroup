import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER"])
  const { id } = await params
  if (error) return error

  const devis = await prisma.devis.findUnique({ where: { id } })
  if (!devis) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })
  if (!["ENVOYE", "VALIDE"].includes(devis.status)) {
    return NextResponse.json({ error: "Le devis doit être envoyé ou validé pour être refusé" }, { status: 400 })
  }

  const updated = await prisma.devis.update({
    where: { id },
    data: { status: "REFUSE" },
  })

  return NextResponse.json(updated)
}
