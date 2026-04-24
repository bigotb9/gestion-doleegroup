"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { motion } from "motion/react"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { StatCards } from "@/components/shared/StatCards"
import { RoleGate } from "@/components/shared/RoleGate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { formatDate, formatMontant } from "@/lib/utils"
import { Pagination } from "@/components/shared/Pagination"
import { staggerContainer, staggerItem } from "@/lib/motion"
import {
  Search, Plus, ShoppingCart, ChevronRight, Loader2, Trash2, AlertTriangle,
  Clock, TrendingUp, CheckCircle2, ArrowUp, ArrowDown,
} from "lucide-react"

type CommandeStatus =
  | "EN_ATTENTE_CONFIRMATION" | "CONFIRMEE" | "EN_PRODUCTION"
  | "EN_LOGISTIQUE" | "EN_RECONDITIONNEMENT" | "PRETE_LIVRAISON"
  | "LIVREE" | "ANNULEE"

type PaymentStatus =
  | "EN_ATTENTE" | "AVANCE_RECUE" | "SOLDE_RECU" | "PAIEMENT_COMPLET" | "EN_RETARD"

type TabFilter = "ALL" | CommandeStatus

type CommandeRow = {
  id: string
  numero: string
  status: CommandeStatus
  statusPaiement: PaymentStatus
  modePaiement: "AVANCE_SOLDE" | "BON_DE_COMMANDE"
  montantTotal: string | number
  devise: string
  createdAt: string
  client: { id: string; raisonSociale: string; contactNom: string; contactPrenom: string | null }
}

const TABS: { label: string; value: TabFilter }[] = [
  { label: "Toutes", value: "ALL" },
  { label: "En attente", value: "EN_ATTENTE_CONFIRMATION" },
  { label: "Confirmées", value: "CONFIRMEE" },
  { label: "En production", value: "EN_PRODUCTION" },
  { label: "En logistique", value: "EN_LOGISTIQUE" },
  { label: "Livrées", value: "LIVREE" },
  { label: "Annulées", value: "ANNULEE" },
]

const PAYMENT_MODE_LABELS: Record<string, string> = {
  AVANCE_SOLDE: "Avance+Solde",
  BON_DE_COMMANDE: "Bon de commande",
}

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  EN_ATTENTE: "bg-slate-100 text-slate-700",
  AVANCE_RECUE: "bg-blue-100 text-blue-700",
  SOLDE_RECU: "bg-teal-100 text-teal-700",
  PAIEMENT_COMPLET: "bg-green-100 text-green-700",
  EN_RETARD: "bg-red-100 text-red-700",
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  EN_ATTENTE: "En attente",
  AVANCE_RECUE: "Avance reçue",
  SOLDE_RECU: "Solde reçu",
  PAIEMENT_COMPLET: "Payé",
  EN_RETARD: "En retard",
}

export default function CommandesPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const isManager = session?.user?.role === "MANAGER"

  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<TabFilter>("ALL")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [commandes, setCommandes] = useState<CommandeRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const PAGE_SIZE = 25
  const [loading, setLoading] = useState(true)
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<CommandeRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [allCommandes, setAllCommandes] = useState<CommandeRow[]>([])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(timer)
  }, [search])

  const fetchCommandes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (activeTab !== "ALL") params.set("status", activeTab)
      params.set("page", String(page))
      params.set("pageSize", String(PAGE_SIZE))
      params.set("sortDir", sortDir)
      const res = await fetch(`/api/commandes?${params.toString()}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCommandes(data.commandes ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch {
      toast.error("Impossible de charger les commandes")
      setCommandes([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, activeTab, page, sortDir])

  // Stats globales (pas affectées par les filtres)
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/commandes?pageSize=500")
      if (!res.ok) return
      const data = await res.json()
      setAllCommandes(data.commandes ?? [])
    } catch { /* silent */ }
  }, [])

  useEffect(() => { setPage(1) }, [debouncedSearch, activeTab])
  useEffect(() => { fetchCommandes() }, [fetchCommandes])
  useEffect(() => { fetchStats() }, [fetchStats])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/commandes/${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Erreur")
      }
      toast.success(`Commande ${deleteTarget.numero} supprimée`)
      setDeleteTarget(null)
      fetchCommandes()
      fetchStats()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression")
    } finally {
      setDeleting(false)
    }
  }

  // Compteurs par statut (pour badges dans les tabs)
  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = { ALL: allCommandes.length }
    for (const c of allCommandes) counts[c.status] = (counts[c.status] ?? 0) + 1
    return counts
  }, [allCommandes])

  // Stats KPI
  const stats = useMemo(() => {
    const enCours = allCommandes.filter((c) => !["LIVREE", "ANNULEE"].includes(c.status)).length
    const livrees = allCommandes.filter((c) => c.status === "LIVREE").length
    const enAttente = allCommandes.filter((c) => c.status === "EN_ATTENTE_CONFIRMATION").length
    const caTotal = allCommandes
      .filter((c) => c.status !== "ANNULEE")
      .reduce((s, c) => s + Number(c.montantTotal), 0)
    return { enCours, livrees, enAttente, caTotal }
  }, [allCommandes])

  return (
    <div className="space-y-6">
      <PageHeader title="Commandes" description={`${total} commande${total !== 1 ? "s" : ""} au total`}>
        <RoleGate roles={["MANAGER", "SECRETAIRE"]}>
          <Link
            href="/commandes/nouvelle"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-9 gap-1.5 px-3 transition-all hover:opacity-90 hover:scale-[1.02] shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nouvelle commande
          </Link>
        </RoleGate>
      </PageHeader>

      {/* KPI Stats */}
      <StatCards
        cards={[
          { label: "En cours", value: stats.enCours, icon: Clock, variant: "primary", hint: "Toutes étapes" },
          { label: "En attente conf.", value: stats.enAttente, icon: AlertTriangle, variant: "warning", hint: "À confirmer" },
          { label: "Livrées", value: stats.livrees, icon: CheckCircle2, variant: "success", hint: "Finalisées" },
          { label: "CA total", value: stats.caTotal, icon: TrendingUp, variant: "info", isMontant: true, devise: "CFA", hint: "Hors annulées" },
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
            const count = countByStatus[tab.value] ?? 0
            const active = activeTab === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px flex items-center gap-2 ${
                  active
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold transition-colors ${
                    active ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {count}
                  </span>
                )}
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
          ) : commandes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
                <ShoppingCart className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm font-medium">Aucune commande trouvée</p>
              <p className="text-xs">Essayez de modifier vos filtres ou créez une nouvelle commande.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Numéro</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Client</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Mode paiement</th>
                    <th className="text-right px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Montant</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Statut</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Paiement</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">
                      <button
                        type="button"
                        onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                        className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
                        title={sortDir === "desc" ? "Plus récentes d'abord" : "Plus anciennes d'abord"}
                      >
                        Date
                        {sortDir === "desc"
                          ? <ArrowDown className="h-3 w-3" />
                          : <ArrowUp className="h-3 w-3" />}
                      </button>
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <motion.tbody
                  className="divide-y divide-slate-50"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {commandes.map((c) => (
                    <motion.tr
                      key={c.id}
                      variants={staggerItem}
                      className="group hover:bg-gradient-to-r hover:from-blue-50/40 hover:to-transparent transition-all cursor-pointer"
                      onClick={() => router.push(`/commandes/${c.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md group-hover:bg-blue-100 transition-colors">
                          {c.numero}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {c.client.raisonSociale}
                        </p>
                        <p className="text-xs text-slate-400">
                          {c.client.contactNom}{c.client.contactPrenom ? ` ${c.client.contactPrenom}` : ""}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className="text-[10px] font-medium border-slate-200">
                          {PAYMENT_MODE_LABELS[c.modePaiement] ?? c.modePaiement}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="font-bold text-slate-900 tabular-nums">
                          {formatMontant(Number(c.montantTotal), c.devise as "EUR" | "USD" | "CFA")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${PAYMENT_STATUS_COLORS[c.statusPaiement]}`}>
                          {PAYMENT_STATUS_LABELS[c.statusPaiement]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs tabular-nums">{formatDate(c.createdAt)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {isManager && c.status !== "LIVREE" && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                              title="Supprimer"
                              onClick={() => setDeleteTarget(c)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm delete */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />Supprimer la commande
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Vous êtes sur le point de supprimer la commande{" "}
            <span className="font-semibold font-mono">{deleteTarget?.numero}</span> de{" "}
            <span className="font-semibold">{deleteTarget?.client.raisonSociale}</span>.
            Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Annuler</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  )
}
