"use client"

import { useState, useEffect, useCallback, type ElementType } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatDate } from "@/lib/utils"
import { LOGISTIQUE_STATUS_LABELS } from "@/lib/constants"
import { Loader2, Ship, Search, Package, Send, FileCheck, Warehouse, Truck, Building2 } from "lucide-react"

type LogistiqueStatus =
  | "CHEZ_FOURNISSEUR"
  | "EXPEDIE_TRANSITAIRE"
  | "EN_DEDOUANEMENT"
  | "CHEZ_TRANSITAIRE"
  | "EN_TRANSIT_BUREAU"
  | "AU_BUREAU"

type LogistiqueRecord = {
  id: string
  commandeId: string
  status: LogistiqueStatus
  transitaireNom: string | null
  dateArriveeEntrepot: string | null
  commande: {
    id: string
    numero: string
    client: {
      raisonSociale: string
    }
  }
}

type TabFilter = "TOUS" | "EN_COURS" | "AU_BUREAU"

const TABS: { label: string; value: TabFilter }[] = [
  { label: "Tous", value: "TOUS" },
  { label: "En cours", value: "EN_COURS" },
  { label: "Au bureau", value: "AU_BUREAU" },
]

const PIPELINE_STAGES: { key: LogistiqueStatus; label: string; short: string; icon: ElementType; color: string; bg: string }[] = [
  { key: "CHEZ_FOURNISSEUR",    label: "Chez le fournisseur", short: "Fournisseur", icon: Package,   color: "text-slate-600",  bg: "bg-slate-100" },
  { key: "EXPEDIE_TRANSITAIRE", label: "Expédition",          short: "Expédition",  icon: Send,      color: "text-blue-600",   bg: "bg-blue-100" },
  { key: "CHEZ_TRANSITAIRE",    label: "Chez le transitaire", short: "Transitaire", icon: Warehouse, color: "text-purple-600", bg: "bg-purple-100" },
  { key: "AU_BUREAU",           label: "Livré au bureau",     short: "Au bureau",   icon: Building2, color: "text-green-600",  bg: "bg-green-100" },
]

const STAGE_INDEX: Record<LogistiqueStatus, number> = Object.fromEntries(
  PIPELINE_STAGES.map((s, i) => [s.key, i])
) as Record<LogistiqueStatus, number>

const EN_COURS_STATUSES: LogistiqueStatus[] = [
  "CHEZ_FOURNISSEUR",
  "EXPEDIE_TRANSITAIRE",
  "CHEZ_TRANSITAIRE",
  "EN_DEDOUANEMENT",
  "EN_TRANSIT_BUREAU",
]

function MiniPipeline({ status }: { status: LogistiqueStatus }) {
  const currentIdx = STAGE_INDEX[status]
  return (
    <div className="flex items-center gap-0.5">
      {PIPELINE_STAGES.map((stage, i) => {
        const done = i < currentIdx
        const active = i === currentIdx
        return (
          <div key={stage.key} className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full ${
                active ? `${stage.bg} ring-2 ring-offset-1 ring-current ${stage.color}` :
                done ? "bg-green-400" : "bg-slate-200"
              }`}
              title={stage.label}
            />
            {i < PIPELINE_STAGES.length - 1 && (
              <div className={`w-3 h-px ${done ? "bg-green-400" : "bg-slate-200"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function LogistiquePage() {
  const [records, setRecords] = useState<LogistiqueRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabFilter>("TOUS")
  const [search, setSearch] = useState("")

  const fetchLogistique = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/logistique")
      if (!res.ok) throw new Error()
      const json = await res.json()
      setRecords(Array.isArray(json) ? json : json.logistiques ?? json.records ?? [])
    } catch {
      toast.error("Impossible de charger les données logistiques")
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogistique()
  }, [fetchLogistique])

  const filtered = records.filter((r) => {
    if (activeTab === "EN_COURS" && !EN_COURS_STATUSES.includes(r.status)) return false
    if (activeTab === "AU_BUREAU" && r.status !== "AU_BUREAU") return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !r.commande.numero.toLowerCase().includes(q) &&
        !r.commande.client.raisonSociale.toLowerCase().includes(q) &&
        !(r.transitaireNom ?? "").toLowerCase().includes(q)
      ) {
        return false
      }
    }
    return true
  })

  // Counts per stage
  const stageCounts = PIPELINE_STAGES.map((s) =>
    records.filter((r) => r.status === s.key).length
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logistique"
        description="Suivi du parcours des marchandises du fournisseur au bureau"
      />

      {/* Pipeline visuel */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">Pipeline logistique</p>
          <div className="flex items-stretch gap-0">
            {PIPELINE_STAGES.map((stage, i) => {
              const Icon = stage.icon
              const count = stageCounts[i]
              const isLast = i === PIPELINE_STAGES.length - 1
              return (
                <div key={stage.key} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center flex-1 min-w-0 px-2">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${stage.bg} ${stage.color} mb-2 shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-medium text-slate-700 text-center leading-tight hidden sm:block">
                      {stage.short}
                    </p>
                    <p className="text-xs font-medium text-slate-700 text-center leading-tight sm:hidden">
                      {i + 1}
                    </p>
                    {count > 0 ? (
                      <span className={`mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${stage.bg} ${stage.color}`}>
                        {count}
                      </span>
                    ) : (
                      <span className="mt-1 text-xs text-slate-300">—</span>
                    )}
                  </div>
                  {!isLast && (
                    <div className="w-4 shrink-0 h-px bg-slate-200 hidden sm:block" />
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="hidden sm:grid grid-cols-4 gap-1">
              {PIPELINE_STAGES.map((stage) => (
                <p key={stage.key} className="text-xs text-slate-400 text-center leading-tight px-1">
                  {stage.label}
                </p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.value
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            {tab.label}
            {tab.value === "TOUS" && records.length > 0 && (
              <span className="ml-1.5 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                {records.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Rechercher commande, client, transitaire..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Chargement...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <Ship className="h-8 w-8" />
              <p className="text-sm">Aucune opération logistique trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Commande
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Étape actuelle
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">
                      Progression
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                      Transitaire
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                      Arrivée prévue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((r) => {
                    const stage = PIPELINE_STAGES[STAGE_INDEX[r.status]]
                    const Icon = stage.icon
                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3">
                          <Link
                            href={`/commandes/${r.commande.id}/logistique`}
                            className="font-mono text-xs font-semibold text-blue-700 hover:underline"
                          >
                            {r.commande.numero}
                          </Link>
                        </td>
                        <td className="px-6 py-3 font-medium text-slate-900">
                          {r.commande.client.raisonSociale}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`flex items-center justify-center w-6 h-6 rounded-md ${stage.bg} ${stage.color} shrink-0`}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <StatusBadge status={r.status} />
                          </div>
                        </td>
                        <td className="px-6 py-3 hidden md:table-cell">
                          <MiniPipeline status={r.status} />
                        </td>
                        <td className="px-6 py-3 text-slate-600 hidden lg:table-cell">
                          {r.transitaireNom ?? <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-6 py-3 text-slate-500 text-xs hidden lg:table-cell">
                          {r.dateArriveeEntrepot
                            ? formatDate(r.dateArriveeEntrepot)
                            : <span className="text-slate-300">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
