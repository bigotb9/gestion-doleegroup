import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth(["MANAGER"])
  const { id } = await params
  if (error) return error

  const paiement = await prisma.paiement.findUnique({ where: { id: id } })
  if (!paiement) return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 })
  if (paiement.isConfirmed) return NextResponse.json({ error: "Paiement déjà confirmé" }, { status: 400 })

  try {
    const updated = await prisma.paiement.update({
      where: { id: id },
      data: {
        isConfirmed: true,
        confirmedById: session!.user.id,
        dateConfirmation: new Date(),
      },
    })

    // Recompute commande payment status based on all confirmed payments
    const commande = await prisma.commande.findUnique({
      where: { id: paiement.commandeId },
      include: { paiements: { where: { isConfirmed: true } } },
    })

    if (commande) {
      const confirmedPaiements = commande.paiements
      const totalPaye = confirmedPaiements.reduce((acc: number, p: { montant: unknown }) => acc + Number(p.montant), 0)
      const montantTotal = Number(commande.montantTotal)
      const montantAvance = commande.montantAvance ? Number(commande.montantAvance) : 0

      const hasSolde = confirmedPaiements.some((p: { type: string }) => p.type === "SOLDE")
      const hasAvance = confirmedPaiements.some((p: { type: string }) => p.type === "AVANCE")
      const hasComplet = confirmedPaiements.some((p: { type: string }) => p.type === "COMPLET")

      let statusPaiement: string = commande.statusPaiement
      if (totalPaye >= montantTotal || hasSolde || hasComplet) {
        statusPaiement = "PAIEMENT_COMPLET"
      } else if (hasAvance || (montantAvance > 0 && totalPaye >= montantAvance)) {
        statusPaiement = "AVANCE_RECUE"
      }

      await prisma.commande.update({
        where: { id: paiement.commandeId },
        data: { statusPaiement: statusPaiement as never },
      })

      // Mise à jour automatique du statutReglement sur toutes les factures de la commande
      const statutReglement =
        totalPaye >= montantTotal ? "COMPLET" : totalPaye > 0 ? "PARTIEL" : null

      await prisma.facture.updateMany({
        where: { commandeId: paiement.commandeId },
        data: { statutReglement },
      })
    }

    await logAudit({
      userId: session!.user.id,
      userEmail: session!.user.email,
      action: "CONFIRM",
      entity: "PAIEMENT",
      entityId: id,
      entityRef: paiement.commandeId,
      details: `Montant : ${Number(paiement.montant)} — Type : ${paiement.type}`,
    })

    return NextResponse.json(updated)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur"
    console.error("[confirmer paiement]", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
