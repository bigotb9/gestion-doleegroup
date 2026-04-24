"use client"

import { useState } from "react"
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
import { ArrowLeft, Loader2, Sparkles } from "lucide-react"

type FormData = {
  reference: string
  nom: string
  description: string
  categorie: string
  prixUnitaireCFA: string
  imageUrl: string
}

const EMPTY_FORM: FormData = {
  reference: "",
  nom: "",
  description: "",
  categorie: "",
  prixUnitaireCFA: "",
  imageUrl: "",
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

// Auto-suggest reference from name
function suggestReference(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .toUpperCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.slice(0, 3))
    .join("-")
    .slice(0, 12)
}

export default function NouveauProduitPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [submitting, setSubmitting] = useState(false)

  function set(field: keyof FormData, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      // Auto-fill reference when nom changes (if reference not manually set)
      if (field === "nom" && !prev.reference) {
        next.reference = suggestReference(value)
      }
      return next
    })
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const payload = {
        reference: form.reference.trim(),
        nom: form.nom.trim(),
        description: form.description.trim() || undefined,
        categorie: form.categorie.trim() || undefined,
        prixUnitaireCFA: parseFloat(form.prixUnitaireCFA),
        imageUrl: form.imageUrl.trim() || undefined,
      }
      const res = await fetch("/api/produits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.status === 409) {
        setErrors({ reference: "Cette référence est déjà utilisée" })
        return
      }
      if (!res.ok) throw new Error()
      toast.success("Produit créé avec succès")
      router.push("/parametres/produits")
    } catch {
      toast.error("Erreur lors de la création du produit")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Nouveau produit"
        description="Ajouter un produit au catalogue"
      >
        <Link href="/parametres/produits">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
      </PageHeader>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Référence + Nom on same row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-reference">
                  Référence <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="p-reference"
                    placeholder="Ex: STY-BIC-001"
                    value={form.reference}
                    onChange={(e) => set("reference", e.target.value.toUpperCase())}
                    aria-invalid={!!errors.reference}
                    className="font-mono"
                  />
                  {form.nom && !form.reference && (
                    <button
                      type="button"
                      onClick={() => set("reference", suggestReference(form.nom))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700"
                      title="Suggérer une référence"
                    >
                      <Sparkles className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {errors.reference && <p className="text-xs text-red-500">{errors.reference}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-nom">
                  Nom du produit <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="p-nom"
                  placeholder="Ex: Stylo bille personnalisé"
                  value={form.nom}
                  onChange={(e) => set("nom", e.target.value)}
                  aria-invalid={!!errors.nom}
                />
                {errors.nom && <p className="text-xs text-red-500">{errors.nom}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="p-description">Description</Label>
              <Textarea
                id="p-description"
                placeholder="Description détaillée du produit..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
              />
            </div>

            {/* Catégorie + Prix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-categorie">Catégorie</Label>
                <Select
                  value={form.categorie || "__none__"}
                  onValueChange={(v) => set("categorie", v === "__none__" ? "" : (v ?? ""))}
                >
                  <SelectTrigger id="p-categorie">
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
                <Label htmlFor="p-prix">
                  Prix unitaire CFA <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="p-prix"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
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
              <Label htmlFor="p-image">URL de l&apos;image</Label>
              <Input
                id="p-image"
                type="url"
                placeholder="https://..."
                value={form.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Créer le produit
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
