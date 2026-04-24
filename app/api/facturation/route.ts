import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { generateNumeroFacture } from "@/lib/numero-generator"
import { logAudit } from "@/lib/audit"

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const factures = await prisma.facture.findMany({
    include: {
      commande: { select: { id: true, numero: true, client: { select: { id: true, raisonSociale: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(factures)
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(["MANAGER"])
  if (error) return error

  const { commandeId, type, montantHT, montantTVA, montantTTC, dateEcheance, fneFileUrl } = await req.json()

  const numero = await generateNumeroFacture()

  // FNE est automatiquement "envoyée" dès création ; reçu de caisse démarre en attente
  const statut = type === "FNE" ? "ENVOYEE" : "EN_ATTENTE"

  // Calcul du statut de règlement initial basé sur les paiements déjà confirmés
  const [confirmedPaiements, commande] = await Promise.all([
    prisma.paiement.findMany({
      where: { commandeId, isConfirmed: true },
      select: { montant: true },
    }),
    prisma.commande.findUnique({ where: { id: commandeId }, select: { montantTotal: true } }),
  ])

  let statutReglement: string | null = null
  if (commande) {
    const totalPaye = confirmedPaiements.reduce((s, p) => s + Number(p.montant), 0)
    if (totalPaye >= Number(commande.montantTotal)) {
      statutReglement = "COMPLET"
    } else if (totalPaye > 0) {
      statutReglement = "PARTIEL"
    }
  }

  const facture = await prisma.facture.create({
    data: {
      commandeId,
      type: type ?? "RECU_CAISSE",
      numero,
      montantHT,
      montantTVA: montantTVA ?? 0,
      montantTTC,
      dateEcheance: dateEcheance ? new Date(dateEcheance) : undefined,
      fneFileUrl: fneFileUrl ?? null,
      statut,
      statutReglement,
    },
    include: {
      commande: { select: { id: true, numero: true, client: { select: { id: true, raisonSociale: true } } } },
    },
  })

  await logAudit({
    userId: session?.user.id,
    userEmail: session?.user.email,
    action: "CREATE",
    entity: "FACTURE",
    entityId: facture.id,
    entityRef: facture.numero,
    details: `Type : ${facture.type} — Montant : ${Number(facture.montantTTC)}`,
  })

  return NextResponse.json(facture, { status: 201 })
}
