import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE"])
  const { id } = await params
  if (error) return error

  const devis = await prisma.devis.findUnique({ where: { id: id } })
  if (!devis) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })
  if (devis.status !== "VALIDE") {
    return NextResponse.json({ error: "Le devis doit être validé avant d'être envoyé" }, { status: 400 })
  }

  const updated = await prisma.devis.update({
    where: { id: id },
    data: { status: "ENVOYE" },
  })

  return NextResponse.json(updated)
}
