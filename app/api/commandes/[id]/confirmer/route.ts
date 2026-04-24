import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"
import { logAudit } from "@/lib/audit"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth(["MANAGER"])
  const { id } = await params
  if (error) return error

  const commande = await prisma.commande.findUnique({ where: { id: id } })
  if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
  if (commande.status !== "EN_ATTENTE_CONFIRMATION") {
    return NextResponse.json({ error: "La commande n'est pas en attente de confirmation" }, { status: 400 })
  }

  const updated = await prisma.commande.update({
    where: { id: id },
    data: {
      status: "CONFIRMEE",
      confirmedById: session!.user.id,
    },
  })

  // Notify all active users
  const users = await prisma.user.findMany({
    where: { isActive: true, id: { not: session!.user.id } },
    select: { id: true },
  })
  await Promise.all(
    users.map((u: { id: string }) =>
      createNotification(u.id, "Commande confirmée", `La commande ${commande.numero} a été confirmée.`, "success", `/commandes/${commande.id}`)
    )
  )

  await logAudit({
    userId: session!.user.id,
    userEmail: session!.user.email,
    action: "CONFIRM",
    entity: "COMMANDE",
    entityId: id,
    entityRef: commande.numero,
  })

  return NextResponse.json(updated)
}
