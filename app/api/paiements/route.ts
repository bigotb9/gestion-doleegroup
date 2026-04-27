import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(["MANAGER", "SECRETAIRE"])
  if (error) return error

  const { commandeId, type, montant, dateReception, modePaiement, reference, justificatifUrl } = await req.json()

  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    include: { paiements: { where: { isConfirmed: true } } },
  })
  if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

  const paiement = await prisma.paiement.create({
    data: {
      commandeId,
      type,
      montant,
      dateReception: new Date(dateReception),
      modePaiement,
      reference,
      justificatifUrl,
    },
  })

  // Recalculate payment status
  const totalPaye = commande.paiements.reduce((acc: number, p: { montant: unknown }) => acc + Number(p.montant), 0) + Number(montant)
  const montantTotal = Number(commande.montantTotal)
  const montantAvance = commande.montantAvance ? Number(commande.montantAvance) : 0

  let statusPaiement = commande.statusPaiement
  if (totalPaye >= montantTotal) {
    statusPaiement = "PAIEMENT_COMPLET"
  } else if (totalPaye >= montantAvance && montantAvance > 0) {
    statusPaiement = "AVANCE_RECUE"
  }

  await prisma.commande.update({
    where: { id: commandeId },
    data: { statusPaiement },
  })

  await logAudit({
    userId: session!.user.id,
    userEmail: session!.user.email,
    action: "CREATE",
    entity: "PAIEMENT",
    entityId: paiement.id,
    entityRef: commande.numero,
    details: `${type} — ${Number(montant).toFixed(0)} — ${modePaiement}${reference ? ` — Réf: ${reference}` : ""}`,
  })

  return NextResponse.json(paiement, { status: 201 })
}
