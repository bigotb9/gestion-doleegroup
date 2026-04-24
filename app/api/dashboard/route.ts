import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(["MANAGER"])
  if (error) return error

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const [
    commandesByStatus,
    paiementsThisMonth,
    paiementsThisYear,
    commandesEnAttente,
    devisEnAttente,
    livraisonsPlanifiees,
    stockAlerts,
    recentCommandes,
  ] = await Promise.all([
    prisma.commande.groupBy({
      by: ["status"],
      _count: { id: true },
    }),

    prisma.paiement.aggregate({
      where: { isConfirmed: true, dateReception: { gte: startOfMonth } },
      _sum: { montant: true },
    }),

    prisma.paiement.aggregate({
      where: { isConfirmed: true, dateReception: { gte: startOfYear } },
      _sum: { montant: true },
    }),

    prisma.commande.count({ where: { status: "EN_ATTENTE_CONFIRMATION" } }),

    prisma.devis.count({ where: { status: { in: ["BROUILLON", "EN_ATTENTE_VALIDATION"] } } }),

    prisma.livraison.count({ where: { status: "PLANIFIEE" } }),

    // Raw query to compare two columns (quantite <= quantiteMin)
    prisma.$queryRaw<Array<{ id: string; reference: string; nom: string; quantite: number; quantiteMin: number }>>`
      SELECT id, reference, nom, quantite, "quantiteMin"
      FROM "ArticleStock"
      WHERE quantite <= "quantiteMin"
    `,

    prisma.commande.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        numero: true,
        status: true,
        montantTotal: true,
        createdAt: true,
        client: { select: { id: true, raisonSociale: true } },
      },
    }),
  ])

  const statusMap = Object.fromEntries(
    commandesByStatus.map((g: { status: string; _count: { id: number } }) => [g.status, g._count.id])
  )

  return NextResponse.json({
    commandesByStatus: statusMap,
    revenueThisMonth: Number(paiementsThisMonth._sum.montant ?? 0),
    revenueThisYear: Number(paiementsThisYear._sum.montant ?? 0),
    commandesEnAttente,
    devisEnAttente,
    livraisonsPlanifiees,
    stockAlerts,
    recentCommandes,
  })
}
