"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Loader2, ToggleLeft, ToggleRight, Save } from "lucide-react"

type Produit = {
  id: string
  reference: string
  nom: string
  description: string | null
  categorie: string | null
  prixUnitaireCFA: string | number
  imageUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type FormData = {
  reference: string
  nom: string
  description: string
  categorie: string
  prixUnitaireCFA: string
  imageUrl: string
}

const CATEGORIES = [
  "Stylos & Écriture",
  "Mugs & Tasses",
  "Textile",
  "High-Tech",
  "Papeterie",
  "Sacs & Bagagerie",
  "Goodies",
  "Autre",
]

export default function ProduitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [produit, setProduit] = useState<Produit | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormData>({
    reference: "",
    nom: "",
    description: "",
    categorie: "",
    prixUnitaireCFA: "",
    imageUrl: "",
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [submitting, setSubmitting] = useState(false)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    async function fetchProduit() {
      setLoading(true)
      try {
        const res = await fetch(`/api/produits/${id}`)
        if (!res.ok) throw new Error()
        const data: Produit = await res.json()
        setProduit(data)
        setForm({
          reference: data.reference,
          nom: data.nom,
          description: data.description ?? "",
          categorie: data.categorie ?? "",
          prixUnitaireCFA: String(data.prixUnitaireCFA),
          imageUrl: data.imageUrl ?? "",
        })
      } catch {
        toast.error("Produit introuvable")
        router.push("/parametres/produits")
      } finally {
        setLoading(false)
      }
    }
    fetchProduit()
  }, [id, router])

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<FormData> = {}
    if (!form.reference.trim()) e.reference = "La référence est requise"
    if (!form.nom.trim()) e.nom = "Le nom est requis"
    if (!form.prixUnitaireCFA.trim()) e.prixUnitaireCFA = "Le prix est requis"
    else if (isNaN(Number(form.prixUnitaireCFA)) || Number(form.prixUnitaireCFA) < 0)
      e.prixUnitaireCFA = "Prix invalide"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const payload = {
        reference: form.reference.trim(),
        nom: form.nom.trim(),
        description: form.description.trim() || null,
        categorie: form.categorie.trim() || null,
        prixUnitaireCFA: parseFloat(form.prixUnitaireCFA),
        imageUrl: form.imageUrl.trim() || null,
      }
      const res = await fetch(`/api/produits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      const updated: Produit = await res.json()
      setProduit(updated)
      toast.success("Produit mis à jour")
    } catch {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive() {
    if (!produit) return
    setToggling(true)
    try {
      const res = await fetch(`/api/produits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !produit.isActive }),
      })
      if (!res.ok) throw new Error()
      const updated: Produit = await res.json()
      setProduit(updated)
      toast.success(updated.isActive ? "Produit réactivé" : "Produit désactivé")
    } catch {
      toast.error("Erreur lors du changement de statut")
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Chargement...
      </div>
    )
  }

  if (!produit) return null

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title={produit.nom}
        description={`Référence : ${produit.reference}`}
      >
        <div className="flex items-center gap-2">
          {/* Toggle active */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleActive}
            disabled={toggling}
            className={produit.isActive ? "text-red-600 border-red-200 hover:bg-red-50" : "text-green-600 border-green-200 hover:bg-green-50"}
          >
            {toggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : produit.isActive ? (
              <>
                <ToggleLeft className="h-4 w-4" />
                Désactiver
              </>
            ) : (
              <>
                <ToggleRight className="h-4 w-4" />
                Réactiver
              </>
            )}
          </Button>

          <Link href="/parametres/produits">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* Status banner */}
      {!produit.isActive && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          Ce produit est actuellement <strong>inactif</strong> et n&apos;apparaît pas dans les devis.
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="space-y-5">
            {/* Référence + Nom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ep-reference">
                  Référence <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ep-reference"
                  value={form.reference}
                  onChange={(e) => set("reference", e.target.value.toUpperCase())}
                  aria-invalid={!!errors.reference}
                  className="font-mono"
                />
                {errors.reference && <p className="text-xs text-red-500">{errors.reference}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ep-nom">
                  Nom du produit <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ep-nom"
                  value={form.nom}
                  onChange={(e) => set("nom", e.target.value)}
                  aria-invalid={!!errors.nom}
                />
                {errors.nom && <p className="text-xs text-red-500">{errors.nom}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="ep-description">Description</Label>
              <Textarea
                id="ep-description"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
              />
            </div>

            {/* Catégorie + Prix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ep-categorie">Catégorie</Label>
                <Select
                  value={form.categorie || "__none__"}
                  onValueChange={(v) => set("categorie", v === "__none__" ? "" : (v ?? ""))}
                >
                  <SelectTrigger id="ep-categorie">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Sans catégorie —</SelectItem>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ep-prix">
                  Prix unitaire CFA <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="ep-prix"
                    type="number"
                    min="0"
                    step="1"
                    value={form.prixUnitaireCFA}
                    onChange={(e) => set("prixUnitaireCFA", e.target.value)}
                    aria-invalid={!!errors.prixUnitaireCFA}
                    className="pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                    FCFA
                  </span>
                </div>
                {errors.prixUnitaireCFA && (
                  <p className="text-xs text-red-500">{errors.prixUnitaireCFA}</p>
                )}
              </div>
            </div>

            {/* Image URL */}
            <div className="space-y-1.5">
              <Label htmlFor="ep-image">URL de l&apos;image</Label>
              <Input
                id="ep-image"
                type="url"
                placeholder="https://..."
                value={form.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
              />
              {form.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.imageUrl}
                  alt="Aperçu"
                  className="mt-2 h-24 w-24 object-cover rounded-lg border border-slate-200"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                />
              )}
            </div>

            {/* Save */}
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Enregistrer
              </Button>
              <Link href="/parametres/produits">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
