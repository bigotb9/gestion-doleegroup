"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatMontant } from "@/lib/utils"
import { CURRENCY_LABELS, CURRENCY_SYMBOLS } from "@/lib/constants"
import {
  ArrowLeft,
  Loader2,
  Save,
  Factory,
  Calendar,
  Package,
  DollarSign,
  FileText,
  ExternalLink,
  Upload,
  X,
  FileCheck,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Download,
  Send,
  AlertCircle,
  Timer,
} from "lucide-react"

type Currency = "EUR" | "USD" | "CFA"
type ProductionStatus = "EN_ATTENTE" | "EN_COURS" | "TERMINE"

type PaiementFournisseur = {
  id: string
  montant: string | number
  datePaiement: string
  preuvePaiementUrl: string | null
  notes: string | null
}

type Production = {
  id: string
  status: ProductionStatus
  designation: string | null
  numeroBCF: string | null
  fournisseur: { id: string; nom: string; pays: string }
  commande: { id: string; numero: string }
  devise: Currency
  coutUnitaire: string | number
  quantite: number
  tauxChange: string | number | null
  coutTotal: string | number
  coutTotalCFA: string | number | null
  proformaUrl: string | null
  proformaMontantCFA: string | number | null
  dateCommandeFournisseur: string | null
  dateDebutProduction: string | null
  delaiProduction: number | null
  dateFinProductionPrevue: string | null
  dateFinProductionReelle: string | null
  notesFournisseur: string | null
  paiementsFournisseur: PaiementFournisseur[]
}

const STATUS_OPTIONS: { value: ProductionStatus; label: string }[] = [
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "EN_COURS", label: "En cours" },
  { value: "TERMINE", label: "Terminé" },
]
const STATUS_COLORS: Record<ProductionStatus, string> = {
  EN_ATTENTE: "bg-slate-100 text-slate-700",
  EN_COURS: "bg-purple-100 text-purple-700",
  TERMINE: "bg-green-100 text-green-700",
}

export default function ProductionDetailPage() {
  const { id, productionId } = useParams<{ id: string; productionId: string }>()

  const [production, setProduction] = useState<Production | null>(null)
  const [loading, setLoading] = useState(true)

  // Status / date
  const [newStatus, setNewStatus] = useState<ProductionStatus>("EN_ATTENTE")
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [dateFinReelle, setDateFinReelle] = useState("")
  const [updatingDate, setUpdatingDate] = useState(false)

  // Proforma
  const [uploadingProforma, setUploadingProforma] = useState(false)
  const [proformaMontantCFA, setProformaMontantCFA] = useState<number | "">("")
  const [savingProforma, setSavingProforma] = useState(false)
  const proformaInputRef = useRef<HTMLInputElement>(null)

  // Paiements fournisseur
  const [showPaiementForm, setShowPaiementForm] = useState(false)
  const [paiementMontant, setPaiementMontant] = useState<number | "">("")
  const [paiementDate, setPaiementDate] = useState("")
  const [paiementNotes, setPaiementNotes] = useState("")
  const [uploadingPreuve, setUploadingPreuve] = useState(false)
  const [preuveUrl, setPreuveUrl] = useState<string | null>(null)
  const [preuveFileName, setPreuveFileName] = useState<string | null>(null)
  const [savingPaiement, setSavingPaiement] = useState(false)
  const [deletingPaiementId, setDeletingPaiementId] = useState<string | null>(null)
  const preuveInputRef = useRef<HTMLInputElement>(null)

  const fetchProduction = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/production/${productionId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setProduction(data)
      setNewStatus(data.status)
      setDateFinReelle(data.dateFinProductionReelle?.split("T")[0] ?? "")
      if (data.proformaMontantCFA) setProformaMontantCFA(Number(data.proformaMontantCFA))
    } catch {
      toast.error("Impossible de charger la production")
    } finally {
      setLoading(false)
    }
  }, [productionId])

  useEffect(() => { fetchProduction() }, [fetchProduction])

  async function handleProformaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingProforma(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/production/upload", { method: "POST", body: fd })
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur upload")
      const { url } = await res.json()
      await fetch(`/api/production/${productionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proformaUrl: url }),
      })
      toast.success("Proforma uploadée")
      fetchProduction()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur upload proforma")
    } finally {
      setUploadingProforma(false)
      if (proformaInputRef.current) proformaInputRef.current.value = ""
    }
  }

  async function handleSaveProformaMontant() {
    setSavingProforma(true)
    try {
      const res = await fetch(`/api/production/${productionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proformaMontantCFA: typeof proformaMontantCFA === "number" ? proformaMontantCFA : null }),
      })
      if (!res.ok) throw new Error()
      toast.success("Montant proforma enregistré")
      fetchProduction()
    } catch {
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setSavingProforma(false)
    }
  }

  async function handlePreuveUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPreuve(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/production/upload", { method: "POST", body: fd })
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur upload")
      const { url } = await res.json()
      setPreuveUrl(url)
      setPreuveFileName(file.name)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur upload preuve")
    } finally {
      setUploadingPreuve(false)
      if (preuveInputRef.current) preuveInputRef.current.value = ""
    }
  }

  async function handleAddPaiement() {
    if (!paiementMontant || paiementMontant <= 0) { toast.error("Montant invalide"); return }
    if (!paiementDate) { toast.error("Date requise"); return }
    setSavingPaiement(true)
    try {
      const res = await fetch(`/api/production/${productionId}/paiements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montant: paiementMontant,
          datePaiement: paiementDate,
          preuvePaiementUrl: preuveUrl ?? undefined,
          notes: paiementNotes.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erreur")
      toast.success("Paiement enregistré")
      setShowPaiementForm(false)
      setPaiementMontant("")
      setPaiementDate("")
      setPaiementNotes("")
      setPreuveUrl(null)
      setPreuveFileName(null)
      fetchProduction()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement")
    } finally {
      setSavingPaiement(false)
    }
  }

  async function handleDeletePaiement(paiementId: string) {
    setDeletingPaiementId(paiementId)
    try {
      const res = await fetch(`/api/production/${productionId}/paiements`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paiementId }),
      })
      if (!res.ok) throw new Error()
      toast.success("Paiement supprimé")
      fetchProduction()
    } catch {
      toast.error("Impossible de supprimer le paiement")
    } finally {
      setDeletingPaiementId(null)
    }
  }

  async function handleStatusUpdate() {
    setUpdatingStatus(true)
    try {
      await fetch(`/api/production/${productionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      toast.success("Statut mis à jour")
      fetchProduction()
    } catch { toast.error("Impossible de mettre à jour le statut") }
    finally { setUpdatingStatus(false) }
  }

  async function handleDateUpdate() {
    setUpdatingDate(true)
    try {
      await fetch(`/api/production/${productionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateFinProductionReelle: dateFinReelle || null }),
      })
      toast.success("Date mise à jour")
      fetchProduction()
    } catch { toast.error("Impossible de mettre à jour la date") }
    finally { setUpdatingDate(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Chargement...
      </div>
    )
  }

  if (!production) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-500">Production introuvable.</p>
        <Link href={`/commandes/${id}/production`} className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />Retour aux productions
        </Link>
      </div>
    )
  }

  const totalPaye = production.paiementsFournisseur.reduce((acc, p) => acc + Number(p.montant), 0)
  const proformaMontant = production.proformaMontantCFA ? Number(production.proformaMontantCFA) : null
  const isSoldee = proformaMontant !== null && totalPaye >= proformaMontant
  const progressPct = proformaMontant && proformaMontant > 0
    ? Math.min(100, Math.round((totalPaye / proformaMontant) * 100))
    : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title={production.fournisseur.nom}
        description={`Production — Commande ${production.commande.numero}`}
      >
        <Link
          href={`/commandes/${id}/production`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux productions
        </Link>
      </PageHeader>

      {/* Workflow étapes */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
        {/* Étape 1 : BCF */}
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-800">1. BCF créé</p>
            <p className="text-blue-600">{production.numeroBCF}</p>
          </div>
        </div>
        {/* Étape 2 : Envoyer BCF */}
        <div className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 ${production.proformaUrl ? "border-blue-200 bg-blue-50" : "border-amber-200 bg-amber-50"}`}>
          {production.proformaUrl
            ? <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            : <Send className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          }
          <div>
            <p className={`font-semibold ${production.proformaUrl ? "text-blue-800" : "text-amber-800"}`}>
              2. Envoyer au fournisseur
            </p>
            <p className={production.proformaUrl ? "text-blue-600" : "text-amber-600"}>
              {production.proformaUrl ? "Proforma reçue" : "En attente de réponse"}
            </p>
          </div>
        </div>
        {/* Étape 3 : Payer */}
        <div className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 ${isSoldee ? "border-blue-200 bg-blue-50" : proformaMontant ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
          {isSoldee
            ? <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            : proformaMontant
              ? <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              : <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          }
          <div>
            <p className={`font-semibold ${isSoldee ? "text-blue-800" : proformaMontant ? "text-amber-800" : "text-slate-500"}`}>
              3. Solder le fournisseur
            </p>
            <p className={isSoldee ? "text-blue-600" : proformaMontant ? "text-amber-600" : "text-slate-400"}>
              {isSoldee ? "Soldé" : proformaMontant ? `${progressPct}% payé` : "Facture non définie"}
            </p>
          </div>
        </div>
        {/* Étape 4 : Production */}
        <div className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 ${isSoldee ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"}`}>
          {isSoldee
            ? <Timer className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
            : <Timer className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />
          }
          <div>
            <p className={`font-semibold ${isSoldee ? "text-green-800" : "text-slate-400"}`}>
              4. Production démarrée
            </p>
            <p className={isSoldee ? "text-green-600" : "text-slate-400"}>
              {production.dateDebutProduction
                ? `Démarré le ${formatDate(production.dateDebutProduction)}`
                : isSoldee ? "En cours" : "En attente de solde"
              }
            </p>
          </div>
        </div>
      </div>

      {isSoldee && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-sm font-medium">Fournisseur soldé — compte à rebours de production démarré.</p>
        </div>
      )}

      {/* Info production */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                <Factory className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{production.fournisseur.nom}</p>
                <p className="text-xs text-slate-500">{production.fournisseur.pays}</p>
                {production.designation && (
                  <p className="text-xs text-indigo-600 font-medium mt-0.5">{production.designation}</p>
                )}
              </div>
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[production.status]}`}>
              {STATUS_OPTIONS.find((s) => s.value === production.status)?.label ?? production.status}
            </span>
          </div>

          <Separator />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Quantité</p>
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Package className="h-4 w-4 text-slate-400" />{production.quantite}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Coût unitaire</p>
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-slate-400" />
                {formatMontant(Number(production.coutUnitaire), production.devise)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Coût total</p>
              <p className="font-semibold text-slate-900">{formatMontant(Number(production.coutTotal), production.devise)}</p>
            </div>
            {production.tauxChange && (
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Taux de change</p>
                <p className="font-semibold text-slate-900">
                  1 {CURRENCY_SYMBOLS[production.devise]} = {Number(production.tauxChange).toLocaleString("fr-FR")} FCFA
                </p>
              </div>
            )}
            {production.coutTotalCFA && (
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Coût total CFA</p>
                <p className="font-semibold text-slate-900">{formatMontant(Number(production.coutTotalCFA), "CFA")}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Devise</p>
              <Badge variant="outline" className="font-mono text-xs">{CURRENCY_LABELS[production.devise]}</Badge>
            </div>
          </div>

          {(production.dateCommandeFournisseur || production.dateFinProductionPrevue || production.dateFinProductionReelle) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {production.dateCommandeFournisseur && (
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Date commande fournisseur</p>
                    <p className="font-medium text-slate-700 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {formatDate(production.dateCommandeFournisseur)}
                    </p>
                  </div>
                )}
                {production.dateFinProductionPrevue && (
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Fin prévue</p>
                    <p className="font-medium text-slate-700">{formatDate(production.dateFinProductionPrevue)}</p>
                  </div>
                )}
                {production.dateFinProductionReelle && (
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Fin réelle</p>
                    <p className="font-medium text-green-700">{formatDate(production.dateFinProductionReelle)}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {production.notesFournisseur && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-slate-500 mb-1">Notes fournisseur</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{production.notesFournisseur}</p>
              </div>
            </>
          )}

          {production.numeroBCF && (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">N° Bon de commande :</span>
                <span className="font-mono text-sm font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {production.numeroBCF}
                </span>
              </div>
              <a
                href={`/api/production/${productionId}/bcf`}
                download={`BCF-${production.numeroBCF}.pdf`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Télécharger le BCF (PDF)
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proforma & paiements — MANAGER uniquement */}
      <RoleGate roles={["MANAGER"]}>
        {/* Proforma */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-indigo-500" />
              Proforma fournisseur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Document proforma</Label>
              {production.proformaUrl ? (
                <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
                  <div className="flex items-center gap-2 text-indigo-700">
                    <FileCheck className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">Proforma uploadée</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={production.proformaUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                      <ExternalLink className="h-3.5 w-3.5" />Ouvrir
                    </a>
                    <button type="button" onClick={() => proformaInputRef.current?.click()}
                      disabled={uploadingProforma}
                      className="text-xs text-slate-400 hover:text-indigo-600 underline">
                      Remplacer
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => proformaInputRef.current?.click()}
                  disabled={uploadingProforma}
                  className="flex items-center gap-2 w-full rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all disabled:opacity-50">
                  {uploadingProforma ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploadingProforma ? "Upload en cours…" : "Uploader la proforma fournisseur (PDF, JPG, PNG)"}
                </button>
              )}
              <input ref={proformaInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleProformaUpload} />
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="proformaMontant">Montant proforma (FCFA)</Label>
                <Input
                  id="proformaMontant"
                  type="number"
                  min={0}
                  step="1"
                  placeholder="0"
                  value={proformaMontantCFA}
                  onChange={(e) => setProformaMontantCFA(parseFloat(e.target.value) || "")}
                />
              </div>
              <Button onClick={handleSaveProformaMontant} disabled={savingProforma} variant="outline">
                {savingProforma ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
                Enregistrer
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              La commande passera automatiquement en <strong>EN_PRODUCTION</strong> dès le premier paiement enregistré.
            </p>
          </CardContent>
        </Card>

        {/* Paiements fournisseur */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                Paiements au fournisseur
              </CardTitle>
              {!showPaiementForm && (
                <Button size="sm" variant="outline" onClick={() => setShowPaiementForm(true)}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Ajouter un paiement
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {proformaMontant && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Payé : <span className="font-semibold text-slate-700">{formatMontant(totalPaye, "CFA")}</span></span>
                  <span>Proforma : <span className="font-semibold text-slate-700">{formatMontant(proformaMontant, "CFA")}</span></span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isSoldee ? "bg-green-500" : "bg-indigo-500"}`}
                    style={{ width: `${progressPct}%` }} />
                </div>
                <div className="flex items-center gap-1.5">
                  {isSoldee ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />Proforma soldée ({progressPct}%)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" />{progressPct}% — reste {formatMontant(proformaMontant - totalPaye, "CFA")}
                    </span>
                  )}
                </div>
              </div>
            )}

            {production.paiementsFournisseur.length > 0 ? (
              <div className="space-y-2">
                {production.paiementsFournisseur.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{formatMontant(Number(p.montant), "CFA")}</p>
                        <p className="text-xs text-slate-500">{formatDate(p.datePaiement)}{p.notes ? ` — ${p.notes}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.preuvePaiementUrl && (
                        <a href={p.preuvePaiementUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                          <FileText className="h-3.5 w-3.5" />Preuve
                        </a>
                      )}
                      <button type="button" onClick={() => handleDeletePaiement(p.id)}
                        disabled={deletingPaiementId === p.id}
                        className="text-slate-300 hover:text-red-500 transition-colors">
                        {deletingPaiementId === p.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !showPaiementForm && (
                <p className="text-sm text-slate-400 text-center py-4">Aucun paiement enregistré</p>
              )
            )}

            {showPaiementForm && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                <p className="text-sm font-semibold text-emerald-800">Nouveau paiement fournisseur</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Montant (FCFA) *</Label>
                    <Input type="number" min={0} step="1" placeholder="0"
                      value={paiementMontant}
                      onChange={(e) => setPaiementMontant(parseFloat(e.target.value) || "")} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Date *</Label>
                    <Input type="date" value={paiementDate} onChange={(e) => setPaiementDate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Preuve de paiement</Label>
                  {preuveUrl ? (
                    <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-white px-3 py-1.5">
                      <FileCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />
                      <span className="text-xs text-green-700 truncate flex-1">{preuveFileName}</span>
                      <button type="button" onClick={() => { setPreuveUrl(null); setPreuveFileName(null) }}>
                        <X className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => preuveInputRef.current?.click()}
                      disabled={uploadingPreuve}
                      className="flex items-center gap-2 w-full rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-all disabled:opacity-50">
                      {uploadingPreuve ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      {uploadingPreuve ? "Upload…" : "Uploader la preuve (PDF, JPG, PNG)"}
                    </button>
                  )}
                  <input ref={preuveInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handlePreuveUpload} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Notes (optionnel)</Label>
                  <Textarea value={paiementNotes} onChange={(e) => setPaiementNotes(e.target.value)}
                    placeholder="Référence virement, banque..." rows={2} className="resize-none text-sm" />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => {
                    setShowPaiementForm(false)
                    setPaiementMontant(""); setPaiementDate(""); setPaiementNotes("")
                    setPreuveUrl(null); setPreuveFileName(null)
                  }}>
                    Annuler
                  </Button>
                  <Button size="sm" onClick={handleAddPaiement} disabled={savingPaiement}>
                    {savingPaiement ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                    Enregistrer
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Mettre à jour le statut
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-end gap-4">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="statusUpdate">Nouveau statut</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ProductionStatus)}>
                <SelectTrigger id="statusUpdate"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleStatusUpdate} disabled={updatingStatus}>
              {updatingStatus && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Mettre à jour
            </Button>
          </CardContent>
        </Card>

        {/* Date fin réelle */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Date de fin réelle
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-end gap-4">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="dateFinReelle">Date de fin de production réelle</Label>
              <Input id="dateFinReelle" type="date" value={dateFinReelle} onChange={(e) => setDateFinReelle(e.target.value)} />
            </div>
            <Button variant="outline" onClick={handleDateUpdate} disabled={updatingDate}>
              {updatingDate && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Enregistrer
            </Button>
          </CardContent>
        </Card>
      </RoleGate>
    </div>
  )
}
