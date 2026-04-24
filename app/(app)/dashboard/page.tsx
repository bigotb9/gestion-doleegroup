import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DashboardCharts } from "@/components/shared/DashboardCharts"
import {
  DashboardHeroKPIs,
  DashboardFinanceKPIs,
  DashboardRecentCommandes,
  DashboardStockAlerts,
  DashboardPipeline,
} from "@/components/shared/DashboardPremium"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import { Truck, ArrowRight } from "lucide-react"

type CommandeRow = {
  id: string
  numero: string
  status: string
  montantTotal: { toString(): string } | number
  createdAt: Date
  client: { id: string; raisonSociale: string }
}

type StockAlertRow = {
  id: string
  reference: string
  nom: string
  quantite: number
  surplusStock: number
}

type LivraisonRow = {
  id: string
  status: string
  datePrevue: Date
  adresseLivraison: string
  commande: { numero: string }
  client: { raisonSociale: string }
}

export default async function DashboardPage() {
  await auth()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1) // lundi
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  const [
    commandesActives,
    revenuDuMois,
    commandesEnAttente,
    devisAValider,
    stockAlerts,
    recentCommandes,
    livraisonsSemaine,
    totalFNE,
    totalCaisse,
    totalDepenses,
  ] = await Promise.all([
    // Commandes actives = tout sauf LIVREE et ANNULEE
    prisma.commande.count({
      where: { status: { notIn: ["LIVREE", "ANNULEE"] } },
    }),

    // Revenu du mois = paiements confirmés du mois courant
    prisma.paiement.aggregate({
      where: { isConfirmed: true, dateReception: { gte: startOfMonth } },
      _sum: { montant: true },
    }),

    // Commandes en attente de confirmation
    prisma.commande.count({ where: { status: "EN_ATTENTE_CONFIRMATION" } }),

    // Devis à valider (brouillon ou en attente)
    prisma.devis.count({
      where: { status: { in: ["BROUILLON", "EN_ATTENTE_VALIDATION"] } },
    }),

    // Articles sous le stock minimum
    prisma.$queryRaw<
      Array<{ id: string; reference: string; nom: string; quantite: number; surplusStock: number }>
    >`
      SELECT id, reference, nom, quantite, "surplusStock"
      FROM "ArticleStock"
      WHERE "surplusStock" > 0 AND quantite > "surplusStock"
      ORDER BY quantite DESC
      LIMIT 5
    `,

    // 5 dernières commandes
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

    // Livraisons planifiées cette semaine
    prisma.livraison.findMany({
      where: {
        status: { in: ["PLANIFIEE", "EN_COURS"] },
        datePrevue: { gte: startOfWeek, lte: endOfWeek },
      },
      orderBy: { datePrevue: "asc" },
      select: {
        id: true,
        status: true,
        datePrevue: true,
        adresseLivraison: true,
        commande: { select: { numero: true } },
        client: { select: { raisonSociale: true } },
      },
    }),

    // Total FNE — factures de type FNE uniquement
    prisma.facture.aggregate({ where: { type: "FNE" }, _sum: { montantTTC: true } }),

    // Total reçu de caisse — factures de type RECU_CAISSE uniquement
    prisma.facture.aggregate({ where: { type: "RECU_CAISSE" }, _sum: { montantTTC: true } }),

    // Total dépenses
    prisma.depense.aggregate({ _sum: { montant: true } }),
  ])

  // Répartition des commandes par statut pour le donut pipeline
  const commandesByStatusRaw = await prisma.commande.groupBy({
    by: ["status"],
    _count: { id: true },
  })
  const commandesByStatus: Record<string, number> = Object.fromEntries(
    commandesByStatusRaw.map((g: { status: string; _count: { id: number } }) => [g.status, g._count.id])
  )

  const revenuMontant = Number(revenuDuMois._sum.montant ?? 0)
  const totalFNEMontant = Number(totalFNE._sum.montantTTC ?? 0)
  const totalCaisseMontant = Number(totalCaisse._sum.montantTTC ?? 0)
  const totalDepensesMontant = Number(totalDepenses._sum.montant ?? 0)
  const impots = totalFNEMontant * 0.07

  // Sérialiser les Decimal Prisma en plain objects avant de passer aux Client Components
  const recentCommandesSerialized = recentCommandes.map((c) => ({
    id: c.id,
    numero: c.numero,
    status: c.status,
    montantTotal: Number(c.montantTotal),
    createdAt: c.createdAt,
    client: c.client,
  }))

  return (
    <div className="space-y-6">
      {/* Header premium */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">
            Vue d&apos;ensemble
          </p>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>
            Tableau de bord
          </h1>
        </div>
        <Link href="/commandes" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
          Toutes les commandes <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* KPI héros */}
      <DashboardHeroKPIs
        commandesActives={commandesActives}
        revenuMontant={revenuMontant}
        commandesEnAttente={commandesEnAttente}
      />

      {/* KPI financiers */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-3">
          Finances & Fiscalité
        </p>
        <DashboardFinanceKPIs
          totalFNEMontant={totalFNEMontant}
          totalCaisseMontant={totalCaisseMontant}
          totalDepensesMontant={totalDepensesMontant}
          impots={impots}
          devisAValider={devisAValider}
        />
      </div>

      {/* ── Grille principale : commandes + sidebar droite ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Commandes récentes */}
        <div className="xl:col-span-2">
          <Card className="overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", borderRadius: "16px" }}>
            <CardHeader className="pb-0 px-6 pt-5 border-b border-slate-50">
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
                  Commandes récentes
                </CardTitle>
                <Link href="/commandes" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                  Voir tout <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DashboardRecentCommandes commandes={recentCommandesSerialized as CommandeRow[]} />
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">
          {/* Pipeline donut */}
          <DashboardPipeline byStatus={commandesByStatus} />

          {/* Alertes */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-4">Alertes & Actions</p>
            <DashboardStockAlerts
              alerts={stockAlerts as StockAlertRow[]}
              commandesEnAttente={commandesEnAttente}
            />
          </div>

          {/* Livraisons semaine */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Truck className="h-4 w-4 text-blue-500" />
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Livraisons / semaine</p>
            </div>
            <div className="space-y-2">
              {livraisonsSemaine.length === 0 ? (
                <p className="text-xs text-slate-400">Aucune livraison planifiée.</p>
              ) : (
                (livraisonsSemaine as LivraisonRow[]).map((liv) => (
                  <div key={liv.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                    <StatusBadge status={liv.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{liv.client.raisonSociale}</p>
                      <p className="text-[11px] text-slate-400">{formatDate(liv.datePrevue)} · {liv.commande.numero}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Analyse financière ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-3">
          Analyse financière
        </p>
        <DashboardCharts />
      </div>
    </div>
  )
}
