"use client"

import { useState, useEffect, useRef, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { RoleGate } from "@/components/shared/RoleGate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { formatMontant, formatDateTime } from "@/lib/utils"
import {
  ArrowLeft,
  Loader2,
  Package,
  Pencil,
  Save,
  Trash2,
  Upload,
  X,
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
  createdAt: string
  updatedAt: string
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

export default function FicheCoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [fiche, setFiche] = useState<FicheCout | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<FormState>({
    categorie: "",
    nom: "",
    fournisseur: "",
    contactFournisseur: "",
    coutUnitaire: "",
    fraisDedouanement: "0",
    prixVente: "",
  })

  // Image upload
  const imgInputRef = useRef<HTMLInputElement>(null)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const coutTotalForm =
    (Number(form.coutUnitaire) || 0) + (Number(form.fraisDedouanement) || 0)

  useEffect(() => {
    async function fetchFiche() {
      setLoading(true)
      try {
        const res = await fetch(`/api/fiches-cout/${id}`)
        if (!res.ok) throw new Error()
        const data: FicheCout = await res.json()
        setFiche(data)
        setImageUrl(data.imageUrl)
        setForm({
          categorie: data.categorie,
          nom: data.nom,
          fournisseur: data.fournisseur,
          contactFournisseur: data.contactFournisseur ?? "",
          coutUnitaire: String(Number(data.coutUnitaire)),
          fraisDedouanement: String(Number(data.fraisDedouanement)),
          prixVente: data.prixVente != null ? String(Number(data.prixVente)) : "",
        })
      } catch {
        toast.error("Fiche introuvable")
        router.push("/fiches-cout")
      } finally {
        setLoading(false)
      }
    }
    fetchFiche()
  }, [id, router])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/fiches-cout/upload-image", { method: "POST", body: fd })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Erreur upload")
      }
      const { url } = await res.json()
      setImageUrl(url)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'upload")
    } finally {
      setUploadingImg(false)
      if (imgInputRef.current) imgInputRef.current.value = ""
    }
  }

  async function handleSave() {
    if (!form.categorie) { toast.error("La catégorie est requise"); return }
    if (!form.nom.trim()) { toast.error("Le nom est requis"); return }
    if (!form.fournisseur.trim()) { toast.error("Le fournisseur est requis"); return }
    if (!form.coutUnitaire || isNaN(Number(form.coutUnitaire))) {
      toast.error("Le coût unitaire est invalide")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/fiches-cout/${id}`, {
        method: "PATCH",
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
      if (!res.ok) throw new Error()
      const updated: FicheCout = await res.json()
      setFiche(updated)
      setEditing(false)
      toast.success("Fiche mise à jour")
    } catch {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/fiches-cout/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Fiche supprimée")
      router.push("/fiches-cout")
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  function cancelEdit() {
    if (!fiche) return
    setImageUrl(fiche.imageUrl)
    setForm({
      categorie: fiche.categorie,
      nom: fiche.nom,
      fournisseur: fiche.fournisseur,
      contactFournisseur: fiche.contactFournisseur ?? "",
      coutUnitaire: String(Number(fiche.coutUnitaire)),
      fraisDedouanement: String(Number(fiche.fraisDedouanement)),
      prixVente: fiche.prixVente != null ? String(Number(fiche.prixVente)) : "",
    })
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Chargement...
      </div>
    )
  }

  if (!fiche) return null

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title={editing ? "Modifier la fiche" : fiche.nom}
        description={editing ? "" : fiche.categorie}
      >
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={cancelEdit}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || uploadingImg}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Enregistrer
              </Button>
            </>
          ) : (
            <>
              <RoleGate roles={["MANAGER", "SECRETAIRE"]}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                  Modifier
                </Button>
              </RoleGate>
              <RoleGate roles={["MANAGER"]}>
                <ConfirmDialog
                  title="Supprimer la fiche"
                  description={`Supprimer la fiche « ${fiche.nom} » ? Cette action est irréversible.`}
                  onConfirm={handleDelete}
                  trigger={
                    <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  }
                />
              </RoleGate>
              <Link href="/fiches-cout">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </Button>
              </Link>
            </>
          )}
        </div>
      </PageHeader>

      {editing ? (
        /* ── Mode édition ── */
        <Card>
          <CardContent className="p-6 space-y-5">
            {/* Image */}
            <div className="space-y-1.5">
              <Label>Image du produit</Label>
              <div className="relative w-full h-52 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group">
                {imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Aperçu"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => imgInputRef.current?.click()}
                        disabled={uploadingImg}
                        className="bg-white text-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium shadow hover:bg-slate-50 flex items-center gap-1"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Changer
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUrl(null)}
                        className="bg-white text-red-500 rounded-lg px-3 py-1.5 text-xs font-medium shadow hover:bg-red-50 flex items-center gap-1"
                      >
                        <X className="h-3.5 w-3.5" />
                        Retirer
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => imgInputRef.current?.click()}
                    disabled={uploadingImg}
                    className="flex flex-col items-center justify-center gap-2 w-full h-full text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                  >
                    {uploadingImg ? (
                      <Loader2 className="h-7 w-7 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-7 w-7" />
                        <span className="text-xs">Cliquer pour uploader (JPG, PNG, WEBP)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nom */}
            <div className="space-y-1.5">
              <Label>Produit <span className="text-red-500">*</span></Label>
              <Input
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              />
            </div>

            {/* Fournisseur + Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Fournisseur <span className="text-red-500">*</span></Label>
                <Input
                  value={form.fournisseur}
                  onChange={(e) => setForm((f) => ({ ...f, fournisseur: e.target.value }))}
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
                />
              </div>
              <div className="space-y-1.5">
                <Label>Frais de dédouanement (FCFA)</Label>
                <Input
                  type="number" min="0"
                  value={form.fraisDedouanement}
                  onChange={(e) => setForm((f) => ({ ...f, fraisDedouanement: e.target.value }))}
                />
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-slate-500">Prix de revient (achat + dédouanement)</span>
              <span className="font-bold text-slate-900 text-base">{formatMontant(coutTotalForm)}</span>
            </div>

            <div className="space-y-1.5">
              <Label>Prix de vente (FCFA)</Label>
              <Input
                type="number" min="0"
                value={form.prixVente}
                onChange={(e) => setForm((f) => ({ ...f, prixVente: e.target.value }))}
                placeholder="0 (optionnel)"
              />
              {form.prixVente && Number(form.prixVente) > 0 && coutTotalForm > 0 && (
                <p className="text-xs text-green-700 font-medium">
                  Marge : {formatMontant(Number(form.prixVente) - coutTotalForm)} ({Math.round(((Number(form.prixVente) - coutTotalForm) / Number(form.prixVente)) * 100)}%)
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ── Mode lecture ── */
        <>
          {/* Image + badge catégorie */}
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
            <div className="h-64 bg-slate-100 flex items-center justify-center overflow-hidden">
              {fiche.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fiche.imageUrl}
                  alt={fiche.nom}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="h-20 w-20 text-slate-300" />
              )}
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 mb-2">
                    {fiche.categorie}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900">{fiche.nom}</h2>
                </div>
              </div>
            </div>
          </div>

          {/* Fournisseur */}
          <Card>
            <CardContent className="pt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Fournisseur</p>
                <p className="font-semibold text-slate-900">{fiche.fournisseur}</p>
              </div>
              {fiche.contactFournisseur && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Contact fournisseur</p>
                  <p className="font-medium text-slate-700">{fiche.contactFournisseur}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coûts */}
          <Card>
            <CardContent className="pt-5 space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Prix d&apos;achat</span>
                <span className="font-medium text-slate-900">{formatMontant(Number(fiche.coutUnitaire))}</span>
              </div>
              {Number(fiche.fraisDedouanement) > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">+ Frais de dédouanement</span>
                  <span className="font-medium text-slate-900">{formatMontant(Number(fiche.fraisDedouanement))}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-800">Prix de revient</span>
                <span className="text-lg font-bold text-blue-700">{formatMontant(Number(fiche.coutTotal))}</span>
              </div>
              {fiche.prixVente != null && Number(fiche.prixVente) > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800">Prix de vente</span>
                    <span className="text-lg font-bold text-green-700">{formatMontant(Number(fiche.prixVente))}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Marge brute</span>
                    <span className="font-medium text-green-600">
                      {formatMontant(Number(fiche.prixVente) - Number(fiche.coutTotal))}
                      {" "}({Math.round(((Number(fiche.prixVente) - Number(fiche.coutTotal)) / Number(fiche.prixVente)) * 100)}%)
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-slate-400 text-right">
            Mise à jour : {formatDateTime(fiche.updatedAt)}
          </p>
        </>
      )}
    </div>
  )
}
