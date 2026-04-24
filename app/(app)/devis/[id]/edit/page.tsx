"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
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
import { CURRENCY_LABELS } from "@/lib/constants"
import { formatMontant, currencySymbol } from "@/lib/utils"
import {
  ArrowLeft,
  Loader2,
  Save,
  Plus,
  Trash2,
  Search,
  Building2,
  AlertTriangle,
} from "lucide-react"
type Currency = "EUR" | "USD" | "CFA"

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

type ClientOption = {
  id: string
  raisonSociale: string
  contactNom: string
  contactPrenom: string | null
  ville: string | null
}

type LigneRow = {
  id: string
  serverId?: string // existing ligne id on server
  designation: string
  description: string
  quantite: number
  prixUnitaire: number
  remise: number
  remiseFixe: number
}

function newLigne(): LigneRow {
  return {
    id: crypto.randomUUID(),
    designation: "",
    description: "",
    quantite: 1,
    prixUnitaire: 0,
    remise: 0,
    remiseFixe: 0,
  }
}

function ligneTotal(l: LigneRow): number {
  const brut = l.quantite * l.prixUnitaire
  return Math.max(0, brut * (1 - l.remise / 100) - l.remiseFixe)
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export default function EditDevisPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [pageLoading, setPageLoading] = useState(true)
  const [notAllowed, setNotAllowed] = useState(false)

  // Section 1 — client
  const [clientSearch, setClientSearch] = useState("")
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [debouncedClientSearch, setDebouncedClientSearch] = useState("")

  // Section 2 — infos
  const [dateValidite, setDateValidite] = useState("")
  const [devise, setDevise] = useState<Currency>("CFA")
  const [notes, setNotes] = useState("")
  const [conditionsPaiement, setConditionsPaiement] = useState("")
  const [delaiLivraison, setDelaiLivraison] = useState("")

  // Section 3 — lignes
  const [lignes, setLignes] = useState<LigneRow[]>([newLigne()])
  const [taxe, setTaxe] = useState<number>(0)

  const [saving, setSaving] = useState(false)

  // ── Load existing devis ────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      setPageLoading(true)
      try {
        const res = await fetch(`/api/devis/${id}`)
        if (!res.ok) throw new Error()
        const data = await res.json()

        if (data.status !== "BROUILLON") {
          setNotAllowed(true)
          return
        }

        setSelectedClient({
          id: data.client.id,
          raisonSociale: data.client.raisonSociale,
          contactNom: data.client.contactNom,
          contactPrenom: data.client.contactPrenom,
          ville: data.client.ville,
        })

        // dateValidite: format to yyyy-mm-dd for input[type=date]
        const dvDate = new Date(data.dateValidite)
        setDateValidite(dvDate.toISOString().split("T")[0])

        setDevise(data.devise as Currency)
        setNotes(data.notes ?? "")
        setConditionsPaiement(data.conditionsPaiement ?? "")
        setDelaiLivraison(data.delaiLivraison ?? "")
        setTaxe(Number(data.taxe) ?? 0)

        const sortedLignes = [...data.lignes].sort(
          (a: { ordre: number }, b: { ordre: number }) => a.ordre - b.ordre
        )
        setLignes(
          sortedLignes.map((l: {
            id: string
            designation: string
            description: string | null
            quantite: number
            prixUnitaire: string | number
            remise: string | number
            remiseFixe: string | number
          }) => ({
            id: crypto.randomUUID(),
            serverId: l.id,
            designation: l.designation,
            description: l.description ?? "",
            quantite: l.quantite,
            prixUnitaire: Number(l.prixUnitaire),
            remise: Number(l.remise),
            remiseFixe: Number(l.remiseFixe ?? 0),
          }))
        )
      } catch {
        toast.error("Impossible de charger le devis")
        router.push(`/devis/${id}`)
      } finally {
        setPageLoading(false)
      }
    })()
  }, [id, router])

  // ── Debounce client search ────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedClientSearch(clientSearch), 300)
    return () => clearTimeout(timer)
  }, [clientSearch])

  // ── Fetch clients ─────────────────────────────────────────
  const fetchClients = useCallback(async () => {
    setClientsLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedClientSearch) params.set("search", debouncedClientSearch)
      const res = await fetch(`/api/crm?${params.toString()}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setClientOptions(data.clients ?? data)
    } catch {
      setClientOptions([])
    } finally {
      setClientsLoading(false)
    }
  }, [debouncedClientSearch])

  useEffect(() => {
    if (dropdownOpen || debouncedClientSearch) {
      fetchClients()
    }
  }, [fetchClients, dropdownOpen, debouncedClientSearch])

  // ── Derived totals ────────────────────────────────────────
  const sousTotal = lignes.reduce((acc, l) => acc + ligneTotal(l), 0)
  const totalTTC = sousTotal + taxe

  // ── Ligne helpers ─────────────────────────────────────────
  function updateLigne(id: string, field: keyof LigneRow, value: string | number) {
    setLignes((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    )
  }

  function removeLigne(id: string) {
    if (lignes.length === 1) {
      toast.error("Le devis doit avoir au moins une ligne.")
      return
    }
    setLignes((prev) => prev.filter((l) => l.id !== id))
  }

  // ── Submit ────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedClient) {
      toast.error("Veuillez sélectionner un client.")
      return
    }
    if (!dateValidite) {
      toast.error("La date de validité est obligatoire.")
      return
    }
    if (lignes.some((l) => !l.designation.trim())) {
      toast.error("Chaque ligne doit avoir une désignation.")
      return
    }
    if (lignes.some((l) => l.quantite <= 0)) {
      toast.error("Les quantités doivent être supérieures à 0.")
      return
    }

    setSaving(true)
    try {
      const body = {
        clientId: selectedClient.id,
        dateValidite,
        devise,
        notes: notes.trim() || null,
        conditionsPaiement: conditionsPaiement.trim() || null,
        delaiLivraison: delaiLivraison.trim() || null,
        taxe,
        lignes: lignes.map((l, i) => ({
          id: l.serverId,
          designation: l.designation.trim(),
          description: l.description.trim() || null,
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
          remise: l.remise,
          remiseFixe: l.remiseFixe,
          ordre: i,
        })),
      }

      const res = await fetch(`/api/devis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Erreur lors de la mise à jour")
      }

      toast.success("Facture proforma mise à jour avec succès !")
      router.push(`/devis/${id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setSaving(false)
    }
  }

  // ── Loading state ─────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Chargement...
      </div>
    )
  }

  if (notAllowed) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-7 w-7 text-amber-600" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-slate-800">Modification impossible</h2>
        <p className="text-sm text-slate-500">
          Seuls les devis en statut <strong>Brouillon</strong> peuvent être modifiés.
        </p>
        <Link
          href={`/devis/${id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-3 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au devis
        </Link>
      </div>
    )
  }

  const sym = currencySymbol(devise)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader title="Modifier la facture proforma" description="Modifier les informations de la facture proforma (brouillon uniquement)">
        <Link
          href={`/devis/${id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Section 1: Client ─────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedClient ? (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold shrink-0">
                    {selectedClient.raisonSociale.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{selectedClient.raisonSociale}</p>
                    <p className="text-xs text-slate-500">
                      {selectedClient.contactNom}
                      {selectedClient.contactPrenom ? ` ${selectedClient.contactPrenom}` : ""}
                      {selectedClient.ville ? ` · ${selectedClient.ville}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClient(null)
                    setClientSearch("")
                  }}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors underline"
                >
                  Changer
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher un client..."
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value)
                      setDropdownOpen(true)
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                    className="pl-9"
                  />
                </div>
                {dropdownOpen && (
                  <div className="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                    {clientsLoading ? (
                      <div className="flex items-center justify-center py-4 text-slate-400 gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Recherche...</span>
                      </div>
                    ) : clientOptions.length === 0 ? (
                      <div className="flex flex-col items-center py-6 text-slate-400 gap-2">
                        <Building2 className="h-6 w-6" />
                        <p className="text-sm">Aucun client trouvé</p>
                      </div>
                    ) : (
                      clientOptions.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                          onMouseDown={() => {
                            setSelectedClient(c)
                            setDropdownOpen(false)
                            setClientSearch("")
                          }}
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold shrink-0">
                            {c.raisonSociale.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{c.raisonSociale}</p>
                            <p className="text-xs text-slate-400">
                              {c.contactNom}
                              {c.contactPrenom ? ` ${c.contactPrenom}` : ""}
                              {c.ville ? ` · ${c.ville}` : ""}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Section 2: Infos devis ────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Informations de la facture proforma
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dateValidite">
                Date de validité <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateValidite"
                type="date"
                value={dateValidite}
                onChange={(e) => setDateValidite(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="devise">Devise</Label>
              <Select value={devise} onValueChange={(v) => setDevise(v as Currency)}>
                <SelectTrigger id="devise">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CURRENCY_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="conditionsPaiement">Conditions de paiement</Label>
              <Textarea
                id="conditionsPaiement"
                value={conditionsPaiement}
                onChange={(e) => setConditionsPaiement(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
              <p className="text-xs text-slate-400">
                Coordonnées bancaires (chèque / virement) ajoutées automatiquement dans le PDF.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="delaiLivraison">Délai de livraison</Label>
              <Input
                id="delaiLivraison"
                value={delaiLivraison}
                onChange={(e) => setDelaiLivraison(e.target.value)}
                placeholder="Ex : 15 jours ouvrables"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="notes">Notes / Remarques</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informations complémentaires pour le client..."
                rows={3}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Section 3 & 4: Lignes + Taxe ────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Lignes de la facture proforma
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <span>Désignation</span>
              <span>Description</span>
              <span>Qté</span>
              <span>Prix unit. ({sym})</span>
              <span>Remise %</span>
              <span>Remise fixe ({sym})</span>
              <span className="text-right">Total ({sym})</span>
              <span />
            </div>

            <div className="space-y-2">
              {lignes.map((ligne, idx) => {
                const lt = ligneTotal(ligne)
                return (
                  <div
                    key={ligne.id}
                    className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 items-start rounded-lg border border-slate-100 bg-slate-50 p-3 md:bg-transparent md:border-0 md:p-0"
                  >
                    <p className="md:hidden text-xs font-medium text-slate-500 mb-1">
                      Ligne {idx + 1}
                    </p>

                    <Input
                      placeholder="Désignation *"
                      value={ligne.designation}
                      onChange={(e) => updateLigne(ligne.id, "designation", e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Description (optionnel)"
                      value={ligne.description}
                      onChange={(e) => updateLigne(ligne.id, "description", e.target.value)}
                    />
                    <Input
                      type="number"
                      min={1}
                      placeholder="1"
                      value={ligne.quantite === 0 ? "" : ligne.quantite}
                      onChange={(e) =>
                        updateLigne(ligne.id, "quantite", Math.max(0, parseInt(e.target.value) || 0))
                      }
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      value={ligne.prixUnitaire === 0 ? "" : ligne.prixUnitaire}
                      onChange={(e) =>
                        updateLigne(ligne.id, "prixUnitaire", parseFloat(e.target.value) || 0)
                      }
                    />
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      placeholder="0"
                      value={ligne.remise === 0 ? "" : ligne.remise}
                      onChange={(e) =>
                        updateLigne(
                          ligne.id,
                          "remise",
                          Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                        )
                      }
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0"
                      value={ligne.remiseFixe === 0 ? "" : ligne.remiseFixe}
                      onChange={(e) =>
                        updateLigne(ligne.id, "remiseFixe", Math.max(0, parseFloat(e.target.value) || 0))
                      }
                    />
                    <Input
                      readOnly
                      value={formatMontant(lt, devise)}
                      className="text-right bg-white font-medium text-slate-700 cursor-default"
                      tabIndex={-1}
                    />
                    <button
                      type="button"
                      onClick={() => removeLigne(ligne.id)}
                      className="flex items-center justify-center h-10 w-10 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                      title="Supprimer la ligne"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLignes((prev) => [...prev, newLigne()])}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Ajouter une ligne
            </Button>

            <Separator />

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Sous-total</span>
                  <span className="font-medium">{formatMontant(sousTotal, devise)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <Label htmlFor="taxe" className="cursor-pointer">
                    Taxe ({sym})
                  </Label>
                  <Input
                    id="taxe"
                    type="number"
                    min={0}
                    step="0.01"
                    value={taxe === 0 ? "" : taxe}
                    onChange={(e) => setTaxe(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-36 text-right h-8 text-sm"
                  />
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Total TTC</span>
                  <span>{formatMontant(totalTTC, devise)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Actions ───────────────────────────────────── */}
        <div className="flex justify-end gap-3 pb-6">
          <Link
            href={`/devis/${id}`}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors"
          >
            Annuler
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1.5" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
