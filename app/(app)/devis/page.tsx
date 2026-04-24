"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { motion } from "motion/react"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatCards } from "@/components/shared/StatCards"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate, formatMontant } from "@/lib/utils"
import { staggerContainer, staggerItem } from "@/lib/motion"
import {
  Search, Plus, FileText, ChevronRight, Loader2, AlertTriangle,
  Clock, CheckCircle2, Send, TrendingUp,
} from "lucide-react"

type DevisStatus = "BROUILLON" | "EN_ATTENTE_VALIDATION" | "VALIDE" | "ENVOYE" | "ACCEPTE" | "REFUSE" | "EXPIRE"
type TabFilter = "ALL" | DevisStatus

type DevisRow = {
  id: string
  numero: string
  status: DevisStatus
  dateEmission: string
  dateValidite: string
  total: string | number
  devise: string
  client: {
    id: string
    raisonSociale: string
    contactNom: string
    contactPrenom: string | null
  }
}

const TABS: { label: string; value: TabFilter }[] = [
  { label: "Tous", value: "ALL" },
  { label: "Brouillons", value: "BROUILLON" },
  { label: "À valider", value: "EN_ATTENTE_VALIDATION" },
  { label: "Envoyés", value: "ENVOYE" },
  { label: "Acceptés", value: "ACCEPTE" },
]

export default function DevisPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<TabFilter>("ALL")
  const [devis, setDevis] = useState<DevisRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(timer)
  }, [search])

  const fetchDevis = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (activeTab !== "ALL") params.set("status", activeTab)

      const res = await fetch(`/api/devis?${params.toString()}`)
      if (!res.ok) throw new Error("Erreur réseau")
      const data = await res.json()
      setDevis(data.devis ?? data)
      setTotal(data.total ?? (data.devis ?? data).length)
    } catch {
      toast.error("Impossible de charger les devis")
      setDevis([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, activeTab])

  useEffect(() => {
    fetchDevis()
  }, [fetchDevis])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function isExpired(row: DevisRow): boolean {
    if (["ACCEPTE", "REFUSE", "EXPIRE"].includes(row.status)) return false
    return new Date(row.dateValidite) < today
  }

  // KPI stats
  const stats = useMemo(() => {
    const brouillons = devis.filter((d) => d.status === "BROUILLON").length
    const envoyes = devis.filter((d) => d.status === "ENVOYE").length
    const acceptes = devis.filter((d) => d.status === "ACCEPTE").length
    const totalValeur = devis
      .filter((d) => !["REFUSE", "EXPIRE"].includes(d.status))
      .reduce((s, d) => s + Number(d.total), 0)
    return { brouillons, envoyes, acceptes, totalValeur }
  }, [devis])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Devis"
        description={`${total} devis au total`}
      >
        <Link
          href="/devis/nouveau"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-9 gap-1.5 px-3 transition-all hover:opacity-90 hover:scale-[1.02] shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Nouveau devis
        </Link>
      </PageHeader>

      {/* Stats KPI */}
      <StatCards
        cards={[
          { label: "Brouillons", value: stats.brouillons, icon: Clock, variant: "warning", hint: "À finaliser" },
          { label: "Envoyés", value: stats.envoyes, icon: Send, variant: "primary", hint: "En attente retour" },
          { label: "Acceptés", value: stats.acceptes, icon: CheckCircle2, variant: "success", hint: "Convertis" },
          { label: "Valeur pipeline", value: stats.totalValeur, icon: TrendingUp, variant: "info", isMontant: true, hint: "Hors refusés" },
        ]}
      />

      {/* Search + Tabs */}
      <div className="flex flex-col gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Rechercher par numéro, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-white border-slate-200 focus-visible:border-blue-400"
          />
        </div>

        <div className="flex gap-1 border-b border-slate-200 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            const active = activeTab === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                  active
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-slate-100" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)", borderRadius: "16px" }}>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />Chargement...
            </div>
          ) : devis.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
                <FileText className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm font-medium">Aucun devis trouvé</p>
              {activeTab === "ALL" && !search && (
                <Link href="/devis/nouveau" className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-3 hover:bg-muted transition-colors">
                  <Plus className="h-3.5 w-3.5" />Créer le premier devis
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Numéro</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Client</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Émis le</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Validité</th>
                    <th className="text-right px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Total</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Statut</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <motion.tbody
                  className="divide-y divide-slate-50"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {devis.map((d) => {
                    const expired = isExpired(d)
                    return (
                      <motion.tr
                        key={d.id}
                        variants={staggerItem}
                        className={`group cursor-pointer transition-all ${
                          expired
                            ? "bg-red-50/40 hover:bg-red-50/70"
                            : "hover:bg-gradient-to-r hover:from-blue-50/40 hover:to-transparent"
                        }`}
                        onClick={() => router.push(`/devis/${d.id}`)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md group-hover:bg-blue-100 transition-colors">
                              {d.numero}
                            </span>
                            {expired && (
                              <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" aria-label="Devis expiré" />
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {d.client.raisonSociale}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {d.client.contactNom}{d.client.contactPrenom ? ` ${d.client.contactPrenom}` : ""}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs tabular-nums">{formatDate(d.dateEmission)}</td>
                        <td className={`px-5 py-3.5 text-xs font-medium tabular-nums ${expired ? "text-red-600" : "text-slate-600"}`}>
                          {formatDate(d.dateValidite)}
                          {expired && <span className="ml-1 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">expiré</span>}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-slate-900 tabular-nums">
                          {formatMontant(Number(d.total), d.devise as "EUR" | "USD" | "CFA")}
                        </td>
                        <td className="px-5 py-3.5"><StatusBadge status={d.status} /></td>
                        <td className="px-5 py-3.5 text-right">
                          <ChevronRight className="h-4 w-4 text-slate-300 ml-auto group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                        </td>
                      </motion.tr>
                    )
                  })}
                </motion.tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
