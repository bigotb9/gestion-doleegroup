import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth(["MANAGER"])
  const { id } = await params
  if (error) return error

  const devis = await prisma.devis.findUnique({ where: { id: id } })
  if (!devis) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })
  if (!["BROUILLON", "EN_ATTENTE_VALIDATION"].includes(devis.status)) {
    return NextResponse.json({ error: "Ce devis ne peut pas être validé" }, { status: 400 })
  }

  const updated = await prisma.devis.update({
    where: { id: id },
    data: {
      status: "VALIDE",
      validatedById: session!.user.id,
      dateValidation: new Date(),
    },
  })

  // Notify secretaires
  const secretaires = await prisma.user.findMany({
    where: { role: "SECRETAIRE", isActive: true },
    select: { id: true },
  })
  await Promise.all(
    secretaires.map((u: { id: string }) =>
      createNotification(u.id, "Devis validé", `Le devis ${devis.numero} a été validé.`, "success", `/devis/${devis.id}`)
    )
  )

  return NextResponse.json(updated)
}
