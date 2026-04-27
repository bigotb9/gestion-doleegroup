import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requirePermission("devis:send")
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

  await logAudit({
    userId: session!.user.id,
    userEmail: session!.user.email,
    action: "SEND",
    entity: "DEVIS",
    entityId: devis.id,
    entityRef: devis.numero,
  })

  return NextResponse.json(updated)
}
