"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { RoleGate } from "@/components/shared/RoleGate"
import { canDo } from "@/lib/permissions"
import { Role } from "@prisma/client"
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
  Plus, Loader2, Package, Upload, X, Search, BookOpen, LayoutGrid, Tag,
} from "lucide-react"

// Catégories standards (sans "Autre" qui est gérée via __autre__)
const BASE_CATEGORIES = [
  "Stylos & Écriture",
  "Mugs & Tasses",
  "Textile",
  "High-Tech",
  "Papeterie",
  "Sacs & Bagagerie",
  "Goodies",
]

const SENTINEL_AUTRE = "__autre__"

// Couleurs cycliques pour les chips de catégorie
const CAT_COLORS = [
  { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", active: "bg-blue-700 text-white border-blue-700" },
  { bg: "bg-violet-50 border-violet-200", text: "text-violet-700", active: "bg-violet-700 text-white border-violet-700" },
  { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", active: "bg-emerald-700 text-white border-emerald-700" },
  { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", active: "bg-amber-700 text-white border-amber-700" },
  { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", active: "bg-rose-700 text-white border-rose-700" },
  { bg: "bg-cyan-50 border-cyan-200", text: "text-cyan-700", active: "bg-cyan-700 text-white border-cyan-700" },
  { bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700", active: "bg-indigo-700 text-white border-indigo-700" },
  { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", active: "bg-orange-700 text-white border-orange-700" },
]

type FicheCout = {
  id: string
  categorie: string
  nom: string
  fournisseur: string
  contactFournisseur: string | null
  coutUnitaire: string | number
  fraisDedouanement: string | number
  coutTotal: string | number
  prixVente: string | number | null
  imageUrl: string | null
}

type FormState = {
  categorie: string
  nom: string
  fournisseur: string
  contactFournisseur: string
  coutUnitaire: string
  fraisDedouanement: string
  prixVente: string
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
  const { data: session } = useSession()
  const role = session?.user?.role as Role | undefined
  const permissions = (session?.user?.permissions ?? null) as string[] | null
  const canRead = canDo(role, "fiche-cout:read", permissions)
  const canManage = canDo(role, "fiche-cout:manage", permissions)

  const [fiches, setFiches] = useState<FicheCout[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeCategorie, setActiveCategorie] = useState<string | null>(null)

  // Dialog création
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [autreCategorie, setAutreCategorie] = useState("")
  const [saving, setSaving] = useState(false)

  // Image upload
  const imgInputRef = useRef<HTMLInputElement>(null)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const coutTotal = (Number(form.coutUnitaire) || 0) + (Number(form.fraisDedouanement) || 0)
  const isAutreSelected = form.categorie === SENTINEL_AUTRE

  const fetchFiches = useCallback(async () => {
    if (!canRead) {
      setLoading(false)
      return
    }
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
  }, [canRead])

  useEffect(() => { fetchFiches() }, [fetchFiches])

  // Catégories de la DB (custom) non présentes dans BASE_CATEGORIES
  const customCategoriesFromDB = [
    ...new Set(
      fiches
        .map((f) => f.categorie)
        .filter((c) => c && !BASE_CATEGORIES.includes(c))
    ),
  ].sort()

  // Toutes les catégories existantes dans les données (pour le filtre)
  const allCategories = [
    ...new Set(fiches.map((f) => f.categorie).filter(Boolean)),
  ]
  // Triées par nombre de produits (desc)
  const categoriesSortedByCount = [...allCategories].sort(
    (a, b) =>
      fiches.filter((f) => f.categorie === b).length -
      fiches.filter((f) => f.categorie === a).length
  )

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

  // Catégories qui ont des résultats après la recherche textuelle
  const categoriesWithResults = new Set(
    search
      ? displayed.map((f) => f.categorie)
      : allCategories
  )

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/fiches-cout/upload-image", { method: "POST", body: fd })
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur upload")
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
    setAutreCategorie("")
    setImageUrl(null)
    setImagePreview(null)
  }

  async function handleSave() {
    const categorieFinale = isAutreSelected ? autreCategorie.trim() : form.categorie
    if (!categorieFinale) {
      toast.error(isAutreSelected ? "Veuillez saisir le nom de la catégorie" : "La catégorie est requise")
      return
    }
    if (!form.nom.trim()) { toast.error("Le nom du produit est requis"); return }
    if (!form.fournisseur.trim()) { toast.error("Le fournisseur est requis"); return }
    if (!form.coutUnitaire || isNaN(Number(form.coutUnitaire))) {
      toast.error("Le coût unitaire est invalide"); return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/fiches-cout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categorie: categorieFinale,
          nom: form.nom.trim(),
          fournisseur: form.fournisseur.trim(),
          contactFournisseur: form.contactFournisseur.trim() || null,
          coutUnitaire: Number(form.coutUnitaire),
          fraisDedouanement: Number(form.fraisDedouanement) || 0,
          prixVente: form.prixVente ? Number(form.prixVente) : null,
          imageUrl,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur")
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
        <RoleGate action="fiche-cout:manage">
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetDialog() }}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="h-4 w-4 mr-1.5" />Ajouter une fiche
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
                      <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
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
                      {uploadingImg ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                        <><Upload className="h-6 w-6" /><span className="text-xs">Cliquer pour uploader (JPG, PNG, WEBP)</span></>
                      )}
                    </button>
                  )}
                  <input ref={imgInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleImageUpload} />
                </div>

                {/* Catégorie */}
                <div className="space-y-1.5">
                  <Label>Catégorie <span className="text-red-500">*</span></Label>
                  <Select
                    value={form.categorie}
                    onValueChange={(v) => { setForm((f) => ({ ...f, categorie: v ?? "" })); if (v !== SENTINEL_AUTRE) setAutreCategorie("") }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Standards</div>
                      {BASE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                      {customCategoriesFromDB.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-t mt-1 pt-2">Personnalisées</div>
                          {customCategoriesFromDB.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </>
                      )}
                      <div className="border-t mt-1 pt-1">
                        <SelectItem value={SENTINEL_AUTRE}>
                          <span className="flex items-center gap-1.5 text-slate-500 italic">
                            <Tag className="h-3.5 w-3.5" />Autre (nouvelle catégorie)...
                          </span>
                        </SelectItem>
                      </div>
                    </SelectContent>
                  </Select>
                  {isAutreSelected && (
                    <Input
                      autoFocus
                      value={autreCategorie}
                      onChange={(e) => setAutreCategorie(e.target.value)}
                      placeholder="Nom de la nouvelle catégorie..."
                      className="border-blue-300 focus-visible:ring-blue-400"
                    />
                  )}
                </div>

                {/* Produit */}
                <div className="space-y-1.5">
                  <Label>Produit <span className="text-red-500">*</span></Label>
                  <Input value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} placeholder="Nom du produit" />
                </div>

                {/* Fournisseur + Contact */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Fournisseur <span className="text-red-500">*</span></Label>
                    <Input value={form.fournisseur} onChange={(e) => setForm((f) => ({ ...f, fournisseur: e.target.value }))} placeholder="Nom du fournisseur" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contact fournisseur</Label>
                    <Input value={form.contactFournisseur} onChange={(e) => setForm((f) => ({ ...f, contactFournisseur: e.target.value }))} placeholder="Nom, email ou tél." />
                  </div>
                </div>

                {/* Coûts */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Prix d&apos;achat (FCFA) <span className="text-red-500">*</span></Label>
                    <Input type="number" min="0" value={form.coutUnitaire} onChange={(e) => setForm((f) => ({ ...f, coutUnitaire: e.target.value }))} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Frais de dédouanement (FCFA)</Label>
                    <Input type="number" min="0" value={form.fraisDedouanement} onChange={(e) => setForm((f) => ({ ...f, fraisDedouanement: e.target.value }))} placeholder="0" />
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Prix de revient (achat + dédouanement)</span>
                  <span className="font-bold text-slate-900 text-base">{formatMontant(coutTotal)}</span>
                </div>

                <div className="space-y-1.5">
                  <Label>Prix de vente (FCFA)</Label>
                  <Input type="number" min="0" value={form.prixVente} onChange={(e) => setForm((f) => ({ ...f, prixVente: e.target.value }))} placeholder="0 (optionnel)" />
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
                  {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Créer la fiche
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </RoleGate>
      </PageHeader>

      {!canRead && canManage && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
          <p className="text-sm font-semibold text-blue-900">Mode création uniquement</p>
          <p className="text-xs text-blue-700 mt-1">
            Vous pouvez créer de nouvelles fiches de coût via le bouton « Nouvelle fiche ». La consultation du catalogue ne vous est pas accessible.
          </p>
        </div>
      )}

      {canRead && (<>
      {/* ── Barre de recherche ──────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Rechercher par produit, fournisseur, catégorie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* ── Filtre intelligent par catégorie ───────────────────── */}
      {!loading && allCategories.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Filtrer par catégorie
            </p>
            {activeCategorie && (
              <button
                onClick={() => setActiveCategorie(null)}
                className="ml-auto text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"
              >
                <X className="h-3 w-3" />Effacer le filtre
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Chip "Toutes" */}
            <button
              onClick={() => setActiveCategorie(null)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                activeCategorie === null
                  ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800"
              )}
            >
              Toutes
              <span className={cn(
                "inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[9px] font-bold",
                activeCategorie === null ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              )}>
                {fiches.length}
              </span>
            </button>

            {/* Chips par catégorie, triées par count */}
            {categoriesSortedByCount.map((cat, idx) => {
              const color = CAT_COLORS[idx % CAT_COLORS.length]
              const count = fiches.filter((f) => f.categorie === cat).length
              const hasResults = categoriesWithResults.has(cat)
              const isActive = activeCategorie === cat

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategorie(isActive ? null : cat)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    !hasResults && "opacity-30 pointer-events-none",
                    isActive
                      ? color.active
                      : `bg-white ${color.text} border-slate-200 hover:${color.bg.split(" ")[0]} hover:border-current`
                  )}
                >
                  {cat}
                  <span className={cn(
                    "inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[9px] font-bold",
                    isActive ? "bg-white/20 text-current" : "bg-slate-100 text-slate-500"
                  )}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Résumé actif */}
          {(activeCategorie || search) && (
            <p className="text-xs text-slate-400">
              {displayed.length} résultat{displayed.length !== 1 ? "s" : ""}
              {activeCategorie && <> dans <span className="font-medium text-slate-600">«&nbsp;{activeCategorie}&nbsp;»</span></>}
              {search && <> pour <span className="font-medium text-slate-600">«&nbsp;{search}&nbsp;»</span></>}
            </p>
          )}
        </div>
      )}

      {/* ── Grille de cartes ────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />Chargement...
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <BookOpen className="h-10 w-10" />
          <p className="text-sm">
            {search || activeCategorie
              ? "Aucune fiche ne correspond à votre recherche."
              : "Aucune fiche de coût créée."}
          </p>
          {(search || activeCategorie) && (
            <button
              onClick={() => { setSearch(""); setActiveCategorie(null) }}
              className="text-xs text-blue-600 hover:underline"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {displayed.map((fiche) => {
            const catIdx = categoriesSortedByCount.indexOf(fiche.categorie)
            const color = CAT_COLORS[catIdx >= 0 ? catIdx % CAT_COLORS.length : 0]
            return (
              <button
                key={fiche.id}
                type="button"
                onClick={() => router.push(`/fiches-cout/${fiche.id}`)}
                className="text-left rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="h-44 bg-slate-100 overflow-hidden flex items-center justify-center">
                  {fiche.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fiche.imageUrl} alt={fiche.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <Package className="h-16 w-16 text-slate-300" />
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border", color.bg, color.text)}>
                    {fiche.categorie}
                  </span>
                  <p className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2">{fiche.nom}</p>
                  <p className="text-xs text-slate-500 truncate">{fiche.fournisseur}</p>
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
            )
          })}
        </div>
      )}
      </>)}
    </div>
  )
}
