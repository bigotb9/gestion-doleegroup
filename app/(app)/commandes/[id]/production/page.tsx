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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatDate, formatMontant } from "@/lib/utils"
import { CURRENCY_LABELS, CURRENCY_SYMBOLS } from "@/lib/constants"
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Save,
  Factory,
  Package,
  DollarSign,
  Plus,
  CheckCircle2,
  Clock,
} from "lucide-react"

type Currency = "EUR" | "USD" | "CFA"
type ProductionStatus = "EN_ATTENTE" | "EN_COURS" | "TERMINE"

type Fournisseur = {
  id: string
  nom: string
  pays: string
  devise: Currency | null
  delaiProduction: number | null
}

type PaiementFournisseur = {
  id: string
  montant: string | number
}

type Production = {
  id: string
  status: ProductionStatus
  designation: string | null
  fournisseur: { id: string; nom: string; pays: string }
  devise: Currency
  quantite: number
  coutTotal: string | number
  coutTotalCFA: string | number | null
  proformaMontantCFA: string | number | null
  numeroBCF: string | null
  dateFinProductionPrevue: string | null
  dateFinProductionReelle: string | null
  paiementsFournisseur: PaiementFournisseur[]
}

type CommandeSummary = {
  id: string
  numero: string
  status: string
  devise: Currency
  lignes: { quantite: number; designation: string }[]
  productions: Production[]
}

const STATUS_COLORS: Record<ProductionStatus, string> = {
  EN_ATTENTE: "bg-slate-100 text-slate-600",
  EN_COURS: "bg-purple-100 text-purple-700",
  TERMINE: "bg-green-100 text-green-700",
}
const STATUS_LABELS: Record<ProductionStatus, string> = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
}

export default function ProductionPage() {
  const { id } = useParams<{ id: string }>()

  const [commande, setCommande] = useState<CommandeSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [fournisseursLoading, setFournisseursLoading] = useState(false)

  // Afficher ou non le formulaire de création
  const [showForm, setShowForm] = useState(false)

  // Champs du formulaire
  const [fournisseurId, setFournisseurId] = useState("")
  const [designation, setDesignation] = useState("")
  const [devise, setDevise] = useState<Currency>("EUR")
  const [coutUnitaire, setCoutUnitaire] = useState<number | "">("")
  const [quantite, setQuantite] = useState<number>(1)
  const [tauxChange, setTauxChange] = useState<number | "">("")
  const [dateCommande, setDateCommande] = useState("")
  const [delaiProduction, setDelaiProduction] = useState<number | "">("")
  const [dateFinPrevue, setDateFinPrevue] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchCommande = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/commandes/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCommande(data)
    } catch {
      toast.error("Impossible de charger la commande")
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchFournisseurs = useCallback(async () => {
    setFournisseursLoading(true)
    try {
      const res = await fetch("/api/fournisseurs")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setFournisseurs(data.fournisseurs ?? data)
    } catch {
      setFournisseurs([])
    } finally {
      setFournisseursLoading(false)
    }
  }, [])

  useEffect(() => { fetchCommande(); fetchFournisseurs() }, [fetchCommande, fetchFournisseurs])

  // Auto-calcul date fin prévue
  useEffect(() => {
    if (dateCommande && typeof delaiProduction === "number" && delaiProduction > 0) {
      const d = new Date(dateCommande)
      d.setDate(d.getDate() + delaiProduction)
      setDateFinPrevue(d.toISOString().split("T")[0])
    }
  }, [dateCommande, delaiProduction])

  function handleFournisseurChange(fId: string) {
    setFournisseurId(fId)
    const f = fournisseurs.find((x) => x.id === fId)
    if (f) {
      if (f.devise) setDevise(f.devise)
      if (f.delaiProduction) setDelaiProduction(f.delaiProduction)
    }
  }

  function resetForm() {
    setFournisseurId("")
    setDesignation("")
    setDevise("EUR")
    setCoutUnitaire("")
    setQuantite(1)
    setTauxChange("")
    setDateCommande("")
    setDelaiProduction("")
    setDateFinPrevue("")
    setNotes("")
    setShowForm(false)
  }

  const coutTotal = typeof coutUnitaire === "number" ? coutUnitaire * quantite : 0
  const coutTotalCFA = typeof tauxChange === "number" && tauxChange > 0 ? coutTotal * tauxChange : null

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!fournisseurId) { toast.error("Veuillez sélectionner un fournisseur"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commandeId: id,
          fournisseurId,
          designation: designation.trim() || undefined,
          devise,
          coutUnitaire: typeof coutUnitaire === "number" ? coutUnitaire : 0,
          quantite,
          tauxChange: typeof tauxChange === "number" ? tauxChange : undefined,
          dateCommandeFournisseur: dateCommande || undefined,
          delaiProduction: typeof delaiProduction === "number" ? delaiProduction : undefined,
          dateFinProductionPrevue: dateFinPrevue || undefined,
          notesFournisseur: notes.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erreur")
      toast.success("Production créée avec succès !")
      resetForm()
      fetchCommande()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Chargement...
      </div>
    )
  }

  if (!commande) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-500">Commande introuvable.</p>
        <Link href="/commandes" className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />Retour aux commandes
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="Productions" description={`Commande ${commande.numero}`}>
        <Link
          href={`/commandes/${id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la commande
        </Link>
      </PageHeader>

      {/* Liste des productions existantes */}
      {commande.productions.length > 0 && (
        <div className="space-y-3">
          {commande.productions.map((prod) => {
            const totalPaye = prod.paiementsFournisseur.reduce((acc, p) => acc + Number(p.montant), 0)
            const proformaMontant = prod.proformaMontantCFA ? Number(prod.proformaMontantCFA) : null
            const isSoldee = proformaMontant !== null && totalPaye >= proformaMontant

            return (
              <Card key={prod.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700 shrink-0">
                        <Factory className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{prod.fournisseur.nom}</p>
                        <p className="text-xs text-slate-500">{prod.fournisseur.pays}</p>
                        {prod.designation && (
                          <p className="text-xs text-indigo-600 font-medium mt-0.5 truncate">{prod.designation}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[prod.status]}`}>
                        {STATUS_LABELS[prod.status]}
                      </span>
                      <Link
                        href={`/commandes/${id}/production/${prod.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        Gérer
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-slate-400 mb-0.5">Quantité</p>
                      <p className="font-semibold text-slate-800 flex items-center gap-1">
                        <Package className="h-3.5 w-3.5 text-slate-400" />{prod.quantite}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-0.5">Coût total</p>
                      <p className="font-semibold text-slate-800">
                        {formatMontant(Number(prod.coutTotal), prod.devise)}
                      </p>
                    </div>
                    {prod.coutTotalCFA && (
                      <div>
                        <p className="text-slate-400 mb-0.5">Total CFA</p>
                        <p className="font-semibold text-slate-800">
                          {formatMontant(Number(prod.coutTotalCFA), "CFA")}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-400 mb-0.5">Paiement proforma</p>
                      {proformaMontant ? (
                        <p className={`font-semibold flex items-center gap-1 ${isSoldee ? "text-green-700" : "text-amber-700"}`}>
                          {isSoldee
                            ? <><CheckCircle2 className="h-3.5 w-3.5" />Soldée</>
                            : <><Clock className="h-3.5 w-3.5" />{formatMontant(totalPaye, "CFA")} / {formatMontant(proformaMontant, "CFA")}</>
                          }
                        </p>
                      ) : (
                        <p className="text-slate-400">Non défini</p>
                      )}
                    </div>
                  </div>

                  {(prod.dateFinProductionPrevue || prod.dateFinProductionReelle || prod.numeroBCF) && (
                    <div className="flex flex-wrap gap-4 mt-3 text-xs">
                      {prod.numeroBCF && (
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {prod.numeroBCF}
                        </span>
                      )}
                      {prod.dateFinProductionPrevue && !prod.dateFinProductionReelle && (
                        <span className="text-slate-500">
                          Fin prévue : {formatDate(prod.dateFinProductionPrevue)}
                        </span>
                      )}
                      {prod.dateFinProductionReelle && (
                        <span className="text-green-700 font-medium">
                          Terminé le : {formatDate(prod.dateFinProductionReelle)}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Bouton Ajouter */}
      <RoleGate roles={["MANAGER", "SECRETAIRE"]}>
        {!showForm ? (
          <Button variant="outline" onClick={() => setShowForm(true)} className="w-full border-dashed">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un fournisseur
          </Button>
        ) : (
          /* Formulaire création */
          <form onSubmit={handleCreate} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  Nouvelle production — fournisseur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">

                <div className="space-y-1.5">
                  <Label htmlFor="fournisseur">Fournisseur <span className="text-red-500">*</span></Label>
                  {fournisseursLoading ? (
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />Chargement...
                    </div>
                  ) : (
                    <Select value={fournisseurId} onValueChange={(v) => v && handleFournisseurChange(v)}>
                      <SelectTrigger id="fournisseur">
                        <SelectValue placeholder="Sélectionner un fournisseur..." />
                      </SelectTrigger>
                      <SelectContent>
                        {fournisseurs.map((f) => (
                          <SelectItem key={f.id} value={f.id}>{f.nom} — {f.pays}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="designation">
                    Produits concernés
                    <span className="text-slate-400 text-xs font-normal ml-1">(optionnel — ex: &quot;Sacs bandoulière, Casquettes&quot;)</span>
                  </Label>
                  <Input
                    id="designation"
                    placeholder="Indiquer les produits gérés par ce fournisseur..."
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </div>

                {/* Produits de la commande pour référence */}
                {commande.lignes.length > 0 && (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-500 font-medium mb-2">Produits de la commande</p>
                    <div className="space-y-1">
                      {commande.lignes.map((l, i) => (
                        <p key={i} className="text-xs text-slate-700">
                          • {l.designation} <span className="text-slate-400">(×{l.quantite})</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="deviseP">Devise</Label>
                    <Select value={devise} onValueChange={(v) => setDevise(v as Currency)}>
                      <SelectTrigger id="deviseP"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(CURRENCY_LABELS).map(([k, label]) => (
                          <SelectItem key={k} value={k}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="coutUnit">Coût unitaire ({CURRENCY_SYMBOLS[devise]})</Label>
                    <Input id="coutUnit" type="number" min={0} step="0.01" placeholder="0.00"
                      value={coutUnitaire} onChange={(e) => setCoutUnitaire(parseFloat(e.target.value) || "")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="qtyP">Quantité</Label>
                    <Input id="qtyP" type="number" min={1} value={quantite}
                      onChange={(e) => setQuantite(parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tauxChange">
                      Taux de change vers CFA
                      <span className="text-slate-400 text-xs font-normal ml-1">(optionnel)</span>
                    </Label>
                    <Input id="tauxChange" type="number" min={0} step="0.01"
                      placeholder={`1 ${CURRENCY_SYMBOLS[devise]} = ? FCFA`}
                      value={tauxChange} onChange={(e) => setTauxChange(parseFloat(e.target.value) || "")} />
                  </div>
                </div>

                {coutTotal > 0 && (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Coût total</span>
                      <span className="font-semibold flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                        {formatMontant(coutTotal, devise)}
                      </span>
                    </div>
                    {coutTotalCFA && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Coût total CFA</span>
                        <span className="font-semibold">{formatMontant(coutTotalCFA, "CFA")}</span>
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="dateCmd">Date commande fournisseur</Label>
                    <Input id="dateCmd" type="date" value={dateCommande} onChange={(e) => setDateCommande(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="delai">Délai de production (jours)</Label>
                    <Input id="delai" type="number" min={1} placeholder="Ex: 30"
                      value={delaiProduction} onChange={(e) => setDelaiProduction(parseInt(e.target.value) || "")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dateFinP">Date fin production prévue</Label>
                    <Input id="dateFinP" type="date" value={dateFinPrevue} onChange={(e) => setDateFinPrevue(e.target.value)} />
                    {dateFinPrevue && <p className="text-xs text-slate-400">Auto-calculé depuis date + délai</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notesF">Notes fournisseur</Label>
                  <Textarea id="notesF" value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Instructions, remarques pour le fournisseur..." rows={3} className="resize-none" />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pb-6">
              <Button type="button" variant="outline" onClick={resetForm}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Création...</>
                  : <><Save className="h-4 w-4 mr-1.5" />Créer la production</>
                }
              </Button>
            </div>
          </form>
        )}
      </RoleGate>

      {/* Fallback si aucune production et pas le droit */}
      {commande.productions.length === 0 && (
        <RoleGate
          roles={[]}
          fallback={
            <Card>
              <CardContent className="flex flex-col items-center py-12 gap-3 text-slate-400">
                <Factory className="h-10 w-10" />
                <p className="text-sm">Aucune production créée pour cette commande.</p>
              </CardContent>
            </Card>
          }
        >
          <></>
        </RoleGate>
      )}
    </div>
  )
}
