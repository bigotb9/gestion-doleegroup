import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  const { id } = await params
  if (error) return error

  const commande = await prisma.commande.findUnique({
    where: { id },
    include: { paiements: { where: { isConfirmed: true } } },
  })

  if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

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
  } else if (confirmedPaiements.length > 0) {
    statusPaiement = "AVANCE_RECUE"
  }

  const updated = await prisma.commande.update({
    where: { id },
    data: { statusPaiement: statusPaiement as never },
    select: { statusPaiement: true },
  })

  return NextResponse.json(updated)
}
