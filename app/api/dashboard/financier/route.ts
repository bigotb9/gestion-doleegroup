import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { error } = await requireAuth(["MANAGER"])
  if (error) return error

  const now = new Date()
  const year = now.getFullYear()

  // 12 derniers mois — CA (paiements confirmés) et dépenses
  const months: { mois: string; ca: number; depenses: number; marge: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(year, now.getMonth() - i, 1)
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })

    const [caAgg, depAgg] = await Promise.all([
      prisma.paiement.aggregate({
        where: { isConfirmed: true, dateReception: { gte: start, lte: end } },
        _sum: { montant: true },
      }),
      prisma.depense.aggregate({
        where: { date: { gte: start, lte: end } },
        _sum: { montant: true },
      }),
    ])

    const ca = Number(caAgg._sum.montant ?? 0)
    const dep = Number(depAgg._sum.montant ?? 0)
    months.push({ mois: label, ca, depenses: dep, marge: ca - dep })
  }

  // Marges par commande LIVREE avec coûts internes renseignés
  const commandesLivrees = await prisma.commande.findMany({
    where: { status: "LIVREE" },
    select: {
      id: true,
      numero: true,
      montantTotal: true,
      lignes: {
        select: {
          quantite: true,
          total: true,
          coutAchat: true,
          fraisDedouanement: true,
          fraisTransport: true,
        },
      },
      client: { select: { raisonSociale: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  })

  const marges = commandesLivrees
    .map((c) => {
      const ca = Number(c.montantTotal)
      const couts = c.lignes.reduce((s, l) => {
        const u = Number(l.coutAchat ?? 0) + Number(l.fraisDedouanement ?? 0) + Number(l.fraisTransport ?? 0)
        return s + u * l.quantite
      }, 0)
      const marge = couts > 0 ? ca - couts : null
      const tauxMarge = couts > 0 && ca > 0 ? Math.round(((ca - couts) / ca) * 100) : null
      return { id: c.id, numero: c.numero, client: c.client.raisonSociale, ca, couts, marge, tauxMarge }
    })
    .filter((m) => m.marge !== null)
    .slice(0, 10)

  // Répartition CA par type de dépense (pour camembert)
  const depensesParType = await prisma.depense.groupBy({
    by: ["categorie"],
    _sum: { montant: true },
    orderBy: { _sum: { montant: "desc" } },
  })

  // Taux de recouvrement (paiements reçus / montant total des commandes livrées)
  const [totalCmdLivrees, totalPaiements] = await Promise.all([
    prisma.commande.aggregate({
      where: { status: "LIVREE" },
      _sum: { montantTotal: true },
    }),
    prisma.paiement.aggregate({
      where: { isConfirmed: true },
      _sum: { montant: true },
    }),
  ])

  const totalCA = Number(totalCmdLivrees._sum.montantTotal ?? 0)
  const totalEncaisse = Number(totalPaiements._sum.montant ?? 0)
  const tauxRecouvrement = totalCA > 0 ? Math.round((totalEncaisse / totalCA) * 100) : 0

  return NextResponse.json({
    caParMois: months,
    marges,
    depensesParType: depensesParType.map((d) => ({
      type: d.categorie ?? "Non catégorisé",
      montant: Number(d._sum.montant ?? 0),
    })),
    recouvrement: { totalCA, totalEncaisse, tauxRecouvrement },
  })
}
