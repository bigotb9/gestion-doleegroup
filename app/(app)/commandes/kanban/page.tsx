"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { motion, AnimatePresence } from "motion/react"
import { PageHeader } from "@/components/layout/PageHeader"
import { SkeletonKanbanCard } from "@/components/shared/Skeleton"
import { formatMontant } from "@/lib/utils"
import {
  LayoutGrid,
  List,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  Factory,
  Loader2,
  ChevronRight,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────

type CommandeStatus =
  | "EN_ATTENTE_CONFIRMATION" | "CONFIRMEE" | "EN_PRODUCTION"
  | "EN_LOGISTIQUE" | "EN_RECONDITIONNEMENT" | "PRETE_LIVRAISON"
  | "LIVREE" | "ANNULEE"

type CommandeCard = {
  id: string
  numero: string
  status: CommandeStatus
  montantTotal: string | number
  devise: string
  createdAt: string
  client: { id: string; raisonSociale: string }
}

// ── Colonnes Kanban ───────────────────────────────────────────────────────

const COLUMNS: {
  status: CommandeStatus
  label: string
  icon: React.ElementType
  color: string
  bg: string
  border: string
  headerBg: string
}[] = [
  {
    status: "EN_ATTENTE_CONFIRMATION",
    label: "En attente",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    headerBg: "bg-amber-500",
  },
  {
    status: "CONFIRMEE",
    label: "Confirmées",
    icon: CheckCircle2,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    headerBg: "bg-blue-600",
  },
  {
    status: "EN_PRODUCTION",
    label: "Production",
    icon: Factory,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    headerBg: "bg-purple-600",
  },
  {
    status: "EN_LOGISTIQUE",
    label: "Logistique",
    icon: Truck,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    headerBg: "bg-indigo-600",
  },
  {
    status: "PRETE_LIVRAISON",
    label: "Prête",
    icon: PackageCheck,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    headerBg: "bg-green-600",
  },
]

// ── Composant Carte ───────────────────────────────────────────────────────

function KanbanCard({ cmd, columnColor }: { cmd: CommandeCard; columnColor: string }) {
  const router = useRouter()
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
      className="bg-white rounded-xl border border-slate-100 p-3.5 cursor-pointer"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
      onClick={() => router.push(`/commandes/${cmd.id}`)}
    >
      {/* Header carte */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
          {cmd.numero}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0 mt-0.5" />
      </div>

      {/* Client */}
      <p className="text-xs font-semibold text-slate-800 leading-snug mb-3 line-clamp-2">
        {cmd.client.raisonSociale}
      </p>

      {/* Montant */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900">
          {formatMontant(Number(cmd.montantTotal))}
        </span>
        <span className="text-[10px] text-slate-400">
          {new Date(cmd.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
        </span>
      </div>
    </motion.div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────

export default function CommandesKanbanPage() {
  const router = useRouter()
  const [commandes, setCommandes] = useState<CommandeCard[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      // Charger toutes les commandes actives (sans les livrées ni annulées)
      const res = await fetch("/api/commandes?pageSize=200")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCommandes(
        (data.commandes ?? []).filter(
          (c: CommandeCard) => c.status !== "LIVREE" && c.status !== "ANNULEE"
        )
      )
    } catch {
      toast.error("Impossible de charger les commandes")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const byStatus = (status: CommandeStatus) =>
    commandes.filter((c) => c.status === status)

  const total = commandes.length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kanban des commandes"
        description={`${total} commande${total !== 1 ? "s" : ""} en cours`}
      >
        <div className="flex items-center gap-2">
          <Link
            href="/commandes"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <List className="h-3.5 w-3.5" />
            Vue liste
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-xs font-medium text-white">
            <LayoutGrid className="h-3.5 w-3.5" />
            Kanban
          </div>
        </div>
      </PageHeader>

      {/* Colonnes */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 180px)" }}>
        {COLUMNS.map((col) => {
          const cards = byStatus(col.status)
          const Icon = col.icon

          return (
            <motion.div
              key={col.status}
              className="flex-shrink-0 w-[280px] flex flex-col rounded-2xl overflow-hidden border"
              style={{ borderColor: "rgba(0,0,0,0.07)", background: "#f8fafc" }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1], delay: COLUMNS.indexOf(col) * 0.07 }}
            >
              {/* En-tête colonne */}
              <div className={`${col.headerBg} px-4 py-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-white/80" />
                    <span className="text-sm font-bold text-white">{col.label}</span>
                  </div>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs font-bold text-white">
                    {cards.length}
                  </span>
                </div>
              </div>

              {/* Cartes */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonKanbanCard key={i} />
                  ))
                ) : cards.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-slate-300"
                  >
                    <Icon className="h-8 w-8 mb-2" />
                    <p className="text-xs">Aucune commande</p>
                  </motion.div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {cards.map((cmd) => (
                      <KanbanCard key={cmd.id} cmd={cmd} columnColor={col.color} />
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Total colonne */}
              {!loading && cards.length > 0 && (
                <div className="px-4 py-2.5 border-t border-slate-100 bg-white/60">
                  <p className="text-[11px] font-semibold text-slate-400 text-right">
                    {formatMontant(cards.reduce((s, c) => s + Number(c.montantTotal), 0))} total
                  </p>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
