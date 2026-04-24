"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { RoleGate } from "@/components/shared/RoleGate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatMontant } from "@/lib/utils"
import {
  ArrowLeft, Loader2, Save, Factory, Send, Warehouse, Building2,
  CheckCircle2, Truck, Plus, ChevronDown, ChevronUp,
} from "lucide-react"

type EtapeLogistique = {
  id: string
  ordre: number
  etape: string
  estFait: boolean
  datePrevue: string | null
  dateReelle: string | null
  notes: string | null
}

type Transitaire = { id: string; nom: string; pays: string; contactNom: string | null; contactPhone: string | null }

type Logistique = {
  id: string
  label: string | null
  status: string
  transitaireNom: string | null
  transitaireContact: string | null
  numeroTracage: string | null
  fraisLogistiqueCFA: string | number | null
  poids: string | number | null
  prixLogistiqueKg: string | number | null
  etapes: EtapeLogistique[]
}

const STEP_ICONS = [Factory, Send, Warehouse, Building2]
const STEP_LABELS = ["Chez le fournisseur", "Expédition", "Chez le transitaire", "Livraison bureau"]

// ── LogistiqueCard ─────────────────────────────────────────────────────────
function LogistiqueCard({ logistique, onRefresh }: { logistique: Logistique; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(logistique.status !== "AU_BUREAU")
  const [etapeUpdates, setEtapeUpdates] = useState<
    Record<string, { datePrevue?: string; dateReelle?: string; notes?: string; estFait?: boolean }>
  >(() => {
    const init: Record<string, { datePrevue?: string; dateReelle?: string; notes?: string; estFait?: boolean }> = {}
    for (const e of logistique.etapes) {
      init[e.id] = {
        datePrevue: e.datePrevue?.split("T")[0] ?? "",
        dateReelle: e.dateReelle?.split("T")[0] ?? "",
        notes: e.notes ?? "",
        estFait: e.estFait,
      }
    }
    return init
  })
  const [savingEtape, setSavingEtape] = useState<string | null>(null)

  const sortedEtapes = [...logistique.etapes].sort((a, b) => a.ordre - b.ordre)
  const doneCount = sortedEtapes.filter((e) => e.estFait).length
  const activeIdx = sortedEtapes.findIndex((e) => !e.estFait)

  function updateEtapeField(etapeId: string, field: "datePrevue" | "dateReelle" | "notes" | "estFait", value: string | boolean) {
    setEtapeUpdates((prev) => ({ ...prev, [etapeId]: { ...prev[etapeId], [field]: value } }))
  }

  async function handleEtapeUpdate(etapeId: string) {
    setSavingEtape(etapeId)
    try {
      const res = await fetch(`/api/logistique/${logistique.id}/etape`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapeId, ...etapeUpdates[etapeId] }),
      })
      if (!res.ok) throw new Error()
      toast.success("Étape mise à jour")
      onRefresh()
    } catch { toast.error("Impossible de mettre à jour l'étape") }
    finally { setSavingEtape(null) }
  }

  return (
    <Card className={`overflow-hidden ${logistique.status === "AU_BUREAU" ? "border-cyan-200" : ""}`}>
      {/* Header */}
      <button className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 shrink-0">
            <Truck className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-900">
              {logistique.label ?? `Logistique #${logistique.id.slice(-4)}`}
            </p>
            <p className="text-xs text-slate-500">
              {logistique.transitaireNom ?? "Sans transitaire"} · {doneCount}/{sortedEtapes.length} étapes
            </p>
          </div>
          <Badge variant="outline" className="text-xs border-cyan-200 text-cyan-700 bg-cyan-50">
            {logistique.status.replace(/_/g, " ")}
          </Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 space-y-5 px-5 py-5">
          {/* Stepper */}
          <div className="overflow-hidden rounded-lg border border-slate-100">
            <div className="h-1 bg-slate-100">
              <div className="h-full bg-cyan-500 transition-all duration-500"
                style={{ width: `${sortedEtapes.length > 0 ? (doneCount / sortedEtapes.length) * 100 : 0}%` }} />
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                {sortedEtapes.map((etape, idx) => {
                  const Icon = STEP_ICONS[idx] ?? Truck
                  const done = etape.estFait
                  const active = idx === activeIdx
                  return (
                    <div key={etape.id} className="flex flex-col items-center gap-1 flex-1">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                        done ? "border-cyan-500 bg-cyan-500 text-white"
                        : active ? "border-cyan-400 bg-white text-cyan-600"
                        : "border-slate-200 bg-white text-slate-300"
                      }`}>
                        {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                      </div>
                      <span className={`text-center text-[10px] leading-tight max-w-[60px] ${
                        done ? "text-cyan-700 font-medium" : active ? "text-slate-800 font-semibold" : "text-slate-400"
                      }`}>{etape.etape}</span>
                      {done && etape.dateReelle && (
                        <span className="text-[9px] text-slate-400">{formatDate(etape.dateReelle)}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Infos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {logistique.transitaireNom && (
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Transitaire</p>
                <p className="font-semibold text-slate-900">{logistique.transitaireNom}</p>
                {logistique.transitaireContact && <p className="text-xs text-slate-500">{logistique.transitaireContact}</p>}
              </div>
            )}
            {logistique.numeroTracage && (
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Traçage</p>
                <Badge variant="outline" className="font-mono text-xs">{logistique.numeroTracage}</Badge>
              </div>
            )}
            {logistique.fraisLogistiqueCFA != null && (
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Frais transport & douane</p>
                <p className="font-semibold text-slate-900">{formatMontant(Number(logistique.fraisLogistiqueCFA), "CFA")}</p>
                {logistique.poids && logistique.prixLogistiqueKg && (
                  <p className="text-xs text-slate-400">{Number(logistique.poids)} kg × {formatMontant(Number(logistique.prixLogistiqueKg), "CFA")}/kg</p>
                )}
              </div>
            )}
          </div>

          {/* Étapes détail */}
          <div className="space-y-2">
            {sortedEtapes.map((etape, idx) => {
              const Icon = STEP_ICONS[idx] ?? Truck
              const update = etapeUpdates[etape.id] ?? {}
              const done = etape.estFait
              const active = idx === activeIdx
              const locked = !done && !active && idx > (activeIdx === -1 ? sortedEtapes.length - 1 : activeIdx)
              return (
                <Card key={etape.id} className={`transition-all ${
                  done ? "border-cyan-100 bg-cyan-50/30"
                  : active ? "border-cyan-300 shadow-sm"
                  : "border-slate-100 opacity-60"
                }`}>
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 mt-0.5 ${
                        done ? "bg-cyan-500 text-white" : active ? "bg-cyan-100 text-cyan-600" : "bg-slate-100 text-slate-400"
                      }`}>
                        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-slate-400 font-mono">0{idx + 1}</span>
                          <h3 className={`font-semibold text-sm ${done ? "text-cyan-800" : active ? "text-slate-900" : "text-slate-500"}`}>
                            {etape.etape}
                          </h3>
                          {done && <span className="text-xs text-cyan-700 font-medium bg-cyan-100 px-2 py-0.5 rounded-full">Complété</span>}
                          {active && <span className="text-xs text-cyan-600 font-semibold bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">En cours</span>}
                          {done && etape.dateReelle && <span className="text-xs text-slate-400 ml-auto">{formatDate(etape.dateReelle)}</span>}
                        </div>
                        {!locked && (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs text-slate-400">Date prévue</Label>
                              <Input type="date" value={update.datePrevue ?? ""} onChange={(e) => updateEtapeField(etape.id, "datePrevue", e.target.value)} className="h-7 text-xs" disabled={done} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-slate-400">Date réelle</Label>
                              <Input type="date" value={update.dateReelle ?? ""} onChange={(e) => updateEtapeField(etape.id, "dateReelle", e.target.value)} className="h-7 text-xs" disabled={done} />
                            </div>
                            {!done && (
                              <div className="col-span-2 space-y-1">
                                <Label className="text-xs text-slate-400">Notes</Label>
                                <Textarea value={update.notes ?? ""} onChange={(e) => updateEtapeField(etape.id, "notes", e.target.value)} rows={2} className="resize-none text-xs" />
                              </div>
                            )}
                            {etape.notes && done && <p className="col-span-2 text-xs text-slate-500 italic">{etape.notes}</p>}
                          </div>
                        )}
                        {!done && !locked && (
                          <RoleGate roles={["MANAGER", "CHARGE_OPERATIONS"]}>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" checked={update.estFait ?? false}
                                  onChange={(e) => updateEtapeField(etape.id, "estFait", e.target.checked)}
                                  className="h-4 w-4 rounded border-slate-300 accent-cyan-600" />
                                <span className="text-sm text-slate-700 font-medium">Marquer comme complété</span>
                              </label>
                              <Button size="sm" onClick={() => handleEtapeUpdate(etape.id)} disabled={savingEtape === etape.id}
                                className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs h-7 px-3">
                                {savingEtape === etape.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                                Enregistrer
                              </Button>
                            </div>
                          </RoleGate>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}

// ── Page principale ────────────────────────────────────────────────────────
export default function LogistiquePage() {
  const { id } = useParams<{ id: string }>()

  const [logistiques, setLogistiques] = useState<Logistique[]>([])
  const [commandeNumero, setCommandeNumero] = useState("")
  const [loading, setLoading] = useState(true)
  const [transitaires, setTransitaires] = useState<Transitaire[]>([])
  const [showForm, setShowForm] = useState(false)

  const [formLabel, setFormLabel] = useState("")
  const [formTransitaireId, setFormTransitaireId] = useState("")
  const [formNomTransitaire, setFormNomTransitaire] = useState("")
  const [formContactTransitaire, setFormContactTransitaire] = useState("")
  const [formNumeroTracage, setFormNumeroTracage] = useState("")
  const [formPoids, setFormPoids] = useState<number | "">("")
  const [formPrixKg, setFormPrixKg] = useState<number | "">("")
  const [saving, setSaving] = useState(false)

  const fraisLogistique = typeof formPoids === "number" && typeof formPrixKg === "number"
    ? Math.round(formPoids * formPrixKg) : null

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/commandes/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLogistiques(data.logistiques ?? [])
      setCommandeNumero(data.numero ?? "")
    } catch { toast.error("Impossible de charger les données") }
    finally { setLoading(false) }
  }, [id])

  const fetchTransitaires = useCallback(async () => {
    try {
      const res = await fetch("/api/transitaires?includeInactif=false")
      if (!res.ok) return
      const data = await res.json()
      setTransitaires(data.transitaires ?? data)
    } catch { /* non-bloquant */ }
  }, [])

  useEffect(() => { fetchData(); fetchTransitaires() }, [fetchData, fetchTransitaires])

  function handleTransitaireChange(tId: string) {
    setFormTransitaireId(tId)
    const t = transitaires.find((x) => x.id === tId)
    if (t) {
      setFormNomTransitaire(t.nom)
      setFormContactTransitaire([t.contactNom, t.contactPhone].filter(Boolean).join(" — "))
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/logistique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commandeId: id,
          label: formLabel.trim() || undefined,
          transitaireId: formTransitaireId || undefined,
          transitaireNom: formNomTransitaire.trim() || undefined,
          transitaireContact: formContactTransitaire.trim() || undefined,
          numeroTracage: formNumeroTracage.trim() || undefined,
          poids: typeof formPoids === "number" ? formPoids : undefined,
          prixLogistiqueKg: typeof formPrixKg === "number" ? formPrixKg : undefined,
          fraisLogistiqueCFA: fraisLogistique ?? undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erreur")
      toast.success("Logistique créée")
      setShowForm(false)
      setFormLabel(""); setFormTransitaireId(""); setFormNomTransitaire(""); setFormContactTransitaire("")
      setFormNumeroTracage(""); setFormPoids(""); setFormPrixKg("")
      fetchData()
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erreur") }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />Chargement...
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Logistique" description={commandeNumero ? `Commande ${commandeNumero}` : ""}>
        <Link href={`/commandes/${id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />Retour à la commande
        </Link>
      </PageHeader>

      {/* Liste des logistiques */}
      {logistiques.length > 0 ? (
        <div className="space-y-3">
          {logistiques.map((log) => (
            <LogistiqueCard key={log.id} logistique={log} onRefresh={fetchData} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-12 gap-3 text-slate-400">
            <Truck className="h-10 w-10" />
            <p className="text-sm">Aucun suivi logistique pour cette commande.</p>
          </CardContent>
        </Card>
      )}

      {/* Bouton / formulaire nouvelle logistique */}
      <RoleGate roles={["MANAGER", "CHARGE_OPERATIONS"]}>
        {!showForm ? (
          <Button variant="outline" className="w-full border-dashed" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {logistiques.length === 0 ? "Créer le suivi logistique" : "Ajouter une logistique (2ème fournisseur…)"}
          </Button>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  {logistiques.length === 0 ? "Créer le suivi logistique" : "Nouvelle logistique"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="formLabel">Libellé (optionnel)</Label>
                  <Input id="formLabel" placeholder="Ex: Fournisseur Chine, Transitaire B…"
                    value={formLabel} onChange={(e) => setFormLabel(e.target.value)} />
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Transitaire</Label>
                    <Select value={formTransitaireId} onValueChange={(v) => v && handleTransitaireChange(v)}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner un transitaire..." /></SelectTrigger>
                      <SelectContent>
                        {transitaires.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.nom} — {t.pays}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nom transitaire</Label>
                    <Input placeholder="Ex: SDV, Bolloré…" value={formNomTransitaire} onChange={(e) => setFormNomTransitaire(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contact transitaire</Label>
                    <Input placeholder="Nom, téléphone…" value={formContactTransitaire} onChange={(e) => setFormContactTransitaire(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Numéro de traçage</Label>
                    <Input placeholder="Tracking number…" value={formNumeroTracage} onChange={(e) => setFormNumeroTracage(e.target.value)} />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Poids total (kg)</Label>
                    <Input type="number" min={0} step="0.001" placeholder="0.000"
                      value={formPoids} onChange={(e) => setFormPoids(parseFloat(e.target.value) || "")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>FCFA / kg</Label>
                    <Input type="number" min={0} step="0.01" placeholder="0"
                      value={formPrixKg} onChange={(e) => setFormPrixKg(parseFloat(e.target.value) || "")} />
                  </div>
                  {fraisLogistique !== null && (
                    <div className="col-span-2 flex items-center justify-between rounded-lg border border-cyan-100 bg-cyan-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Frais transport & dédouanement</p>
                        <p className="text-xs text-cyan-600">Enregistré automatiquement comme dépense</p>
                      </div>
                      <p className="text-lg font-bold text-slate-900">{formatMontant(fraisLogistique, "CFA")}</p>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Étapes créées automatiquement</p>
                  <div className="flex items-center gap-2">
                    {STEP_LABELS.map((label, idx) => {
                      const Icon = STEP_ICONS[idx] ?? Truck
                      const isFirst = idx === 0
                      return (
                        <div key={idx} className="flex items-center gap-2 flex-1">
                          <div className="flex flex-col items-center gap-1 flex-1">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-full ${isFirst ? "bg-cyan-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                              {isFirst ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                            </div>
                            <span className={`text-[9px] text-center leading-tight max-w-[55px] ${isFirst ? "text-cyan-700 font-semibold" : "text-slate-400"}`}>{label}</span>
                          </div>
                          {idx < STEP_LABELS.length - 1 && <div className={`h-px flex-1 -mt-5 ${isFirst ? "bg-cyan-300" : "bg-slate-200"}`} />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pb-6">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" disabled={saving} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                {saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Création...</> : <><Save className="h-4 w-4 mr-1.5" />Créer</>}
              </Button>
            </div>
          </form>
        )}
      </RoleGate>
    </div>
  )
}
