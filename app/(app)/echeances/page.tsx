"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, formatMontant, cn } from "@/lib/utils"
import {
  Loader2,
  CalendarClock,
  FileText,
  Truck,
  Factory,
  ShoppingCart,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

type DevisRow = {
  id: string; numero: string; status: string
  dateValidite: string; total: string | number; devise: string
  client: { id: string; raisonSociale: string }
}
type LivraisonRow = {
  id: string; status: string; datePrevue: string; adresseLivraison: string
  commande: { id: string; numero: string }
  client: { id: string; raisonSociale: string }
  assignedTo: { name: string } | null
}
type ProductionRow = {
  id: string; status: string; numeroBCF: string | null
  dateFinProductionPrevue: string; dateFinProductionReelle: string | null
  fournisseur: { nom: string; pays: string }
  commande: { id: string; numero: string; client: { raisonSociale: string } }
}
type CommandeLivraisonRow = {
  id: string; numero: string; status: string
  dateLivraisonPrevue: string; montantTotal: string | number; devise: string
  client: { id: string; raisonSociale: string }
}

type EcheancesData = {
  devisExpirants: DevisRow[]
  livraisonsPlanifiees: LivraisonRow[]
  productionsEnCours: ProductionRow[]
  commandesDateLivraison: CommandeLivraisonRow[]
}

// ── Helpers ────────────────────────────────────────────────────────────────

type Urgency = "overdue" | "today" | "week" | "soon"

function getUrgency(dateStr: string): Urgency {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays < 0) return "overdue"
  if (diffDays < 1) return "today"
  if (diffDays <= 7) return "week"
  return "soon"
}

const URGENCY_STYLES: Record<Urgency, { bg: string; text: string; border: string; label: string }> = {
  overdue: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "En retard" },
  today:   { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-300", label: "Aujourd'hui" },
  week:    { bg: "bg-blue-50",  text: "text-blue-700",  border: "border-blue-200", label: "Cette semaine" },
  soon:    { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", label: "Prochainement" },
}

const URGENCY_ORDER: Urgency[] = ["overdue", "today", "week", "soon"]

function UrgencyBadge({ date }: { date: string }) {
  const u = getUrgency(date)
  const s = URGENCY_STYLES[u]
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border", s.bg, s.text, s.border)}>
      {u === "overdue" && <AlertTriangle className="h-3 w-3" />}
      {u === "today" && <Clock className="h-3 w-3" />}
      {u === "week" && <CalendarClock className="h-3 w-3" />}
      {s.label}
    </span>
  )
}

type EcheanceItem = {
  key: string
  date: string
  urgency: Urgency
  content: React.ReactNode
}

// ── Page ───────────────────────────────────────────────────────────────────

type TabFilter = "ALL" | "DEVIS" | "LIVRAISON" | "PRODUCTION" | "COMMANDE"
const TABS: { label: string; value: TabFilter; icon: React.ElementType }[] = [
  { label: "Toutes", value: "ALL", icon: CalendarClock },
  { label: "Devis", value: "DEVIS", icon: FileText },
  { label: "Livraisons", value: "LIVRAISON", icon: Truck },
  { label: "Production", value: "PRODUCTION", icon: Factory },
  { label: "Commandes", value: "COMMANDE", icon: ShoppingCart },
]

export default function EcheancesPage() {
  const [data, setData] = useState<EcheancesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabFilter>("ALL")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/echeances")
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      toast.error("Impossible de charger les échéances")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Construire la liste unifiée d'échéances
  const items: EcheanceItem[] = []

  if (data && (tab === "ALL" || tab === "DEVIS")) {
    data.devisExpirants.forEach((d) => {
      items.push({
        key: `devis-${d.id}`,
        date: d.dateValidite,
        urgency: getUrgency(d.dateValidite),
        content: (
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1.5 rounded-md bg-indigo-100">
                <FileText className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/devis/${d.id}`} className="font-mono text-sm font-semibold text-blue-700 hover:underline">
                    {d.numero}
                  </Link>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-medium">Devis</span>
                </div>
                <p className="text-sm text-slate-700">{d.client.raisonSociale}</p>
                <p className="text-xs text-slate-400">Expire le {formatDate(d.dateValidite)}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-slate-800">{formatMontant(Number(d.total))}</p>
              <UrgencyBadge date={d.dateValidite} />
            </div>
          </div>
        ),
      })
    })
  }

  if (data && (tab === "ALL" || tab === "LIVRAISON")) {
    data.livraisonsPlanifiees.forEach((l) => {
      items.push({
        key: `livraison-${l.id}`,
        date: l.datePrevue,
        urgency: getUrgency(l.datePrevue),
        content: (
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1.5 rounded-md bg-green-100">
                <Truck className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/commandes/${l.commande.id}/livraison`} className="font-mono text-sm font-semibold text-blue-700 hover:underline">
                    {l.commande.numero}
                  </Link>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-medium">Livraison</span>
                </div>
                <p className="text-sm text-slate-700">{l.client.raisonSociale}</p>
                <p className="text-xs text-slate-400">
                  {formatDate(l.datePrevue)}{l.assignedTo ? ` · ${l.assignedTo.name}` : ""}
                </p>
              </div>
            </div>
            <UrgencyBadge date={l.datePrevue} />
          </div>
        ),
      })
    })
  }

  if (data && (tab === "ALL" || tab === "PRODUCTION")) {
    data.productionsEnCours.forEach((p) => {
      items.push({
        key: `prod-${p.id}`,
        date: p.dateFinProductionPrevue,
        urgency: getUrgency(p.dateFinProductionPrevue),
        content: (
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1.5 rounded-md bg-amber-100">
                <Factory className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/commandes/${p.commande.id}/production`} className="font-mono text-sm font-semibold text-blue-700 hover:underline">
                    {p.commande.numero}
                  </Link>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">Production</span>
                  {p.numeroBCF && (
                    <span className="font-mono text-xs text-slate-500">{p.numeroBCF}</span>
                  )}
                </div>
                <p className="text-sm text-slate-700">{p.commande.client.raisonSociale}</p>
                <p className="text-xs text-slate-400">
                  Fin prévue {formatDate(p.dateFinProductionPrevue)} · {p.fournisseur.nom} ({p.fournisseur.pays})
                </p>
              </div>
            </div>
            <UrgencyBadge date={p.dateFinProductionPrevue} />
          </div>
        ),
      })
    })
  }

  if (data && (tab === "ALL" || tab === "COMMANDE")) {
    data.commandesDateLivraison.forEach((c) => {
      items.push({
        key: `cmd-${c.id}`,
        date: c.dateLivraisonPrevue,
        urgency: getUrgency(c.dateLivraisonPrevue),
        content: (
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1.5 rounded-md bg-purple-100">
                <ShoppingCart className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/commandes/${c.id}`} className="font-mono text-sm font-semibold text-blue-700 hover:underline">
                    {c.numero}
                  </Link>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">Commande</span>
                </div>
                <p className="text-sm text-slate-700">{c.client.raisonSociale}</p>
                <p className="text-xs text-slate-400">Livraison prévue le {formatDate(c.dateLivraisonPrevue)}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-slate-500">{formatMontant(Number(c.montantTotal))}</p>
              <UrgencyBadge date={c.dateLivraisonPrevue} />
            </div>
          </div>
        ),
      })
    })
  }

  // Trier par date
  items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Grouper par urgence
  const grouped = URGENCY_ORDER.map((u) => ({
    urgency: u,
    style: URGENCY_STYLES[u],
    items: items.filter((i) => i.urgency === u),
  })).filter((g) => g.items.length > 0)

  const total = items.length
  const overdueCount = items.filter((i) => i.urgency === "overdue").length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau des échéances"
        description={
          loading ? "…" :
          total === 0 ? "Aucune échéance à surveiller" :
          `${total} échéance${total > 1 ? "s" : ""}${overdueCount > 0 ? ` · ${overdueCount} en retard` : ""}`
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon
          const count = t.value === "ALL" ? items.length
            : t.value === "DEVIS" ? (data?.devisExpirants.length ?? 0)
            : t.value === "LIVRAISON" ? (data?.livraisonsPlanifiees.length ?? 0)
            : t.value === "PRODUCTION" ? (data?.productionsEnCours.length ?? 0)
            : (data?.commandesDateLivraison.length ?? 0)
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
                tab === t.value
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              {count > 0 && (
                <span className={cn("ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold",
                  tab === t.value ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Chargement…
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <CheckCircle2 className="h-12 w-12 text-green-400" />
          <p className="font-semibold text-green-600">Aucune échéance dans les 60 prochains jours</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.urgency}>
              <div className="flex items-center gap-2 mb-3">
                {group.urgency === "overdue" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                {group.urgency === "today" && <Clock className="h-4 w-4 text-amber-500" />}
                {group.urgency === "week" && <CalendarClock className="h-4 w-4 text-blue-500" />}
                {group.urgency === "soon" && <CalendarClock className="h-4 w-4 text-slate-400" />}
                <h3 className={cn("text-sm font-bold uppercase tracking-wide", group.style.text)}>
                  {group.style.label} — {group.items.length} échéance{group.items.length > 1 ? "s" : ""}
                </h3>
              </div>
              <Card className={cn("border", group.style.border)}>
                <CardContent className="p-0 divide-y divide-slate-100">
                  {group.items.map((item) => (
                    <div key={item.key} className="px-5 py-4">
                      {item.content}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
