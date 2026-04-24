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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Save } from "lucide-react"

export default function NouveauTransitairePage() {
  const router = useRouter()

  const [nom, setNom] = useState("")
  const [pays, setPays] = useState("")
  const [contactNom, setContactNom] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

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
        contactNom: contactNom.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      }

      const res = await fetch("/api/transitaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Erreur lors de la création")
      }

      const created = await res.json()
      toast.success("Transitaire créé avec succès !")
      router.push(`/transitaires/${created.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Nouveau transitaire" description="Ajoutez un transitaire à votre réseau">
        <Link
          href="/transitaires"
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
                placeholder="Ex: SDV, Bolloré Logistics..."
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
                placeholder="Ex: Côte d'Ivoire, Chine..."
                value={pays}
                onChange={(e) => setPays(e.target.value)}
                required
              />
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
                placeholder="Ex: Jean Kouassi"
                value={contactNom}
                onChange={(e) => setContactNom(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactEmail">Email</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="contact@transitaire.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactPhone">Téléphone</Label>
              <Input
                id="contactPhone"
                type="tel"
                placeholder="+225 ..."
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
              placeholder="Informations complémentaires sur ce transitaire..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-6">
          <Link
            href="/transitaires"
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
                Créer le transitaire
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
