"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Loader2, Package } from "lucide-react"
import Link from "next/link"

const UNITES = [
  { value: "pièce", label: "Pièce" },
  { value: "carton", label: "Carton" },
  { value: "rouleau", label: "Rouleau" },
  { value: "feuille", label: "Feuille" },
  { value: "mètre", label: "Mètre" },
]

export default function NouvelArticleStockPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    reference: "",
    nom: "",
    description: "",
    unite: "pièce",
    quantite: "0",
    quantiteMin: "0",
    surplusStock: "0",
  })

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.reference.trim()) {
      toast.error("La référence est obligatoire")
      return
    }
    if (!form.nom.trim()) {
      toast.error("Le nom est obligatoire")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: form.reference.trim(),
          nom: form.nom.trim(),
          description: form.description.trim() || undefined,
          unite: form.unite,
          quantite: Number(form.quantite),
          quantiteMin: Number(form.quantiteMin),
          surplusStock: Number(form.surplusStock),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Erreur")
      }
      const created = await res.json()
      toast.success("Article créé avec succès")
      router.push(`/stock/${created.id ?? created.article?.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la création")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Nouvel article de stock"
        description="Ajouter un article à l'inventaire"
      >
        <Link
          href="/stock"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background text-[0.8rem] font-medium h-7 px-2.5 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour
        </Link>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Informations de l&apos;article
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="reference">
                  Référence <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="reference"
                  value={form.reference}
                  onChange={(e) => handleChange("reference", e.target.value)}
                  placeholder="ex. ART-001"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unite">Unité</Label>
                <Select
                  value={form.unite}
                  onValueChange={(v) => handleChange("unite", v ?? "pièce")}
                >
                  <SelectTrigger id="unite">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITES.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nom">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nom"
                value={form.nom}
                onChange={(e) => handleChange("nom", e.target.value)}
                placeholder="Nom de l'article"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Description optionnelle..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="quantite">Quantité initiale</Label>
                <Input
                  id="quantite"
                  type="number"
                  min="0"
                  value={form.quantite}
                  onChange={(e) => handleChange("quantite", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quantiteMin">Seuil minimum</Label>
                <Input
                  id="quantiteMin"
                  type="number"
                  min="0"
                  value={form.quantiteMin}
                  onChange={(e) => handleChange("quantiteMin", e.target.value)}
                />
                <p className="text-xs text-slate-500">Alerte stock bas</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="surplusStock">Surplus de stock</Label>
                <Input
                  id="surplusStock"
                  type="number"
                  min="0"
                  value={form.surplusStock}
                  onChange={(e) => handleChange("surplusStock", e.target.value)}
                />
                <p className="text-xs text-slate-500">Alerte surplus</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push("/stock")}>
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Créer l&apos;article
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
