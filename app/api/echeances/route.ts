import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const now = new Date()
  const in60days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

  const [devisExpirants, livraisonsPlanifiees, productionsEnCours, commandesDateLivraison] =
    await Promise.all([
      // Devis envoyés dont la date de validité est dans les 60 prochains jours ou déjà passée
      prisma.devis.findMany({
        where: {
          status: { in: ["ENVOYE", "EN_ATTENTE_VALIDATION", "VALIDE"] },
          dateValidite: { lte: in60days },
        },
        orderBy: { dateValidite: "asc" },
        select: {
          id: true,
          numero: true,
          status: true,
          dateValidite: true,
          total: true,
          devise: true,
          client: { select: { id: true, raisonSociale: true } },
        },
      }),

      // Livraisons planifiées ou en cours
      prisma.livraison.findMany({
        where: { status: { in: ["PLANIFIEE", "EN_COURS"] } },
        orderBy: { datePrevue: "asc" },
        select: {
          id: true,
          status: true,
          datePrevue: true,
          adresseLivraison: true,
          commande: { select: { id: true, numero: true } },
          client: { select: { id: true, raisonSociale: true } },
          assignedTo: { select: { name: true } },
        },
      }),

      // Productions avec dateFinProductionPrevue dans les 60j ou dépassée
      prisma.production.findMany({
        where: {
          status: { in: ["EN_ATTENTE", "EN_COURS"] },
          dateFinProductionPrevue: { not: null, lte: in60days },
        },
        orderBy: { dateFinProductionPrevue: "asc" },
        select: {
          id: true,
          status: true,
          numeroBCF: true,
          dateFinProductionPrevue: true,
          dateFinProductionReelle: true,
          fournisseur: { select: { nom: true, pays: true } },
          commande: { select: { id: true, numero: true, client: { select: { raisonSociale: true } } } },
        },
      }),

      // Commandes avec dateLivraisonPrevue dans les 60j
      prisma.commande.findMany({
        where: {
          status: { notIn: ["LIVREE", "ANNULEE"] },
          dateLivraisonPrevue: { not: null, lte: in60days },
        },
        orderBy: { dateLivraisonPrevue: "asc" },
        select: {
          id: true,
          numero: true,
          status: true,
          dateLivraisonPrevue: true,
          montantTotal: true,
          devise: true,
          client: { select: { id: true, raisonSociale: true } },
        },
      }),
    ])

  return NextResponse.json({
    devisExpirants,
    livraisonsPlanifiees,
    productionsEnCours,
    commandesDateLivraison,
  })
}
