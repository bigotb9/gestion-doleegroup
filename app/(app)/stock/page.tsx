"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { RoleGate } from "@/components/shared/RoleGate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatDate } from "@/lib/utils"
import {
  Search,
  Package,
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Inbox,
} from "lucide-react"
import Link from "next/link"

type Reception = {
  id: string
  designation: string
  quantiteCommandee: number
  quantiteRecue: number
  quantiteLivree: number
  notes: string | null
  dateReception: string | null
  commande: {
    id: string
    numero: string
    status: string
    client: { raisonSociale: string }
  }
}

type CommandeGroup = {
  commandeId: string
  numero: string
  client: string
  status: string
  receptions: Reception[]
}

type CommandeOption = {
  id: string
  numero: string
  client: { raisonSociale: string }
}

function getStatut(r: Reception): "COMPLET" | "PARTIEL" | "ATTENTE" | "SURPLUS" {
  if (r.quantiteRecue === 0) return "ATTENTE"
  const surplus = r.quantiteRecue - r.quantiteCommandee
  if (surplus > 0) return "SURPLUS"
  if (r.quantiteRecue >= r.quantiteCommandee) return "COMPLET"
  return "PARTIEL"
}

const STATUT_BADGE = {
  COMPLET: { label: "Reçu", className: "bg-green-100 text-green-700" },
  PARTIEL: { label: "Partiel", className: "bg-amber-100 text-amber-700" },
  ATTENTE: { label: "En attente", className: "bg-slate-100 text-slate-600" },
  SURPLUS: { label: "Surplus", className: "bg-blue-100 text-blue-700" },
}

export default function StockPage() {
  const [receptions, setReceptions] = useState<Reception[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [expandedCommandes, setExpandedCommandes] = useState<Set<string>>(new Set())

  // Init réceptions dialog
  const [initOpen, setInitOpen] = useState(false)
  const [commandesDisponibles, setCommandesDisponibles] = useState<CommandeOption[]>([])
  const [selectedCommandeId, setSelectedCommandeId] = useState("")
  const [initLoading, setInitLoading] = useState(false)
  const [initSubmitting, setInitSubmitting] = useState(false)

  // Edit réception dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editReception, setEditReception] = useState<Reception | null>(null)
  const [editQuantite, setEditQuantite] = useState<number | "">("")
  const [editDate, setEditDate] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [editSubmitting, setEditSubmitting] = useState(false)

  const fetchReceptions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/stock/receptions")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setReceptions(data)
      // Expand tout par défaut si peu de commandes
      const ids = new Set<string>(data.map((r: Reception) => r.commande.id))
      if (ids.size <= 5) setExpandedCommandes(ids)
    } catch {
      toast.error("Impossible de charger le stock")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReceptions() }, [fetchReceptions])

  async function openInitDialog() {
    setInitOpen(true)
    setInitLoading(true)
    try {
      const res = await fetch("/api/commandes?pageSize=200")
      if (!res.ok) throw new Error()
      const data = await res.json()
      // Filtre : commandes qui ont des lignes (on laisse l'API gérer le doublon)
      const commandes: CommandeOption[] = (data.commandes ?? data)
      setCommandesDisponibles(commandes)
    } catch {
      toast.error("Impossible de charger les commandes")
    } finally {
      setInitLoading(false)
    }
  }

  async function handleInit() {
    if (!selectedCommandeId) return
    setInitSubmitting(true)
    try {
      const res = await fetch("/api/stock/receptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commandeId: selectedCommandeId }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erreur")
      toast.success("Réceptions initialisées")
      setInitOpen(false)
      setSelectedCommandeId("")
      fetchReceptions()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setInitSubmitting(false)
    }
  }

  function openEdit(r: Reception) {
    setEditReception(r)
    setEditQuantite(r.quantiteRecue)
    setEditDate(r.dateReception?.split("T")[0] ?? "")
    setEditNotes(r.notes ?? "")
    setEditOpen(true)
  }

  async function handleEditSave() {
    if (!editReception) return
    setEditSubmitting(true)
    try {
      const res = await fetch(`/api/stock/receptions/${editReception.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantiteRecue: typeof editQuantite === "number" ? editQuantite : 0,
          dateReception: editDate || null,
          notes: editNotes.trim() || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erreur")
      toast.success("Réception mise à jour")
      setEditOpen(false)
      fetchReceptions()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setEditSubmitting(false)
    }
  }

  function toggleCommande(id: string) {
    setExpandedCommandes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Grouper par commande
  const grouped: CommandeGroup[] = []
  const seen = new Map<string, CommandeGroup>()
  for (const r of receptions) {
    if (!seen.has(r.commande.id)) {
      const g: CommandeGroup = {
        commandeId: r.commande.id,
        numero: r.commande.numero,
        client: r.commande.client.raisonSociale,
        status: r.commande.status,
        receptions: [],
      }
      seen.set(r.commande.id, g)
      grouped.push(g)
    }
    seen.get(r.commande.id)!.receptions.push(r)
  }

  const filtered = grouped.filter((g) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      g.numero.toLowerCase().includes(q) ||
      g.client.toLowerCase().includes(q) ||
      g.receptions.some((r) => r.designation.toLowerCase().includes(q))
    )
  })

  // Stats globales
  const totalArticles = receptions.length
  const totalRecus = receptions.filter((r) => r.quantiteRecue >= r.quantiteCommandee).length
  const totalAttente = receptions.filter((r) => r.quantiteRecue === 0).length
  const totalSurplus = receptions.filter((r) => r.quantiteRecue > r.quantiteCommandee).length

  return (
    <div className="space-y-6">
      <PageHeader title="Stock" description="Suivi des réceptions par commande">
        <RoleGate roles={["MANAGER", "SECRETAIRE", "CHARGE_OPERATIONS"]}>
          <Button onClick={openInitDialog} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Nouvelle réception
          </Button>
        </RoleGate>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total articles", value: totalArticles, icon: Package, color: "text-slate-600", bg: "bg-slate-100" },
          { label: "Entièrement reçus", value: totalRecus, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
          { label: "En attente", value: totalAttente, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
          { label: "Avec surplus", value: totalSurplus, icon: AlertCircle, color: "text-blue-600", bg: "bg-blue-100" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 pt-4 pb-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${s.bg} ${s.color} shrink-0`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recherche */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Commande, client, article..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />Chargement...
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 gap-3 text-slate-400">
            <Inbox className="h-10 w-10" />
            <p className="text-sm font-medium">Aucune réception enregistrée</p>
            <p className="text-xs text-slate-400">Cliquez sur &quot;Nouvelle réception&quot; pour initialiser le suivi d&apos;une commande.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((group) => {
            const expanded = expandedCommandes.has(group.commandeId)
            const totalRecu = group.receptions.reduce((a, r) => a + r.quantiteRecue, 0)
            const totalCmd = group.receptions.reduce((a, r) => a + r.quantiteCommandee, 0)
            const totalLivre = group.receptions.reduce((a, r) => a + r.quantiteLivree, 0)
            const pct = totalCmd > 0 ? Math.min(100, Math.round((totalRecu / totalCmd) * 100)) : 0
            const allReceived = totalRecu >= totalCmd

            return (
              <Card key={group.commandeId} className="overflow-hidden">
                {/* Header commande */}
                <button
                  onClick={() => toggleCommande(group.commandeId)}
                  className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/commandes/${group.commandeId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors text-sm"
                        >
                          {group.numero}
                        </Link>
                        <span className="text-xs text-slate-400">{group.client}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {/* Barre de réception */}
                        <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${allReceived ? "bg-green-500" : "bg-amber-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{pct}% reçu</span>
                        {totalLivre > 0 && (
                          <span className="text-xs text-green-600 font-medium">{totalLivre} livré{totalLivre > 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span className="text-xs text-slate-400">{group.receptions.length} article{group.receptions.length > 1 ? "s" : ""}</span>
                    {expanded
                      ? <ChevronUp className="h-4 w-4 text-slate-400" />
                      : <ChevronDown className="h-4 w-4 text-slate-400" />
                    }
                  </div>
                </button>

                {/* Détail lignes */}
                {expanded && (
                  <div className="border-t border-slate-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-5 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Article</th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Commandé</th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Reçu</th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Surplus</th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">À recevoir</th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Livré</th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                          <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {group.receptions.map((r) => {
                          const surplus = Math.max(0, r.quantiteRecue - r.quantiteCommandee)
                          const aRecevoir = Math.max(0, r.quantiteCommandee - r.quantiteRecue)
                          const statut = getStatut(r)
                          const badge = STATUT_BADGE[statut]

                          return (
                            <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-5 py-3">
                                <p className="font-medium text-slate-900">{r.designation}</p>
                                {r.dateReception && (
                                  <p className="text-xs text-slate-400">{formatDate(r.dateReception)}</p>
                                )}
                                {r.notes && (
                                  <p className="text-xs text-slate-400 italic truncate max-w-[200px]">{r.notes}</p>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-slate-700">{r.quantiteCommandee}</td>
                              <td className="px-4 py-3 text-center font-mono font-semibold text-slate-900">{r.quantiteRecue}</td>
                              <td className="px-4 py-3 text-center font-mono">
                                {surplus > 0
                                  ? <span className="text-blue-600 font-semibold">+{surplus}</span>
                                  : <span className="text-slate-300">—</span>
                                }
                              </td>
                              <td className="px-4 py-3 text-center font-mono">
                                {aRecevoir > 0
                                  ? <span className="text-amber-600 font-semibold">{aRecevoir}</span>
                                  : <span className="text-slate-300">—</span>
                                }
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-green-700">{r.quantiteLivree || <span className="text-slate-300">—</span>}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                                  {badge.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <RoleGate roles={["MANAGER", "SECRETAIRE", "CHARGE_OPERATIONS"]}>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs text-slate-500 hover:text-slate-800"
                                    onClick={() => openEdit(r)}
                                  >
                                    Modifier
                                  </Button>
                                </RoleGate>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      {/* Totaux */}
                      <tfoot>
                        <tr className="bg-slate-50 border-t border-slate-200">
                          <td className="px-5 py-2 text-xs font-semibold text-slate-500 uppercase">Total</td>
                          <td className="px-4 py-2 text-center font-mono font-semibold text-slate-700">
                            {group.receptions.reduce((a, r) => a + r.quantiteCommandee, 0)}
                          </td>
                          <td className="px-4 py-2 text-center font-mono font-semibold text-slate-900">
                            {group.receptions.reduce((a, r) => a + r.quantiteRecue, 0)}
                          </td>
                          <td className="px-4 py-2 text-center font-mono font-semibold text-blue-600">
                            {(() => {
                              const s = group.receptions.reduce((a, r) => a + Math.max(0, r.quantiteRecue - r.quantiteCommandee), 0)
                              return s > 0 ? `+${s}` : "—"
                            })()}
                          </td>
                          <td className="px-4 py-2 text-center font-mono font-semibold text-amber-600">
                            {(() => {
                              const a = group.receptions.reduce((acc, r) => acc + Math.max(0, r.quantiteCommandee - r.quantiteRecue), 0)
                              return a > 0 ? a : "—"
                            })()}
                          </td>
                          <td className="px-4 py-2 text-center font-mono font-semibold text-green-700">
                            {group.receptions.reduce((a, r) => a + r.quantiteLivree, 0) || "—"}
                          </td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog — Initialiser réceptions */}
      <Dialog open={initOpen} onOpenChange={setInitOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Initialiser une réception</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-600">
              Sélectionnez une commande pour créer automatiquement les lignes de suivi de réception depuis ses produits.
            </p>
            {initLoading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-4 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />Chargement...
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Commande</Label>
                <Select value={selectedCommandeId} onValueChange={(v) => setSelectedCommandeId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une commande..." />
                  </SelectTrigger>
                  <SelectContent>
                    {commandesDisponibles.length === 0 ? (
                      <SelectItem value="_none" disabled>Aucune commande disponible</SelectItem>
                    ) : (
                      commandesDisponibles.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.numero} — {c.client.raisonSociale}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInitOpen(false)}>Annuler</Button>
            <Button onClick={handleInit} disabled={!selectedCommandeId || initSubmitting}>
              {initSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Initialiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog — Modifier réception */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enregistrer la réception</DialogTitle>
          </DialogHeader>
          {editReception && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
                <p className="font-semibold text-slate-900 text-sm">{editReception.designation}</p>
                <p className="text-xs text-slate-500">{editReception.commande.numero} · commandé : {editReception.quantiteCommandee}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editQty">Quantité reçue</Label>
                <Input
                  id="editQty"
                  type="number"
                  min={0}
                  value={editQuantite}
                  onChange={(e) => setEditQuantite(parseInt(e.target.value) || 0)}
                  autoFocus
                />
                {typeof editQuantite === "number" && editQuantite > editReception.quantiteCommandee && (
                  <p className="text-xs text-blue-600 font-medium">
                    Surplus : +{editQuantite - editReception.quantiteCommandee} unités
                  </p>
                )}
                {typeof editQuantite === "number" && editQuantite < editReception.quantiteCommandee && editQuantite > 0 && (
                  <p className="text-xs text-amber-600">
                    Reste à recevoir : {editReception.quantiteCommandee - editQuantite} unités
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editDate">Date de réception</Label>
                <Input
                  id="editDate"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editNotes">Notes</Label>
                <Textarea
                  id="editNotes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="État des produits, remarques..."
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
            <Button onClick={handleEditSave} disabled={editSubmitting}>
              {editSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
