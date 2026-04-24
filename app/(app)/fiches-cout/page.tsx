"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { RoleGate } from "@/components/shared/RoleGate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatMontant, cn } from "@/lib/utils"
import {
  Plus,
  Loader2,
  Package,
  Upload,
  X,
  Tag,
  Search,
  BookOpen,
} from "lucide-react"

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

type FicheCout = {
  id: string
  categorie: string
  nom: string
  fournisseur: string
  contactFournisseur: string | null
  coutUnitaire: string | number    // Prix d'achat
  fraisDedouanement: string | number
  coutTotal: string | number       // Prix de revient
  prixVente: string | number | null // Prix de vente
  imageUrl: string | null
}

type FormState = {
  categorie: string
  nom: string
  fournisseur: string
  contactFournisseur: string
  coutUnitaire: string    // Prix d'achat
  fraisDedouanement: string
  prixVente: string       // Prix de vente
}

const EMPTY_FORM: FormState = {
  categorie: "",
  nom: "",
  fournisseur: "",
  contactFournisseur: "",
  coutUnitaire: "",
  fraisDedouanement: "0",
  prixVente: "",
}

export default function FichesCoutPage() {
  const router = useRouter()
  const [fiches, setFiches] = useState<FicheCout[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeCategorie, setActiveCategorie] = useState<string | null>(null)

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Image upload
  const imgInputRef = useRef<HTMLInputElement>(null)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const coutTotal =
    (Number(form.coutUnitaire) || 0) + (Number(form.fraisDedouanement) || 0)

  const fetchFiches = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/fiches-cout")
      if (!res.ok) throw new Error()
      setFiches(await res.json())
    } catch {
      toast.error("Impossible de charger les fiches de coût")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFiches()
  }, [fetchFiches])

  // Catégories présentes dans les données
  const categories = [
    ...new Set(fiches.map((f) => f.categorie).filter(Boolean)),
  ].sort()

  // Filtre local
  const displayed = fiches.filter((f) => {
    if (activeCategorie && f.categorie !== activeCategorie) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        f.nom.toLowerCase().includes(q) ||
        f.fournisseur.toLowerCase().includes(q) ||
        f.categorie.toLowerCase().includes(q)
      )
    }
    return true
  })

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/fiches-cout/upload-image", {
        method: "POST",
        body: fd,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Erreur upload")
      }
      const { url } = await res.json()
      setImageUrl(url)
      setImagePreview(url)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'upload")
    } finally {
      setUploadingImg(false)
      if (imgInputRef.current) imgInputRef.current.value = ""
    }
  }

  function resetDialog() {
    setForm(EMPTY_FORM)
    setImageUrl(null)
    setImagePreview(null)
  }

  async function handleSave() {
    if (!form.categorie) { toast.error("La catégorie est requise"); return }
    if (!form.nom.trim()) { toast.error("Le nom du produit est requis"); return }
    if (!form.fournisseur.trim()) { toast.error("Le fournisseur est requis"); return }
    if (!form.coutUnitaire || isNaN(Number(form.coutUnitaire))) {
      toast.error("Le coût unitaire est invalide")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/fiches-cout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categorie: form.categorie,
          nom: form.nom.trim(),
          fournisseur: form.fournisseur.trim(),
          contactFournisseur: form.contactFournisseur.trim() || null,
          coutUnitaire: Number(form.coutUnitaire),
          fraisDedouanement: Number(form.fraisDedouanement) || 0,
          prixVente: form.prixVente ? Number(form.prixVente) : null,
          imageUrl,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Erreur")
      }
      const created = await res.json()
      toast.success("Fiche de coût créée")
      setDialogOpen(false)
      resetDialog()
      fetchFiches()
      router.push(`/fiches-cout/${created.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la création")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fiches de coût produit"
        description={`${fiches.length} fiche${fiches.length !== 1 ? "s" : ""} enregistrée${fiches.length !== 1 ? "s" : ""}`}
      >
        <RoleGate roles={["MANAGER", "SECRETAIRE"]}>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) resetDialog()
            }}
          >
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="h-4 w-4 mr-1.5" />
              Ajouter une fiche
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nouvelle fiche de coût produit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* Image */}
                <div className="space-y-1.5">
                  <Label>Image du produit</Label>
                  {imagePreview ? (
                    <div className="relative w-full h-40 rounded-lg overflow-hidden border border-slate-200 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Aperçu"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => { setImageUrl(null); setImagePreview(null) }}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => imgInputRef.current?.click()}
                      disabled={uploadingImg}
                      className="flex flex-col items-center justify-center gap-2 w-full h-32 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300 hover:bg-slate-100 transition-all disabled:opacity-50"
                    >
                      {uploadingImg ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6" />
                          <span className="text-xs">Cliquer pour uploader (JPG, PNG, WEBP)</span>
                        </>
                      )}
                    </button>
                  )}
                  <input
                    ref={imgInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>

                {/* Catégorie */}
                <div className="space-y-1.5">
                  <Label>Catégorie <span className="text-red-500">*</span></Label>
                  <Select
                    value={form.categorie}
                    onValueChange={(v) => setForm((f) => ({ ...f, categorie: v ?? "" }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Produit */}
                <div className="space-y-1.5">
                  <Label>Produit <span className="text-red-500">*</span></Label>
                  <Input
                    value={form.nom}
                    onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                    placeholder="Nom du produit"
                  />
                </div>

                {/* Fournisseur + Contact */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Fournisseur <span className="text-red-500">*</span></Label>
                    <Input
                      value={form.fournisseur}
                      onChange={(e) => setForm((f) => ({ ...f, fournisseur: e.target.value }))}
                      placeholder="Nom du fournisseur"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contact fournisseur</Label>
                    <Input
                      value={form.contactFournisseur}
                      onChange={(e) => setForm((f) => ({ ...f, contactFournisseur: e.target.value }))}
                      placeholder="Nom, email ou tél."
                    />
                  </div>
                </div>

                {/* Coûts */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Prix d&apos;achat (FCFA) <span className="text-red-500">*</span></Label>
                    <Input
                      type="number" min="0"
                      value={form.coutUnitaire}
                      onChange={(e) => setForm((f) => ({ ...f, coutUnitaire: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Frais de dédouanement (FCFA)</Label>
                    <Input
                      type="number" min="0"
                      value={form.fraisDedouanement}
                      onChange={(e) => setForm((f) => ({ ...f, fraisDedouanement: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Prix de revient auto */}
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Prix de revient (achat + dédouanement)</span>
                  <span className="font-bold text-slate-900 text-base">{formatMontant(coutTotal)}</span>
                </div>

                {/* Prix de vente */}
                <div className="space-y-1.5">
                  <Label>Prix de vente (FCFA)</Label>
                  <Input
                    type="number" min="0"
                    value={form.prixVente}
                    onChange={(e) => setForm((f) => ({ ...f, prixVente: e.target.value }))}
                    placeholder="0 (optionnel)"
                  />
                  {form.prixVente && Number(form.prixVente) > 0 && coutTotal > 0 && (
                    <p className="text-xs text-green-700 font-medium">
                      Marge : {formatMontant(Number(form.prixVente) - coutTotal)} ({Math.round(((Number(form.prixVente) - coutTotal) / Number(form.prixVente)) * 100)}%)
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleSave} disabled={saving || uploadingImg}>
                  {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  Créer la fiche
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </RoleGate>
      </PageHeader>

      {/* Recherche */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Rechercher par produit, fournisseur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filtre par catégorie */}
      {!loading && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <Tag className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <button
            onClick={() => setActiveCategorie(null)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              activeCategorie === null
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Toutes ({fiches.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategorie(activeCategorie === cat ? null : cat)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                activeCategorie === cat
                  ? "bg-blue-700 text-white"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
              )}
            >
              {cat} ({fiches.filter((f) => f.categorie === cat).length})
            </button>
          ))}
        </div>
      )}

      {/* Grille de cartes */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Chargement...
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <BookOpen className="h-10 w-10" />
          <p className="text-sm">
            {search || activeCategorie
              ? "Aucune fiche ne correspond à votre recherche."
              : "Aucune fiche de coût créée."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {displayed.map((fiche) => (
            <button
              key={fiche.id}
              type="button"
              onClick={() => router.push(`/fiches-cout/${fiche.id}`)}
              className="text-left rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
            >
              {/* Image */}
              <div className="h-44 bg-slate-100 overflow-hidden flex items-center justify-center">
                {fiche.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fiche.imageUrl}
                    alt={fiche.nom}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <Package className="h-16 w-16 text-slate-300" />
                )}
              </div>

              {/* Infos */}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    {fiche.categorie}
                  </span>
                </div>
                <p className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2">
                  {fiche.nom}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {fiche.fournisseur}
                </p>
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Prix d&apos;achat</span>
                    <span>{formatMontant(Number(fiche.coutUnitaire))}</span>
                  </div>
                  {Number(fiche.fraisDedouanement) > 0 && (
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>+ Dédouanement</span>
                      <span>{formatMontant(Number(fiche.fraisDedouanement))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-semibold text-slate-700 pt-1 border-t border-slate-100">
                    <span>Prix de revient</span>
                    <span className="text-blue-700">{formatMontant(Number(fiche.coutTotal))}</span>
                  </div>
                  {fiche.prixVente != null && Number(fiche.prixVente) > 0 && (
                    <div className="flex justify-between text-xs font-semibold text-green-700">
                      <span>Prix de vente</span>
                      <span>{formatMontant(Number(fiche.prixVente))}</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
