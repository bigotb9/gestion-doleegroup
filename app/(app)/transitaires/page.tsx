"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { motion } from "motion/react"
import { PageHeader } from "@/components/layout/PageHeader"
import { RoleGate } from "@/components/shared/RoleGate"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { staggerContainer, staggerItem } from "@/lib/motion"
import {
  Search, Plus, Truck, ChevronRight, Loader2, Globe,
} from "lucide-react"

type Transitaire = {
  id: string
  nom: string
  pays: string
  contactNom: string | null
  contactEmail: string | null
  contactPhone: string | null
  isActive: boolean
  _count: { logistiques: number }
}

export default function TransitairesPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [transitaires, setTransitaires] = useState<Transitaire[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [showInactif, setShowInactif] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const fetchTransitaires = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (showInactif) params.set("includeInactif", "true")
      const res = await fetch(`/api/transitaires?${params.toString()}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTransitaires(data.transitaires ?? data)
      setTotal(data.total ?? (data.transitaires ?? data).length)
    } catch {
      toast.error("Impossible de charger les transitaires")
      setTransitaires([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, showInactif])

  useEffect(() => {
    fetchTransitaires()
  }, [fetchTransitaires])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transitaires"
        description={`${total} transitaire${total !== 1 ? "s" : ""}`}
      >
        <RoleGate roles={["MANAGER", "SECRETAIRE"]}>
          <Link
            href="/transitaires/nouveau"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-9 gap-1.5 px-3 transition-all hover:opacity-90 hover:scale-[1.02] shadow-sm"
          >
            <Plus className="h-4 w-4" />Nouveau transitaire
          </Link>
        </RoleGate>
      </PageHeader>

      {/* Search & filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Rechercher par nom, pays..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-white border-slate-200 focus-visible:border-blue-400"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-3 h-10 rounded-lg border border-slate-200">
          <input type="checkbox" checked={showInactif} onChange={(e) => setShowInactif(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          <span className="text-sm text-slate-600">Inclure inactifs</span>
        </label>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-slate-100" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)", borderRadius: "16px" }}>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />Chargement...
            </div>
          ) : transitaires.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
                <Truck className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm font-medium">Aucun transitaire trouvé</p>
              <Link href="/transitaires/nouveau" className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-3 hover:bg-muted transition-colors">
                <Plus className="h-3.5 w-3.5" />Ajouter le premier transitaire
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Nom</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Pays</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Contact</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Logistiques</th>
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
                  {transitaires.map((t) => (
                    <motion.tr
                      key={t.id}
                      variants={staggerItem}
                      className="group hover:bg-gradient-to-r hover:from-cyan-50/40 hover:to-transparent transition-all cursor-pointer"
                      onClick={() => router.push(`/transitaires/${t.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 text-white text-xs font-bold shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                            {t.nom.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 group-hover:text-cyan-700 transition-colors">{t.nom}</p>
                            {(t._count?.logistiques ?? 0) > 0 && (
                              <p className="text-[11px] text-slate-400">
                                {t._count.logistiques} logistique{t._count.logistiques !== 1 ? "s" : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-slate-600 text-sm">
                          <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />{t.pays}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          {t.contactNom && <p className="font-medium text-slate-700 text-sm">{t.contactNom}</p>}
                          {t.contactEmail && <p className="text-[11px] text-slate-400 truncate max-w-[160px]">{t.contactEmail}</p>}
                          {t.contactPhone && <p className="text-[11px] text-slate-400">{t.contactPhone}</p>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                          {t._count?.logistiques ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${t.isActive ? "bg-green-500" : "bg-slate-400"}`} />
                          {t.isActive ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <ChevronRight className="h-4 w-4 text-slate-300 ml-auto group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all" />
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
