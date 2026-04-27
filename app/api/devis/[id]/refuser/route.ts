import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requirePermission("devis:validate")
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

  await logAudit({
    userId: session!.user.id,
    userEmail: session!.user.email,
    action: "REFUSE",
    entity: "DEVIS",
    entityId: devis.id,
    entityRef: devis.numero,
  })

  return NextResponse.json(updated)
}
