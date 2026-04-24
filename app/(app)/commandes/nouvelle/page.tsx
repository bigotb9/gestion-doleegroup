"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
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
  FileText,
} from "lucide-react"

type Currency = "EUR" | "USD" | "CFA"

type ClientOption = {
  id: string
  raisonSociale: string
  contactNom: string
  contactPrenom: string | null
  ville: string | null
}

type DevisOption = {
  id: string
  numero: string
  total: string | number
  devise: Currency
  client: { raisonSociale: string }
}

type LigneRow = {
  id: string
  designation: string
  description: string
  quantite: number
  prixUnitaire: number
  remise: number
  coutAchat: number
  fraisDedouanement: number
  fraisTransport: number
}

function newLigne(): LigneRow {
  return {
    id: crypto.randomUUID(),
    designation: "",
    description: "",
    quantite: 1,
    prixUnitaire: 0,
    remise: 0,
    coutAchat: 0,
    fraisDedouanement: 0,
    fraisTransport: 0,
  }
}

function ligneTotal(l: LigneRow): number {
  const brut = l.quantite * l.prixUnitaire
  return brut * (1 - l.remise / 100)
}

export default function NouvelleCommandePage() {
  const router = useRouter()

  // Client
  const [clientSearch, setClientSearch] = useState("")
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null)
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false)
  const [debouncedClientSearch, setDebouncedClientSearch] = useState("")

  // Devis (optional link)
  const [devisSearch, setDevisSearch] = useState("")
  const [devisOptions, setDevisOptions] = useState<DevisOption[]>([])
  const [devisLoading, setDevisLoading] = useState(false)
  const [selectedDevis, setSelectedDevis] = useState<DevisOption | null>(null)
  const [devisDropdownOpen, setDevisDropdownOpen] = useState(false)
  const [debouncedDevisSearch, setDebouncedDevisSearch] = useState("")

  // Form fields
  const [modePaiement, setModePaiement] = useState<"AVANCE_SOLDE" | "BON_DE_COMMANDE">("BON_DE_COMMANDE")
  const [montantAvance, setMontantAvance] = useState<number | "">("")
  const [avanceMode, setAvanceMode] = useState<"POURCENTAGE" | "FIXE">("POURCENTAGE")
  const [montantTotal, setMontantTotal] = useState<number | "">("")
  const [devise, setDevise] = useState<Currency>("CFA")
  const [dateLivraison, setDateLivraison] = useState("")
  const [notes, setNotes] = useState("")

  // Lignes
  const [lignes, setLignes] = useState<LigneRow[]>([newLigne()])
  const [taxe, setTaxe] = useState<number>(0)

  const [saving, setSaving] = useState(false)

  // Debounce searches
  useEffect(() => {
    const t = setTimeout(() => setDebouncedClientSearch(clientSearch), 300)
    return () => clearTimeout(t)
  }, [clientSearch])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedDevisSearch(devisSearch), 300)
    return () => clearTimeout(t)
  }, [devisSearch])

  // Fetch clients
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
    if (clientDropdownOpen || debouncedClientSearch) fetchClients()
  }, [fetchClients, clientDropdownOpen, debouncedClientSearch])

  // Fetch accepted devis
  const fetchDevis = useCallback(async () => {
    setDevisLoading(true)
    try {
      const params = new URLSearchParams({ status: "ACCEPTE" })
      if (debouncedDevisSearch) params.set("search", debouncedDevisSearch)
      const res = await fetch(`/api/devis?${params.toString()}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setDevisOptions(data.devis ?? data)
    } catch {
      setDevisOptions([])
    } finally {
      setDevisLoading(false)
    }
  }, [debouncedDevisSearch])

  useEffect(() => {
    if (devisDropdownOpen || debouncedDevisSearch) fetchDevis()
  }, [fetchDevis, devisDropdownOpen, debouncedDevisSearch])

  // Derived totals from lignes
  const sousTotal = lignes.reduce((acc, l) => acc + ligneTotal(l), 0)
  const totalTTC = sousTotal + taxe

  // Auto-sync montantTotal with lignes
  useEffect(() => {
    if (totalTTC > 0) setMontantTotal(totalTTC)
  }, [totalTTC])

  // Computed avance amount
  const computedAvance = (() => {
    if (avanceMode === "POURCENTAGE" && typeof montantAvance === "number" && typeof montantTotal === "number") {
      return (montantAvance / 100) * montantTotal
    }
    return typeof montantAvance === "number" ? montantAvance : 0
  })()

  function updateLigne(id: string, field: keyof LigneRow, value: string | number) {
    setLignes((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)))
  }

  function removeLigne(id: string) {
    if (lignes.length === 1) {
      toast.error("La commande doit avoir au moins une ligne.")
      return
    }
    setLignes((prev) => prev.filter((l) => l.id !== id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedClient) {
      toast.error("Veuillez sélectionner un client.")
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
        devisId: selectedDevis?.id ?? undefined,
        modePaiement,
        montantAvance: modePaiement === "AVANCE_SOLDE" ? computedAvance : undefined,
        montantTotal: typeof montantTotal === "number" ? montantTotal : totalTTC,
        devise,
        dateLivraisonSouhaitee: dateLivraison || undefined,
        notes: notes.trim() || undefined,
        taxe,
        lignes: lignes.map((l, i) => ({
          designation: l.designation.trim(),
          description: l.description.trim() || undefined,
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
          remise: l.remise,
          ordre: i,
          coutAchat: l.coutAchat || undefined,
          fraisDedouanement: l.fraisDedouanement || undefined,
          fraisTransport: l.fraisTransport || undefined,
        })),
      }

      const res = await fetch("/api/commandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Erreur lors de la création")
      }

      const created = await res.json()
      toast.success("Commande créée avec succès !")
      router.push(`/commandes/${created.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setSaving(false)
    }
  }

  const sym = currencySymbol(devise)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader title="Nouvelle commande" description="Créez une commande pour un client">
        <Link
          href="/commandes"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Client <span className="text-red-500">*</span>
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
                  onClick={() => { setSelectedClient(null); setClientSearch("") }}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors underline"
                >
                  Changer
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher un client..."
                  value={clientSearch}
                  onChange={(e) => { setClientSearch(e.target.value); setClientDropdownOpen(true) }}
                  onFocus={() => setClientDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setClientDropdownOpen(false), 200)}
                  className="pl-9"
                />
                {clientDropdownOpen && (
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
                            setClientDropdownOpen(false)
                            setClientSearch("")
                          }}
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold shrink-0">
                            {c.raisonSociale.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{c.raisonSociale}</p>
                            <p className="text-xs text-slate-400">
                              {c.contactNom}{c.contactPrenom ? ` ${c.contactPrenom}` : ""}
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

        {/* Devis lié (optionnel) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Devis lié <span className="text-slate-400 font-normal normal-case text-xs">(optionnel)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDevis ? (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                  <div>
                    <p className="font-mono font-semibold text-blue-700 text-sm">{selectedDevis.numero}</p>
                    <p className="text-xs text-slate-500">
                      {selectedDevis.client.raisonSociale} · {formatMontant(Number(selectedDevis.total), selectedDevis.devise)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedDevis(null); setDevisSearch("") }}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors underline"
                >
                  Retirer
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher un devis accepté..."
                  value={devisSearch}
                  onChange={(e) => { setDevisSearch(e.target.value); setDevisDropdownOpen(true) }}
                  onFocus={() => setDevisDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setDevisDropdownOpen(false), 200)}
                  className="pl-9"
                />
                {devisDropdownOpen && (
                  <div className="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                    {devisLoading ? (
                      <div className="flex items-center justify-center py-4 text-slate-400 gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Recherche...</span>
                      </div>
                    ) : devisOptions.length === 0 ? (
                      <div className="flex flex-col items-center py-6 text-slate-400 gap-2">
                        <FileText className="h-6 w-6" />
                        <p className="text-sm">Aucun devis accepté trouvé</p>
                      </div>
                    ) : (
                      devisOptions.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                          onMouseDown={() => {
                            setSelectedDevis(d)
                            setDevisDropdownOpen(false)
                            setDevisSearch("")
                          }}
                        >
                          <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                          <div>
                            <p className="text-sm font-mono font-semibold text-blue-700">{d.numero}</p>
                            <p className="text-xs text-slate-400">
                              {d.client.raisonSociale} · {formatMontant(Number(d.total), d.devise)}
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

        {/* Informations commande */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Informations de la commande
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Mode paiement */}
            <div className="space-y-2">
              <Label>Mode de paiement <span className="text-red-500">*</span></Label>
              <div className="flex gap-4">
                {(["AVANCE_SOLDE", "BON_DE_COMMANDE"] as const).map((mode) => (
                  <label key={mode} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="modePaiement"
                      value={mode}
                      checked={modePaiement === mode}
                      onChange={() => setModePaiement(mode)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-sm text-slate-700">
                      {mode === "AVANCE_SOLDE" ? "Avance + Solde" : "Bon de commande"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Avance fields (conditional) */}
            {modePaiement === "AVANCE_SOLDE" && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-3">
                <Label className="text-blue-800 font-medium">Montant d&apos;avance</Label>
                <div className="flex gap-3 items-end">
                  <div className="flex gap-2">
                    {(["POURCENTAGE", "FIXE"] as const).map((m) => (
                      <label key={m} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="avanceMode"
                          value={m}
                          checked={avanceMode === m}
                          onChange={() => setAvanceMode(m)}
                          className="h-3.5 w-3.5 text-blue-600"
                        />
                        <span className="text-xs text-slate-600">
                          {m === "POURCENTAGE" ? "En %" : "Montant fixe"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      type="number"
                      min={0}
                      max={avanceMode === "POURCENTAGE" ? 100 : undefined}
                      step={avanceMode === "POURCENTAGE" ? "1" : "0.01"}
                      placeholder={avanceMode === "POURCENTAGE" ? "Ex: 30 (%)" : `Montant (${sym})`}
                      value={montantAvance}
                      onChange={(e) => setMontantAvance(parseFloat(e.target.value) || "")}
                    />
                  </div>
                  {avanceMode === "POURCENTAGE" && typeof montantAvance === "number" && typeof montantTotal === "number" && montantTotal > 0 && (
                    <p className="text-sm text-blue-700 font-medium whitespace-nowrap">
                      = {formatMontant(computedAvance, devise)}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="devise">Devise</Label>
                <Select value={devise} onValueChange={(v) => setDevise(v as Currency)}>
                  <SelectTrigger id="devise">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CURRENCY_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dateLivraison">Date de livraison souhaitée</Label>
                <Input
                  id="dateLivraison"
                  type="date"
                  value={dateLivraison}
                  onChange={(e) => setDateLivraison(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instructions spéciales, remarques..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lignes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Lignes de commande
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_auto] gap-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <span>Désignation</span>
              <span>Description</span>
              <span>Qté</span>
              <span>Prix vente ({sym})</span>
              <span>Remise %</span>
              <span className="text-right">Total ({sym})</span>
              <span />
            </div>

            <div className="space-y-3">
              {lignes.map((ligne, idx) => {
                const lt = ligneTotal(ligne)
                const hasCouts = ligne.coutAchat > 0 || ligne.fraisDedouanement > 0 || ligne.fraisTransport > 0
                const coutTotalLigne = (ligne.coutAchat + ligne.fraisDedouanement + ligne.fraisTransport) * ligne.quantite
                return (
                  <div
                    key={ligne.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2"
                  >
                    {/* En-tête ligne */}
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Produit {idx + 1}
                    </p>

                    {/* Ligne principale : champs commerciaux */}
                    <div className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_auto] gap-2 items-center">
                      <Input
                        placeholder="Désignation *"
                        value={ligne.designation}
                        onChange={(e) => updateLigne(ligne.id, "designation", e.target.value)}
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
                        onChange={(e) => updateLigne(ligne.id, "quantite", Math.max(0, parseInt(e.target.value) || 0))}
                      />
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={ligne.prixUnitaire === 0 ? "" : ligne.prixUnitaire}
                        onChange={(e) => updateLigne(ligne.id, "prixUnitaire", parseFloat(e.target.value) || 0)}
                      />
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        placeholder="0"
                        value={ligne.remise === 0 ? "" : ligne.remise}
                        onChange={(e) =>
                          updateLigne(ligne.id, "remise", Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))
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
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Ligne secondaire : coûts internes par unité */}
                    <div className="rounded-md border border-slate-200 bg-white px-3 py-2.5 space-y-1.5">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Coûts internes / unité <span className="font-normal normal-case">(optionnel — dédouanement &amp; logistique)</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs text-slate-500">Coût d&apos;achat ({sym})</label>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="0.00"
                            value={ligne.coutAchat === 0 ? "" : ligne.coutAchat}
                            onChange={(e) => updateLigne(ligne.id, "coutAchat", parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-slate-500">Frais de dédouanement ({sym})</label>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="0.00"
                            value={ligne.fraisDedouanement === 0 ? "" : ligne.fraisDedouanement}
                            onChange={(e) => updateLigne(ligne.id, "fraisDedouanement", parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-slate-500">Frais de transport ({sym})</label>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="0.00"
                            value={ligne.fraisTransport === 0 ? "" : ligne.fraisTransport}
                            onChange={(e) => updateLigne(ligne.id, "fraisTransport", parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      {hasCouts && (
                        <p className="text-xs text-slate-500 pt-0.5">
                          Coût total sur {ligne.quantite} unité{ligne.quantite > 1 ? "s" : ""} :
                          <span className="font-semibold text-slate-700 ml-1">{formatMontant(coutTotalLigne, devise)}</span>
                        </p>
                      )}
                    </div>
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

            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Sous-total</span>
                  <span className="font-medium">{formatMontant(sousTotal, devise)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <Label htmlFor="taxe" className="cursor-pointer">Taxe ({sym})</Label>
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

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-6">
          <Link
            href="/commandes"
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
                Créer la commande
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
