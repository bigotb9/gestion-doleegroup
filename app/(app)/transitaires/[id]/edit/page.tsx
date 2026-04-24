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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Loader2, Save } from "lucide-react"

type TransitaireData = {
  id: string
  nom: string
  pays: string
  contactNom: string | null
  contactEmail: string | null
  contactPhone: string | null
  notes: string | null
  isActive: boolean
}

export default function EditTransitairePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [nom, setNom] = useState("")
  const [pays, setPays] = useState("")
  const [contactNom, setContactNom] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [actif, setActif] = useState(true)

  const fetchTransitaire = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/transitaires/${id}`)
      if (!res.ok) throw new Error()
      const data: TransitaireData = await res.json()

      setNom(data.nom)
      setPays(data.pays)
      setContactNom(data.contactNom ?? "")
      setContactEmail(data.contactEmail ?? "")
      setContactPhone(data.contactPhone ?? "")
      setNotes(data.notes ?? "")
      setActif(data.isActive)
    } catch {
      toast.error("Impossible de charger le transitaire")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchTransitaire()
  }, [fetchTransitaire])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!nom.trim()) {
      toast.error("Le nom est obligatoire.")
      return
    }
    if (!pays.trim()) {
      toast.error("Le pays est obligatoire.")
      return
    }

    setSaving(true)
    try {
      const body = {
        nom: nom.trim(),
        pays: pays.trim(),
        contactNom: contactNom.trim() || null,
        contactEmail: contactEmail.trim() || null,
        contactPhone: contactPhone.trim() || null,
        notes: notes.trim() || null,
        isActive: actif,
      }

      const res = await fetch(`/api/transitaires/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Erreur lors de la mise à jour")
      }

      toast.success("Transitaire mis à jour avec succès !")
      router.push(`/transitaires/${id}`)
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
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Modifier le transitaire" description={nom}>
        <Link
          href={`/transitaires/${id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Infos principales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nom">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pays">
                Pays <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pays"
                value={pays}
                onChange={(e) => setPays(e.target.value)}
                required
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label>Statut</Label>
              <div className="flex gap-4">
                {([true, false] as const).map((v) => (
                  <label key={String(v)} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="actif"
                      checked={actif === v}
                      onChange={() => setActif(v)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-sm text-slate-700">{v ? "Actif" : "Inactif"}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="contactNom">Nom du contact</Label>
              <Input
                id="contactNom"
                value={contactNom}
                onChange={(e) => setContactNom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactEmail">Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactPhone">Téléphone</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </CardContent>
        </Card>

        <Separator />

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-6">
          <Link
            href={`/transitaires/${id}`}
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
