"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, Loader2, Trash2, ImageIcon, X, ZoomIn } from "lucide-react"
import { RoleGate } from "@/components/shared/RoleGate"

const CATEGORIES: { value: string; label: string }[] = [
  { value: "BAT", label: "BAT / Maquette" },
  { value: "PRODUIT_RECU", label: "Produit reçu" },
  { value: "RECONDITIONNE", label: "Reconditionné" },
  { value: "LIVRAISON", label: "Livraison" },
  { value: "AUTRE", label: "Autre" },
]

type Photo = {
  id: string
  url: string
  caption: string | null
  categorie: string
  createdAt: string
}

export function CommandeGallery({ commandeId }: { commandeId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState("")
  const [categorie, setCategorie] = useState("AUTRE")
  const [lightbox, setLightbox] = useState<Photo | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch(`/api/commandes/${commandeId}/photos`)
      if (!res.ok) throw new Error()
      setPhotos(await res.json())
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [commandeId])

  useEffect(() => { fetchPhotos() }, [fetchPhotos])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      if (caption.trim()) fd.append("caption", caption.trim())
      fd.append("categorie", categorie)
      const res = await fetch(`/api/commandes/${commandeId}/photos`, { method: "POST", body: fd })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Erreur")
      }
      toast.success("Photo ajoutée")
      setCaption("")
      setCategorie("AUTRE")
      fetchPhotos()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur upload")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function handleDelete(photoId: string) {
    try {
      const res = await fetch(`/api/commandes/${commandeId}/photos?photoId=${photoId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setPhotos((prev) => prev.filter((p) => p.id !== photoId))
      if (lightbox?.id === photoId) setLightbox(null)
      toast.success("Photo supprimée")
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  // Grouper par catégorie
  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    photos: photos.filter((p) => p.categorie === cat.value),
  })).filter((g) => g.photos.length > 0)

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <RoleGate roles={["MANAGER", "SECRETAIRE", "CHARGE_OPERATIONS"]}>
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ajouter une photo</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Select value={categorie} onValueChange={(v) => setCategorie(v ?? "AUTRE")}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Légende (optionnel)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="h-8 text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="h-8"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-1.5" />}
              {uploading ? "Upload…" : "Choisir un fichier"}
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </RoleGate>

      {/* Galerie */}
      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Chargement…
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
          <ImageIcon className="h-8 w-8" />
          <p className="text-xs">Aucune photo ajoutée à cette commande.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.value}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{group.label}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {group.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-square cursor-pointer"
                    onClick={() => setLightbox(photo)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={photo.caption ?? group.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <ZoomIn className="h-5 w-5 text-white drop-shadow" />
                    </div>
                    <RoleGate roles={["MANAGER", "SECRETAIRE"]}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDelete(photo.id) }}
                        className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </RoleGate>
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-2 py-1 truncate">
                        {photo.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden" style={{ maxHeight: "90vh" }}>
          <DialogHeader className="px-4 py-3 border-b border-slate-100 flex-row items-center justify-between">
            <DialogTitle className="text-sm">
              {lightbox?.caption ?? CATEGORIES.find((c) => c.value === lightbox?.categorie)?.label ?? "Photo"}
            </DialogTitle>
            <button onClick={() => setLightbox(null)} className="text-slate-400 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </DialogHeader>
          {lightbox && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightbox.url}
              alt={lightbox.caption ?? ""}
              className="w-full object-contain"
              style={{ maxHeight: "calc(90vh - 56px)" }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
