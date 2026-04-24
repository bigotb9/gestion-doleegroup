"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatCards } from "@/components/shared/StatCards"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate, formatMontant } from "@/lib/utils"
import { staggerContainer, staggerItem } from "@/lib/motion"
import {
  Search, Plus, Phone, Building2, User, ChevronRight, Loader2,
  UserCheck, TrendingUp, AlertCircle, Users,
} from "lucide-react"

type TabFilter = "ALL" | "PROSPECT" | "CONTACTE" | "DEVIS_ENVOYE" | "NEGOCIATION" | "CLIENT" | "PERDU"

type ClientRow = {
  id: string
  raisonSociale: string
  contactNom: string
  contactPrenom: string | null
  contactPhone: string
  status: string
  secteurActivite: string | null
  ville: string | null
  createdAt: string
  _count: { devis: number; commandes: number }
  soldeEnCours: number
  totalCmd: number
  totalPaye: number
}

const TABS: { label: string; value: TabFilter }[] = [
  { label: "Tous", value: "ALL" },
  { label: "Prospects", value: "PROSPECT" },
  { label: "En cours", value: "NEGOCIATION" },
  { label: "Clients", value: "CLIENT" },
  { label: "Perdus", value: "PERDU" },
]

export default function CrmPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<TabFilter>("ALL")
  const [clients, setClients] = useState<ClientRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(timer)
  }, [search])

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (activeTab !== "ALL") params.set("status", activeTab)

      const res = await fetch(`/api/crm?${params.toString()}`)
      if (!res.ok) throw new Error("Erreur réseau")
      const data = await res.json()
      setClients(data.clients)
      setTotal(data.total)
    } catch {
      setClients([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, activeTab])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  // KPI stats
  const stats = useMemo(() => {
    const clientsActifs = clients.filter((c) => c.status === "CLIENT").length
    const prospects = clients.filter((c) => c.status === "PROSPECT" || c.status === "CONTACTE" || c.status === "NEGOCIATION").length
    const totalSolde = clients.reduce((s, c) => s + (c.soldeEnCours || 0), 0)
    const totalCA = clients.reduce((s, c) => s + (c.totalCmd || 0), 0)
    return { clientsActifs, prospects, totalSolde, totalCA }
  }, [clients])

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM — Clients & Prospects"
        description={`${total} contact${total > 1 ? "s" : ""} au total`}
      >
        <Link
          href="/crm/nouveau"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-9 gap-1.5 px-3 transition-all hover:opacity-90 hover:scale-[1.02] shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Nouveau prospect
        </Link>
      </PageHeader>

      {/* Stats KPI */}
      <StatCards
        cards={[
          { label: "Clients actifs", value: stats.clientsActifs, icon: UserCheck, variant: "success", hint: "Convertis" },
          { label: "Prospects", value: stats.prospects, icon: Users, variant: "primary", hint: "En cours" },
          { label: "CA total", value: stats.totalCA, icon: TrendingUp, variant: "info", isMontant: true, hint: "Toutes commandes" },
          { label: "Solde dû", value: stats.totalSolde, icon: AlertCircle, variant: "warning", isMontant: true, hint: "À encaisser" },
        ]}
      />

      {/* Search + Tabs */}
      <div className="flex flex-col gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Rechercher un client, contact..."
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
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
                <Building2 className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm font-medium">Aucun résultat</p>
              {activeTab === "ALL" && !search && (
                <Link
                  href="/crm/nouveau"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-3 hover:bg-muted transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter le premier prospect
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Raison Sociale</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Contact</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Téléphone</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Statut</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Activité</th>
                    <th className="text-right px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Solde</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Ajouté</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <motion.tbody
                  className="divide-y divide-slate-50"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {clients.map((client) => (
                    <motion.tr
                      key={client.id}
                      variants={staggerItem}
                      className="group hover:bg-gradient-to-r hover:from-blue-50/40 hover:to-transparent transition-all cursor-pointer"
                      onClick={() => router.push(`/crm/${client.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm group-hover:scale-110 transition-transform">
                            {client.raisonSociale.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{client.raisonSociale}</p>
                            {client.ville && (
                              <p className="text-[11px] text-slate-400">{client.ville}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{client.contactNom}{client.contactPrenom ? ` ${client.contactPrenom}` : ""}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <a
                          href={`tel:${client.contactPhone}`}
                          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-600 text-sm transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {client.contactPhone}
                        </a>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={client.status} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md">
                            <span className="font-bold text-slate-800">{client._count.devis}</span>
                            <span>devis</span>
                          </span>
                          <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md">
                            <span className="font-bold text-slate-800">{client._count.commandes}</span>
                            <span>cmds</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {client.soldeEnCours > 0 ? (
                          <div>
                            <p className="text-sm font-bold text-red-600 tabular-nums">{formatMontant(client.soldeEnCours)}</p>
                            <p className="text-[10px] text-slate-400 tabular-nums">{formatMontant(client.totalPaye)} / {formatMontant(client.totalCmd)}</p>
                          </div>
                        ) : client.totalCmd > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            Soldé
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs tabular-nums">{formatDate(client.createdAt)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <ChevronRight className="h-4 w-4 text-slate-300 ml-auto group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
