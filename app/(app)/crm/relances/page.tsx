"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMontant, formatRelativeDate, cn } from "@/lib/utils"
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  FileText,
  CreditCard,
  Receipt,
  Users,
  Phone,
} from "lucide-react"
import { PROSPECT_STATUS_LABELS, PROSPECT_STATUS_COLORS } from "@/lib/constants"

type ClientSnippet = { id: string; raisonSociale: string; contactNom: string; contactPhone: string }

type DevisRelance = {
  id: string; numero: string; total: string | number; devise: string; updatedAt: string
  client: ClientSnippet
}
type CommandeRelance = {
  id: string; numero: string; montantTotal: string | number; devise: string
  createdAt?: string; updatedAt?: string
  client: ClientSnippet
}
type ClientRelance = {
  id: string; raisonSociale: string; contactNom: string; contactPhone: string
  status: string; updatedAt: string
}

type RelancesData = {
  devisEnAttente: DevisRelance[]
  commandesSansPaiement: CommandeRelance[]
  commandesSansFacture: CommandeRelance[]
  clientsSansContact: ClientRelance[]
  totaux: { devis: number; paiements: number; factures: number; clients: number }
}

function SectionCard({
  title, icon: Icon, count, color, children
}: { title: string; icon: React.ElementType; count: number; color: string; children: React.ReactNode }) {
  return (
    <Card className={cn("border", count > 0 ? "border-amber-200" : "border-green-200")}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${color}`} />
            {title}
          </span>
          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold", count > 0 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700")}>
            {count}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {children}
      </CardContent>
    </Card>
  )
}

export default function RelancesPage() {
  const [data, setData] = useState<RelancesData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/crm/relances-dashboard")
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      toast.error("Impossible de charger les relances")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const total = data ? Object.values(data.totaux).reduce((s, v) => s + v, 0) : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relances à effectuer"
        description={loading ? "…" : `${total} action${total !== 1 ? "s" : ""} en attente`}
      >
        <Link
          href="/crm"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background text-[0.8rem] font-medium h-7 px-2.5 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          CRM
        </Link>
      </PageHeader>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Analyse en cours…
        </div>
      ) : !data ? null : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Devis sans réponse > 7j */}
          <SectionCard title="Devis envoyés sans réponse (+7 j)" icon={FileText} count={data.totaux.devis} color="text-amber-600">
            {data.devisEnAttente.length === 0 ? (
              <p className="px-5 py-4 text-xs text-green-600">Aucun devis en attente.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {data.devisEnAttente.map((d) => (
                  <div key={d.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50">
                    <div>
                      <Link href={`/devis/${d.id}`} className="font-mono text-xs font-semibold text-blue-700 hover:underline">
                        {d.numero}
                      </Link>
                      <p className="text-xs text-slate-600">{d.client.raisonSociale}</p>
                      <p className="text-xs text-slate-400">{formatRelativeDate(d.updatedAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-800">{formatMontant(Number(d.total))}</p>
                      <a href={`tel:${d.client.contactPhone}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                        <Phone className="h-3 w-3" />
                        {d.client.contactPhone}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Commandes sans paiement */}
          <SectionCard title="Commandes sans paiement confirmé (+7 j)" icon={CreditCard} count={data.totaux.paiements} color="text-red-600">
            {data.commandesSansPaiement.length === 0 ? (
              <p className="px-5 py-4 text-xs text-green-600">Toutes les commandes ont un paiement confirmé.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {data.commandesSansPaiement.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50">
                    <div>
                      <Link href={`/commandes/${c.id}`} className="font-mono text-xs font-semibold text-blue-700 hover:underline">
                        {c.numero}
                      </Link>
                      <p className="text-xs text-slate-600">{c.client.raisonSociale}</p>
                      <p className="text-xs text-slate-400">{formatRelativeDate(c.createdAt ?? "")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-800">{formatMontant(Number(c.montantTotal))}</p>
                      <a href={`tel:${c.client.contactPhone}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                        <Phone className="h-3 w-3" />
                        {c.client.contactPhone}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Commandes livrées sans facture */}
          <SectionCard title="Commandes livrées sans facture" icon={Receipt} count={data.totaux.factures} color="text-purple-600">
            {data.commandesSansFacture.length === 0 ? (
              <p className="px-5 py-4 text-xs text-green-600">Toutes les commandes livrées ont une facture.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {data.commandesSansFacture.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50">
                    <div>
                      <Link href={`/commandes/${c.id}`} className="font-mono text-xs font-semibold text-blue-700 hover:underline">
                        {c.numero}
                      </Link>
                      <p className="text-xs text-slate-600">{c.client.raisonSociale}</p>
                      <p className="text-xs text-slate-400">{formatRelativeDate(c.updatedAt ?? "")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-800">{formatMontant(Number(c.montantTotal))}</p>
                      <Link href="/facturation" className="text-xs text-purple-600 hover:underline mt-1 block">
                        Créer la facture →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Prospects sans contact > 30j */}
          <SectionCard title="Prospects sans contact (+30 j)" icon={Users} count={data.totaux.clients} color="text-slate-600">
            {data.clientsSansContact.length === 0 ? (
              <p className="px-5 py-4 text-xs text-green-600">Tous les prospects ont été contactés récemment.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {data.clientsSansContact.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50">
                    <div>
                      <Link href={`/crm/${c.id}`} className="text-xs font-semibold text-slate-800 hover:text-blue-700">
                        {c.raisonSociale}
                      </Link>
                      <p className="text-xs text-slate-500">{c.contactNom}</p>
                      <p className="text-xs text-slate-400">{formatRelativeDate(c.updatedAt)}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", PROSPECT_STATUS_COLORS[c.status as keyof typeof PROSPECT_STATUS_COLORS] ?? "bg-slate-100 text-slate-700")}>
                        {PROSPECT_STATUS_LABELS[c.status as keyof typeof PROSPECT_STATUS_LABELS] ?? c.status}
                      </span>
                      <a href={`tel:${c.contactPhone}`} className="flex items-center justify-end gap-1 text-xs text-blue-600 hover:underline">
                        <Phone className="h-3 w-3" />
                        {c.contactPhone}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {!loading && total === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-green-600 gap-3">
          <AlertTriangle className="h-10 w-10 text-green-400" />
          <p className="font-semibold">Tout est à jour — aucune relance nécessaire</p>
        </div>
      )}
    </div>
  )
}
