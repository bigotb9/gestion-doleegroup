"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { RoleGate } from "@/components/shared/RoleGate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { formatDate, formatDateTime, cn } from "@/lib/utils"
import { RECOND_STATUS_LABELS } from "@/lib/constants"
import {
  ArrowLeft, Loader2, Package, CheckCircle2, Clock, PlayCircle,
  Save, SkipForward, Plus, ChevronDown, ChevronUp,
} from "lucide-react"
import Link from "next/link"

type ReconditionnementStatus = "EN_ATTENTE" | "EN_COURS" | "TERMINE"

type Reconditionnement = {
  id: string
  label: string | null
  status: ReconditionnementStatus
  typePersonalisation: string | null
  instructions: string | null
  fichierBAT: string | null
  notes: string | null
  dateDebut: string | null
  dateFin: string | null
  createdAt: string
}

type ReceptionStock = {
  id: string
  designation: string
  quantiteCommandee: number
  quantiteRecue: number
  quantiteReconditionnee: number
}

const STATUS_ORDER: ReconditionnementStatus[] = ["EN_ATTENTE", "EN_COURS", "TERMINE"]

const TYPE_OPTIONS = [
  { value: "gravure", label: "Gravure" },
  { value: "broderie", label: "Broderie" },
  { value: "sérigraphie", label: "Sérigraphie" },
  { value: "impression", label: "Impression" },
  { value: "emballage", label: "Emballage personnalisé" },
  { value: "étiquetage", label: "Étiquetage" },
  { value: "autre", label: "Autre" },
]

// ── ReconditionnementCard ──────────────────────────────────────────────────
function ReconditionnementCard({ recon, onRefresh }: { recon: Reconditionnement; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(recon.status !== "TERMINE")
  const [statusChanging, setStatusChanging] = useState(false)

  async function handleStatusChange(newStatus: ReconditionnementStatus) {
    setStatusChanging(true)
    try {
      const res = await fetch(`/api/reconditionnement/${recon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur")
      toast.success("Statut mis à jour")
      onRefresh()
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erreur") }
    finally { setStatusChanging(false) }
  }

  const currentIdx = STATUS_ORDER.indexOf(recon.status)

  return (
    <Card className={`overflow-hidden ${recon.status === "TERMINE" ? "border-green-200" : ""}`}>
      {/* Header */}
      <button className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 shrink-0">
            <Package className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-900">
              {recon.label ?? (recon.typePersonalisation ? recon.typePersonalisation.charAt(0).toUpperCase() + recon.typePersonalisation.slice(1) : `Reconditionnement #${recon.id.slice(-4)}`)}
            </p>
            <p className="text-xs text-slate-500">{formatDate(recon.createdAt)}</p>
          </div>
          <StatusBadge status={recon.status} />
        </div>
        <div className="shrink-0">
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-4">
          {/* Barre de progression */}
          <div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden mb-3">
              <div className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${Math.round(((currentIdx + 1) / STATUS_ORDER.length) * 100)}%` }} />
            </div>
            <div className="flex items-center justify-between">
              {STATUS_ORDER.map((s, idx) => {
                const isDone = idx < currentIdx
                const isCurrent = idx === currentIdx
                return (
                  <div key={s} className="flex flex-col items-center gap-1 flex-1">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center",
                      isDone ? "bg-green-500 text-white" : isCurrent ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400")}>
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : isCurrent ? <PlayCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <span className="text-xs text-slate-500 text-center">{RECOND_STATUS_LABELS[s]}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions statut */}
          <RoleGate roles={["MANAGER", "CHARGE_OPERATIONS"]}>
            {recon.status !== "TERMINE" && (
              <div className="flex gap-2">
                {recon.status === "EN_ATTENTE" && (
                  <Button size="sm" onClick={() => handleStatusChange("EN_COURS")} disabled={statusChanging}>
                    {statusChanging && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                    Démarrer
                  </Button>
                )}
                {recon.status === "EN_COURS" && (
                  <Button size="sm" onClick={() => handleStatusChange("TERMINE")} disabled={statusChanging}>
                    {statusChanging && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                    Marquer comme terminé
                  </Button>
                )}
              </div>
            )}
          </RoleGate>

          {/* Détails */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {recon.typePersonalisation && (
              <div>
                <p className="text-slate-500">Type</p>
                <p className="font-medium capitalize">{recon.typePersonalisation}</p>
              </div>
            )}
            {recon.dateDebut && <div><p className="text-slate-500">Début</p><p>{formatDateTime(recon.dateDebut)}</p></div>}
            {recon.dateFin && <div><p className="text-slate-500">Fin</p><p>{formatDateTime(recon.dateFin)}</p></div>}
            {recon.fichierBAT && (
              <div className="col-span-2">
                <p className="text-slate-500">Fichier BAT</p>
                <a href={recon.fichierBAT} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">{recon.fichierBAT}</a>
              </div>
            )}
            {recon.instructions && (
              <div className="col-span-2">
                <p className="text-slate-500">Instructions</p>
                <p className="whitespace-pre-wrap text-slate-700 text-xs">{recon.instructions}</p>
              </div>
            )}
            {recon.notes && (
              <div className="col-span-2">
                <p className="text-slate-500">Notes</p>
                <p className="whitespace-pre-wrap text-slate-700 text-xs">{recon.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

// ── Page principale ────────────────────────────────────────────────────────
export default function ReconditionnementPage() {
  const { id: commandeId } = useParams<{ id: string }>()

  const [recons, setRecons] = useState<Reconditionnement[]>([])
  const [receptions, setReceptions] = useState<ReceptionStock[]>([])
  const [commandeNumero, setCommandeNumero] = useState("")
  const [commandeStatus, setCommandeStatus] = useState("")
  const [loading, setLoading] = useState(true)

  const [reconQtys, setReconQtys] = useState<Record<string, number>>({})
  const [savingReconId, setSavingReconId] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [formLabel, setFormLabel] = useState("")
  const [formType, setFormType] = useState("")
  const [formInstructions, setFormInstructions] = useState("")
  const [formBAT, setFormBAT] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [formSubmitting, setFormSubmitting] = useState(false)

  const [skipping, setSkipping] = useState(false)

  const fetchRecon = useCallback(async () => {
    setLoading(true)
    try {
      const [reconRes, recepRes, cmdRes] = await Promise.all([
        fetch(`/api/reconditionnement?commandeId=${commandeId}`),
        fetch(`/api/stock/receptions?commandeId=${commandeId}`),
        fetch(`/api/commandes/${commandeId}`),
      ])
      if (reconRes.ok) {
        const json = await reconRes.json()
        setRecons(json.reconditionnements ?? [])
      }
      if (recepRes.ok) {
        const data: ReceptionStock[] = await recepRes.json()
        const init: Record<string, number> = {}
        for (const r of data) init[r.id] = r.quantiteReconditionnee ?? 0
        setReconQtys(init)
        setReceptions(data)
      }
      if (cmdRes.ok) {
        const cmd = await cmdRes.json()
        setCommandeNumero(cmd.numero ?? "")
        setCommandeStatus(cmd.status ?? "")
      }
    } catch { toast.error("Impossible de charger le reconditionnement") }
    finally { setLoading(false) }
  }, [commandeId])

  useEffect(() => { fetchRecon() }, [fetchRecon])

  async function handleSaveReconQty(receptionId: string) {
    setSavingReconId(receptionId)
    try {
      const res = await fetch(`/api/stock/receptions/${receptionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantiteReconditionnee: reconQtys[receptionId] ?? 0 }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erreur")
      toast.success("Quantité enregistrée")
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erreur") }
    finally { setSavingReconId(null) }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormSubmitting(true)
    try {
      const res = await fetch("/api/reconditionnement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commandeId,
          label: formLabel.trim() || undefined,
          typePersonalisation: formType || undefined,
          instructions: formInstructions || undefined,
          fichierBAT: formBAT || undefined,
          notes: formNotes || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur")
      toast.success("Reconditionnement créé")
      setShowForm(false)
      setFormLabel(""); setFormType(""); setFormInstructions(""); setFormBAT(""); setFormNotes("")
      fetchRecon()
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erreur lors de la création") }
    finally { setFormSubmitting(false) }
  }

  async function handleSkipToLivraison() {
    setSkipping(true)
    try {
      const res = await fetch(`/api/commandes/${commandeId}/statut`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PRETE_LIVRAISON" }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erreur")
      toast.success("Commande passée en prête à livrer")
      window.location.href = `/commandes/${commandeId}`
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erreur"); setSkipping(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />Chargement...
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Reconditionnement" description={commandeNumero ? `Commande ${commandeNumero}` : ""}>
        <Link href={`/commandes/${commandeId}`}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background text-[0.8rem] font-medium h-7 px-2.5 hover:bg-muted transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />Retour à la commande
        </Link>
      </PageHeader>

      {/* Produits reçus */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Package className="h-4 w-4 text-indigo-500" />
            Produits reçus — stock disponible
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {receptions.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2 text-slate-400 text-sm">
              <Package className="h-7 w-7" />
              <p>Aucune réception enregistrée pour cette commande.</p>
              <Link href="/stock" className="text-xs text-indigo-600 hover:underline">Enregistrer les réceptions →</Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Produit</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Reçu</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">À reconditionner</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {receptions.map((r) => {
                  const qty = reconQtys[r.id] ?? r.quantiteReconditionnee ?? 0
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{r.designation}</p>
                        <p className="text-xs text-slate-400">Commandé : {r.quantiteCommandee}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.quantiteRecue > 0
                          ? <span className="font-semibold text-slate-900">{r.quantiteRecue}</span>
                          : <span className="text-amber-500 text-xs font-medium">Non reçu</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <RoleGate roles={["MANAGER", "CHARGE_OPERATIONS"]}
                          fallback={<p className="text-center font-semibold text-slate-900">{r.quantiteReconditionnee}</p>}>
                          <div className="flex items-center gap-2 justify-center">
                            <Input type="number" min={0} max={r.quantiteRecue} value={qty}
                              onChange={(e) => setReconQtys((prev) => ({ ...prev, [r.id]: Math.min(r.quantiteRecue, Math.max(0, parseInt(e.target.value) || 0)) }))}
                              className="h-8 w-20 text-center text-sm" />
                            <span className="text-xs text-slate-400">/ {r.quantiteRecue}</span>
                          </div>
                        </RoleGate>
                      </td>
                      <td className="px-4 py-3">
                        <RoleGate roles={["MANAGER", "CHARGE_OPERATIONS"]}>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                            onClick={() => handleSaveReconQty(r.id)} disabled={savingReconId === r.id}>
                            {savingReconId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          </Button>
                        </RoleGate>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Passer directement en prêt à livrer */}
      {recons.length === 0 && (
        <RoleGate roles={["MANAGER", "CHARGE_OPERATIONS"]}>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Pas de reconditionnement nécessaire ?</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {commandeStatus === "EN_LOGISTIQUE"
                  ? "Passez directement la commande en prête à livrer."
                  : `Disponible quand la commande est en logistique (actuel : ${commandeStatus || "…"}).`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSkipToLivraison}
              disabled={skipping || commandeStatus !== "EN_LOGISTIQUE"} className="shrink-0">
              {skipping ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <SkipForward className="h-4 w-4 mr-1.5" />}
              Prête à livrer
            </Button>
          </div>
        </RoleGate>
      )}

      {/* Liste des reconditionnements */}
      {recons.length > 0 ? (
        <div className="space-y-3">
          {recons.map((r) => (
            <ReconditionnementCard key={r.id} recon={r} onRefresh={fetchRecon} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-10 gap-2 text-slate-400">
            <Package className="h-8 w-8" />
            <p className="text-sm">Aucun reconditionnement créé.</p>
          </CardContent>
        </Card>
      )}

      {/* Bouton / formulaire nouveau reconditionnement */}
      <RoleGate roles={["MANAGER", "CHARGE_OPERATIONS"]}>
        {!showForm ? (
          <Button variant="outline" className="w-full border-dashed" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {recons.length === 0 ? "Créer le dossier de reconditionnement" : "Ajouter un reconditionnement"}
          </Button>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {recons.length === 0 ? "Créer le dossier de reconditionnement" : "Nouveau reconditionnement"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Libellé (optionnel)</Label>
                  <Input placeholder="Ex: Marquage logos, Conditionnement sachet…"
                    value={formLabel} onChange={(e) => setFormLabel(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Type de personnalisation</Label>
                  <Select value={formType} onValueChange={(v) => setFormType(v ?? "")}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner ou saisir ci-dessous" /></SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input value={formType} onChange={(e) => setFormType(e.target.value)} placeholder="Ou saisir manuellement…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Instructions</Label>
                  <Textarea value={formInstructions} onChange={(e) => setFormInstructions(e.target.value)}
                    placeholder="Instructions détaillées…" rows={4} />
                </div>
                <div className="space-y-1.5">
                  <Label>Fichier BAT (URL)</Label>
                  <Input value={formBAT} onChange={(e) => setFormBAT(e.target.value)} placeholder="https://…" type="url" />
                </div>
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
                  <Button type="submit" disabled={formSubmitting}>
                    {formSubmitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                    Créer le dossier
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </RoleGate>
    </div>
  )
}
