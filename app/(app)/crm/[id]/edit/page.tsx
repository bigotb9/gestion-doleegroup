"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SECTEURS_ACTIVITE, SOURCE_PROSPECTS, PROSPECT_STATUS_LABELS } from "@/lib/constants"
import { ArrowLeft, Loader2, Save } from "lucide-react"

type FormData = {
  raisonSociale: string
  ncc: string
  secteurActivite: string
  secteurActiviteAutre: string
  siteWeb: string
  status: string
  contactNom: string
  contactPrenom: string
  contactPoste: string
  contactEmail: string
  contactPhone: string
  contactPhone2: string
  adresse: string
  ville: string
  pays: string
  sourceProspect: string
  priorite: string
}

const EMPTY: FormData = {
  raisonSociale: "",
  ncc: "",
  secteurActivite: "",
  secteurActiviteAutre: "",
  siteWeb: "",
  status: "PROSPECT",
  contactNom: "",
  contactPrenom: "",
  contactPoste: "",
  contactEmail: "",
  contactPhone: "",
  contactPhone2: "",
  adresse: "",
  ville: "",
  pays: "Côte d'Ivoire",
  sourceProspect: "",
  priorite: "2",
}

const STATUTS = Object.entries(PROSPECT_STATUS_LABELS) as [string, string][]

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [form, setForm] = useState<FormData>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchClient() {
      try {
        const res = await fetch(`/api/crm/${id}`)
        if (!res.ok) throw new Error("Client introuvable")
        const data = await res.json()
        const rawSecteur = data.secteurActivite ?? ""
        const isKnown = SECTEURS_ACTIVITE.includes(rawSecteur)
        setForm({
          raisonSociale: data.raisonSociale ?? "",
          ncc: data.ncc ?? "",
          secteurActivite: rawSecteur && !isKnown ? "Autre" : rawSecteur,
          secteurActiviteAutre: rawSecteur && !isKnown ? rawSecteur : "",
          siteWeb: data.siteWeb ?? "",
          status: data.status ?? "PROSPECT",
          contactNom: data.contactNom ?? "",
          contactPrenom: data.contactPrenom ?? "",
          contactPoste: data.contactPoste ?? "",
          contactEmail: data.contactEmail ?? "",
          contactPhone: data.contactPhone ?? "",
          contactPhone2: data.contactPhone2 ?? "",
          adresse: data.adresse ?? "",
          ville: data.ville ?? "",
          pays: data.pays ?? "Côte d'Ivoire",
          sourceProspect: data.sourceProspect ?? "",
          priorite: String(data.priorite ?? 2),
        })
      } catch {
        toast.error("Impossible de charger les données")
        router.push(`/crm/${id}`)
      } finally {
        setLoading(false)
      }
    }
    fetchClient()
  }, [id, router])

  function handleChange(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSelect(field: keyof FormData) {
    return (value: string | null) => {
      setForm((prev) => ({ ...prev, [field]: value ?? "" }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.raisonSociale.trim()) {
      toast.error("La raison sociale est obligatoire.")
      return
    }
    if (!form.contactNom.trim()) {
      toast.error("Le nom du contact est obligatoire.")
      return
    }
    if (!form.contactPhone.trim()) {
      toast.error("Le téléphone est obligatoire.")
      return
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        raisonSociale: form.raisonSociale.trim(),
        ncc: form.ncc.trim() || null,
        status: form.status,
        contactNom: form.contactNom.trim(),
        contactPhone: form.contactPhone.trim(),
        pays: form.pays.trim(),
        priorite: parseInt(form.priorite, 10),
        // Optional — send null to clear, or string to set
        secteurActivite: form.secteurActivite === "Autre"
          ? (form.secteurActiviteAutre.trim() || "Autre")
          : (form.secteurActivite || null),
        siteWeb: form.siteWeb.trim() || null,
        contactPrenom: form.contactPrenom.trim() || null,
        contactPoste: form.contactPoste.trim() || null,
        contactEmail: form.contactEmail.trim() || null,
        contactPhone2: form.contactPhone2.trim() || null,
        adresse: form.adresse.trim() || null,
        ville: form.ville.trim() || null,
        sourceProspect: form.sourceProspect || null,
      }

      const res = await fetch(`/api/crm/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Erreur lors de la mise à jour")
      }

      toast.success("Client mis à jour avec succès !")
      router.push(`/crm/${id}`)
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title={`Modifier — ${form.raisonSociale || "Client"}`}
        description="Mise à jour des informations du contact"
      >
        <Link
          href={`/crm/${id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Statut CRM */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Statut CRM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={form.status}
                onValueChange={handleSelect("status")}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUTS.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Entreprise */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Entreprise
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="raisonSociale">
                Raison sociale <span className="text-red-500">*</span>
              </Label>
              <Input
                id="raisonSociale"
                value={form.raisonSociale}
                onChange={(e) => handleChange("raisonSociale", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ncc">NCC — Numéro de Compte Contribuable</Label>
              <Input
                id="ncc"
                value={form.ncc}
                onChange={(e) => handleChange("ncc", e.target.value)}
                placeholder="Ex: 0012345678A"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="secteurActivite">Secteur d&apos;activité</Label>
              <Select
                value={form.secteurActivite}
                onValueChange={handleSelect("secteurActivite")}
              >
                <SelectTrigger id="secteurActivite">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {SECTEURS_ACTIVITE.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.secteurActivite === "Autre" && (
                <Input
                  placeholder="Préciser le secteur d'activité..."
                  value={form.secteurActiviteAutre}
                  onChange={(e) => handleChange("secteurActiviteAutre", e.target.value)}
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="siteWeb">Site web</Label>
              <Input
                id="siteWeb"
                type="url"
                value={form.siteWeb}
                onChange={(e) => handleChange("siteWeb", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ville">Ville</Label>
              <Input
                id="ville"
                value={form.ville}
                onChange={(e) => handleChange("ville", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pays">Pays</Label>
              <Input
                id="pays"
                value={form.pays}
                onChange={(e) => handleChange("pays", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                value={form.adresse}
                onChange={(e) => handleChange("adresse", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Contact principal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Contact principal
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contactNom">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contactNom"
                value={form.contactNom}
                onChange={(e) => handleChange("contactNom", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactPrenom">Prénom</Label>
              <Input
                id="contactPrenom"
                value={form.contactPrenom}
                onChange={(e) => handleChange("contactPrenom", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactPoste">Poste / Fonction</Label>
              <Input
                id="contactPoste"
                value={form.contactPoste}
                onChange={(e) => handleChange("contactPoste", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactEmail">Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={(e) => handleChange("contactEmail", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactPhone">
                Téléphone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contactPhone"
                type="tel"
                value={form.contactPhone}
                onChange={(e) => handleChange("contactPhone", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactPhone2">Téléphone 2</Label>
              <Input
                id="contactPhone2"
                type="tel"
                value={form.contactPhone2}
                onChange={(e) => handleChange("contactPhone2", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Qualification */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Qualification
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sourceProspect">Source</Label>
              <Select
                value={form.sourceProspect}
                onValueChange={handleSelect("sourceProspect")}
              >
                <SelectTrigger id="sourceProspect">
                  <SelectValue placeholder="Comment avez-vous trouvé ce prospect ?" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_PROSPECTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="priorite">Priorité</Label>
              <Select
                value={form.priorite}
                onValueChange={handleSelect("priorite")}
              >
                <SelectTrigger id="priorite">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 — Haute</SelectItem>
                  <SelectItem value="2">2 — Normale</SelectItem>
                  <SelectItem value="3">3 — Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-6">
          <Link
            href={`/crm/${id}`}
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
