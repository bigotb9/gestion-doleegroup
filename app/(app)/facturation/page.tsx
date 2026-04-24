"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { motion } from "motion/react"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatCards } from "@/components/shared/StatCards"
import { RoleGate } from "@/components/shared/RoleGate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { formatDate, formatMontant, cn } from "@/lib/utils"
import { staggerContainer, staggerItem } from "@/lib/motion"
import {
  Receipt, Loader2, Plus, ChevronRight, Banknote, FileCheck,
  ArrowLeft, Upload, X, ExternalLink,
  TrendingUp, AlertCircle, CheckCircle2,
} from "lucide-react"

type Facture = {
  id: string
  numero: string
  type: string
  montantHT: string | number
  montantTVA: string | number
  montantTTC: string | number
  dateEmission: string
  statut: string
  statutReglement: string | null
  pdfUrl: string | null
  commande: {
    id: string
    numero: string
    client: {
      raisonSociale: string
    }
  }
}

type CommandeOption = {
  id: string
  numero: string
  montantTotal: string | number
  client: { raisonSociale: string }
}

const STATUT_STYLES: Record<string, string> = {
  EN_ATTENTE: "bg-amber-100 text-amber-700",
  ENVOYEE: "bg-blue-100 text-blue-700",
  PAYEE: "bg-green-100 text-green-700",
  PARTIELLEMENT_PAYEE: "bg-indigo-100 text-indigo-700",
  EN_RETARD: "bg-red-100 text-red-700",
  ANNULEE: "bg-slate-100 text-slate-500",
}

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  ENVOYEE: "Envoyée",
  PAYEE: "Payée",
  PARTIELLEMENT_PAYEE: "Part. payée",
  EN_RETARD: "En retard",
  ANNULEE: "Annulée",
}

const REGLEMENT_STYLES: Record<string, string> = {
  PARTIEL: "bg-orange-100 text-orange-700",
  COMPLET: "bg-green-100 text-green-700",
}

const REGLEMENT_LABELS: Record<string, string> = {
  PARTIEL: "Partiel",
  COMPLET: "Complet",
}

export default function FacturationPage() {
  const router = useRouter()
  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [step, setStep] = useState<0 | 1>(0)
  const [formType, setFormType] = useState<"RECU_CAISSE" | "FNE" | "">("")
  const [commandesLivrees, setCommandesLivrees] = useState<CommandeOption[]>([])
  const [formCommandeId, setFormCommandeId] = useState("")
  const [formMontantHT, setFormMontantHT] = useState("")
  const [formMontantTVA, setFormMontantTVA] = useState("0")
  const [formDateEcheance, setFormDateEcheance] = useState("")
  const [formSubmitting, setFormSubmitting] = useState(false)

  // FNE upload
  const [fneFileUrl, setFneFileUrl] = useState<string | null>(null)
  const [fneFileName, setFneFileName] = useState<string | null>(null)
  const [uploadingFne, setUploadingFne] = useState(false)
  const fneInputRef = useRef<HTMLInputElement>(null)

  const montantTTC = (Number(formMontantHT) || 0) + (Number(formMontantTVA) || 0)

  function resetForm() {
    setStep(0)
    setFormType("")
    setFormCommandeId("")
    setFormMontantHT("")
    setFormMontantTVA("0")
    setFormDateEcheance("")
    setFneFileUrl(null)
    setFneFileName(null)
  }

  const fetchFactures = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/facturation")
      if (!res.ok) throw new Error()
      const json = await res.json()
      setFactures(json.factures ?? json)
    } catch {
      toast.error("Impossible de charger les factures")
      setFactures([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFactures()
  }, [fetchFactures])

  // KPI stats
  const stats = useMemo(() => {
    const totalFNE = factures.filter((f) => f.type === "FNE").reduce((s, f) => s + Number(f.montantTTC), 0)
    const totalCaisse = factures.filter((f) => f.type === "RECU_CAISSE").reduce((s, f) => s + Number(f.montantTTC), 0)
    const totalPaye = factures.filter((f) => f.statutReglement === "COMPLET").length
    const enRetard = factures.filter((f) => f.statut === "EN_RETARD").length
    return { totalFNE, totalCaisse, totalPaye, enRetard }
  }, [factures])

  async function fetchCommandesLivrees() {
    try {
      const res = await fetch("/api/commandes?status=LIVREE")
      if (!res.ok) return
      const json = await res.json()
      setCommandesLivrees(json.commandes ?? json)
    } catch {
      // silent
    }
  }

  async function handleFneUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFne(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/facturation/upload-fne", { method: "POST", body: fd })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Erreur upload")
      }
      const { url } = await res.json()
      setFneFileUrl(url)
      setFneFileName(file.name)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'upload")
    } finally {
      setUploadingFne(false)
      if (fneInputRef.current) fneInputRef.current.value = ""
    }
  }

  async function handleCreate() {
    if (!formCommandeId || !formMontantHT) {
      toast.error("Veuillez renseigner la commande et le montant HT")
      return
    }
    setFormSubmitting(true)
    try {
      const res = await fetch("/api/facturation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commandeId: formCommandeId,
          type: formType,
          montantHT: Number(formMontantHT),
          montantTVA: Number(formMontantTVA),
          montantTTC,
          dateEcheance: formDateEcheance || undefined,
          fneFileUrl: fneFileUrl ?? undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Erreur")
      }
      const created = await res.json()
      toast.success("Facture créée avec succès")
      setCreateOpen(false)
      resetForm()
      fetchFactures()
      const factureId = created.id ?? created.facture?.id
      if (factureId) router.push(`/facturation/${factureId}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la création")
    } finally {
      setFormSubmitting(false)
    }
  }

  return (
    <RoleGate
      roles={["MANAGER"]}
      fallback={
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-2">
          <Receipt className="h-8 w-8" />
          <p className="text-sm">Accès réservé aux managers</p>
        </div>
      }
    >
      <div className="space-y-6">
        <PageHeader title="Facturation" description="Gestion des factures">
          <Dialog
            open={createOpen}
            onOpenChange={(open) => {
              setCreateOpen(open)
              if (open) fetchCommandesLivrees()
              else resetForm()
            }}
          >
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="h-4 w-4 mr-1.5" />
              Créer une facture
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {step === 0
                    ? "Nouvelle facture"
                    : formType === "FNE"
                    ? "Facture FNE"
                    : "Reçu de caisse"}
                </DialogTitle>
              </DialogHeader>

              {/* Étape 0 — Choix du type */}
              {step === 0 && (
                <div className="py-2 grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => { setFormType("RECU_CAISSE"); setStep(1) }}
                    className="flex flex-col items-center gap-3 rounded-xl border-2 border-slate-200 bg-slate-50 p-6 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-center group"
                  >
                    <div className="p-3 rounded-full bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                      <Banknote className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">Reçu de caisse</p>
                      <p className="text-xs text-slate-500 mt-0.5">Paiement direct / espèces</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFormType("FNE"); setStep(1) }}
                    className="flex flex-col items-center gap-3 rounded-xl border-2 border-slate-200 bg-slate-50 p-6 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-center group"
                  >
                    <div className="p-3 rounded-full bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                      <FileCheck className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">Facture FNE</p>
                      <p className="text-xs text-slate-500 mt-0.5">Facture Normalisée Électronique</p>
                    </div>
                  </button>
                </div>
              )}

              {/* Étape 1 — Formulaire */}
              {step === 1 && (
                <div className="space-y-4 py-2">
                  {formType === "FNE" && (
                    <a
                      href="https://www.services.fne.dgi.gouv.ci/fr/login"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between w-full rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      <span className="font-medium">Accéder au portail FNE</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}

                  <div className="space-y-1.5">
                    <Label>
                      Commande livrée <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formCommandeId}
                      onValueChange={(v) => setFormCommandeId(v ?? "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une commande livrée" />
                      </SelectTrigger>
                      <SelectContent>
                        {commandesLivrees.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.numero} — {c.client.raisonSociale}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {commandesLivrees.length === 0 && (
                      <p className="text-xs text-slate-500">
                        Aucune commande livrée disponible pour facturation.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>
                        Montant HT (FCFA) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={formMontantHT}
                        onChange={(e) => setFormMontantHT(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>TVA (FCFA)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formMontantTVA}
                        onChange={(e) => setFormMontantTVA(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
                    <span className="text-slate-500">Montant TTC : </span>
                    <span className="font-bold text-slate-900">{formatMontant(montantTTC)}</span>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Date d&apos;échéance</Label>
                    <Input
                      type="date"
                      value={formDateEcheance}
                      onChange={(e) => setFormDateEcheance(e.target.value)}
                    />
                  </div>

                  {formType === "FNE" && (
                    <div className="space-y-1.5">
                      <Label>
                        Facture FNE (PDF) <span className="text-red-500">*</span>
                      </Label>
                      {fneFileUrl ? (
                        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                          <FileCheck className="h-4 w-4 text-green-600 shrink-0" />
                          <span className="text-sm text-green-700 truncate flex-1">{fneFileName}</span>
                          <button
                            type="button"
                            onClick={() => { setFneFileUrl(null); setFneFileName(null) }}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fneInputRef.current?.click()}
                          disabled={uploadingFne}
                          className="flex items-center gap-2 w-full rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all disabled:opacity-50"
                        >
                          {uploadingFne ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          {uploadingFne ? "Upload en cours…" : "Cliquer pour uploader la facture FNE"}
                        </button>
                      )}
                      <input
                        ref={fneInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={handleFneUpload}
                      />
                      {!fneFileUrl && (
                        <p className="text-xs text-amber-600">
                          Le fichier FNE est requis pour enregistrer la facture.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                {step === 0 ? (
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    Annuler
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setStep(0)}>
                      <ArrowLeft className="h-4 w-4 mr-1.5" />
                      Retour
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={formSubmitting || (formType === "FNE" && !fneFileUrl)}
                    >
                      {formSubmitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                      Enregistrer
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Stats KPI */}
        <StatCards
          cards={[
            { label: "Total FNE", value: stats.totalFNE, icon: FileCheck, variant: "info", isMontant: true, devise: "CFA", hint: "Factures normalisées" },
            { label: "Total Caisse", value: stats.totalCaisse, icon: Banknote, variant: "success", isMontant: true, devise: "CFA", hint: "Reçus de caisse" },
            { label: "Soldées", value: stats.totalPaye, icon: CheckCircle2, variant: "primary", hint: "Règlement complet" },
            { label: "En retard", value: stats.enRetard, icon: AlertCircle, variant: "danger", hint: "Action requise" },
          ]}
        />

        <Card className="overflow-hidden border-slate-100" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)", borderRadius: "16px" }}>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />Chargement...
              </div>
            ) : factures.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
                  <Receipt className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-sm font-medium">Aucune facture créée</p>
                <p className="text-xs">Créez votre première facture pour commencer.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Numéro</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Type</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Commande</th>
                      <th className="text-right px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">HT</th>
                      <th className="text-right px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">TVA</th>
                      <th className="text-right px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">TTC</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Date</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Statut</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Règlement</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <motion.tbody
                    className="divide-y divide-slate-50"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                  >
                    {factures.map((f) => (
                      <motion.tr
                        key={f.id}
                        variants={staggerItem}
                        className={cn(
                          "group cursor-pointer transition-all",
                          f.type === "FNE"
                            ? "hover:bg-gradient-to-r hover:from-indigo-50/40 hover:to-transparent"
                            : "hover:bg-gradient-to-r hover:from-emerald-50/40 hover:to-transparent"
                        )}
                        onClick={() => router.push(`/facturation/${f.id}`)}
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md group-hover:bg-blue-100 transition-colors">
                            {f.numero}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {f.type === "FNE" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                              <FileCheck className="h-3 w-3" />FNE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              <Banknote className="h-3 w-3" />Caisse
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                            {f.commande.client.raisonSociale}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">{f.commande.numero}</p>
                        </td>
                        <td className="px-5 py-3.5 text-right text-slate-700 tabular-nums">{formatMontant(Number(f.montantHT))}</td>
                        <td className="px-5 py-3.5 text-right text-slate-500 tabular-nums">{formatMontant(Number(f.montantTVA))}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-slate-900 tabular-nums">{formatMontant(Number(f.montantTTC))}</td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs tabular-nums">{formatDate(f.dateEmission)}</td>
                        <td className="px-5 py-3.5">
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold", STATUT_STYLES[f.statut] ?? "bg-slate-100 text-slate-700")}>
                            {STATUT_LABELS[f.statut] ?? f.statut}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {f.statutReglement ? (
                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold", REGLEMENT_STYLES[f.statutReglement] ?? "bg-slate-100 text-slate-700")}>
                              {REGLEMENT_LABELS[f.statutReglement] ?? f.statutReglement}
                            </span>
                          ) : (<span className="text-slate-300 text-xs">—</span>)}
                        </td>
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
    </RoleGate>
  )
}
