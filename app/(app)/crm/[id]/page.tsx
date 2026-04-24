"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { formatDate, formatMontant, formatRelativeDate, initiales } from "@/lib/utils"
import { PROSPECT_STATUS_LABELS, SOURCE_PROSPECTS } from "@/lib/constants"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  Globe,
  MapPin,
  User,
  MessageSquarePlus,
  Loader2,
  FileText,
  ShoppingCart,
  MessageSquare,
  Clock,
  Plus,
  Trash2,
  Users,
} from "lucide-react"

type NoteItem = {
  id: string
  contenu: string
  createdAt: string
  user: { id: string; name: string }
}

type RelanceItem = {
  id: string
  dateRelance: string
  objet: string
  notes: string | null
  estFaite: boolean
  dateFaite: string | null
}

type DevisItem = {
  id: string
  numero: string
  status: string
  total: string | number
  dateEmission: string
}

type CommandeItem = {
  id: string
  numero: string
  status: string
  statusPaiement: string
  montantTotal: string | number
  dateCommande: string
  paiements: { montant: string | number }[]
}

type ContactItem = {
  id: string
  nom: string
  prenom: string | null
  poste: string | null
  email: string | null
  phone: string
  phone2: string | null
}

type ContactForm = {
  nom: string
  prenom: string
  poste: string
  email: string
  phone: string
  phone2: string
}

const CONTACT_FORM_EMPTY: ContactForm = { nom: "", prenom: "", poste: "", email: "", phone: "", phone2: "" }

type ClientDetail = {
  id: string
  raisonSociale: string
  status: string
  secteurActivite: string | null
  siteWeb: string | null
  contactNom: string
  contactPrenom: string | null
  contactPoste: string | null
  contactEmail: string | null
  contactPhone: string
  contactPhone2: string | null
  adresse: string | null
  ville: string | null
  pays: string
  sourceProspect: string | null
  priorite: number
  createdAt: string
  notes: NoteItem[]
  relances: RelanceItem[]
  devis: DevisItem[]
  commandes: CommandeItem[]
  contacts: ContactItem[]
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState("")
  const [savingNote, setSavingNote] = useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)

  // Contacts
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [contactForm, setContactForm] = useState<ContactForm>(CONTACT_FORM_EMPTY)
  const [savingContact, setSavingContact] = useState(false)
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null)

  const fetchClient = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/crm/${id}`)
      if (!res.ok) throw new Error("Client introuvable")
      setClient(await res.json())
    } catch {
      toast.error("Impossible de charger les données du client")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchClient()
  }, [fetchClient])

  async function handleAddNote() {
    if (!noteText.trim()) return

    setSavingNote(true)
    try {
      const res = await fetch(`/api/crm/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: noteText.trim() }),
      })
      if (!res.ok) throw new Error("Erreur")
      toast.success("Note ajoutée")
      setNoteText("")
      setNoteDialogOpen(false)
      fetchClient()
    } catch {
      toast.error("Impossible d'ajouter la note")
    } finally {
      setSavingNote(false)
    }
  }

  async function handleAddContact() {
    if (!contactForm.nom.trim()) { toast.error("Le nom est obligatoire"); return }
    if (!contactForm.phone.trim()) { toast.error("Le téléphone est obligatoire"); return }
    setSavingContact(true)
    try {
      const res = await fetch(`/api/crm/${id}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: contactForm.nom.trim(),
          prenom: contactForm.prenom.trim() || null,
          poste: contactForm.poste.trim() || null,
          email: contactForm.email.trim() || null,
          phone: contactForm.phone.trim(),
          phone2: contactForm.phone2.trim() || null,
        }),
      })
      if (!res.ok) throw new Error("Erreur")
      toast.success("Contact ajouté")
      setContactForm(CONTACT_FORM_EMPTY)
      setContactDialogOpen(false)
      fetchClient()
    } catch { toast.error("Impossible d'ajouter le contact") }
    finally { setSavingContact(false) }
  }

  async function handleDeleteContact(contactId: string) {
    setDeletingContactId(contactId)
    try {
      const res = await fetch(`/api/crm/${id}/contacts/${contactId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Contact supprimé")
      fetchClient()
    } catch { toast.error("Impossible de supprimer le contact") }
    finally { setDeletingContactId(null) }
  }

  const sourceLabel =
    SOURCE_PROSPECTS.find((s) => s.value === client?.sourceProspect)?.label ??
    client?.sourceProspect ??
    "—"

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Chargement...
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-500">Client introuvable.</p>
        <Link
          href="/crm"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au CRM
        </Link>
      </div>
    )
  }

  const statusLabel = PROSPECT_STATUS_LABELS[client.status as keyof typeof PROSPECT_STATUS_LABELS] ?? client.status

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.raisonSociale}
        description={statusLabel}
      >
        <div className="flex gap-2">
          <Link
            href="/crm"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            CRM
          </Link>
          <Link
            href={`/crm/${id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors"
          >
            <Edit className="h-4 w-4" />
            Modifier
          </Link>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column: client info */}
        <div className="xl:col-span-1 space-y-4">
          {/* Avatar + status */}
          <Card>
            <CardContent className="pt-6 pb-4">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
                  {initiales(client.raisonSociale)}
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900 text-lg">{client.raisonSociale}</h2>
                  {client.secteurActivite && (
                    <p className="text-sm text-slate-500">{client.secteurActivite}</p>
                  )}
                </div>
                <StatusBadge status={client.status} />
                <div className="flex gap-4 text-xs text-slate-500 mt-1">
                  <span>Priorité {client.priorite}</span>
                  <span>·</span>
                  <span>Depuis {formatDate(client.createdAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <User className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-slate-700">
                    {client.contactNom}
                    {client.contactPrenom ? ` ${client.contactPrenom}` : ""}
                  </p>
                  {client.contactPoste && (
                    <p className="text-xs text-slate-400">{client.contactPoste}</p>
                  )}
                </div>
              </div>

              {client.contactPhone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <a
                    href={`tel:${client.contactPhone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {client.contactPhone}
                  </a>
                </div>
              )}

              {client.contactPhone2 && (
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <a
                    href={`tel:${client.contactPhone2}`}
                    className="text-blue-600 hover:underline"
                  >
                    {client.contactPhone2}
                  </a>
                </div>
              )}

              {client.contactEmail && (
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <a
                    href={`mailto:${client.contactEmail}`}
                    className="text-blue-600 hover:underline truncate"
                  >
                    {client.contactEmail}
                  </a>
                </div>
              )}

              {client.siteWeb && (
                <div className="flex items-center gap-2.5">
                  <Globe className="h-4 w-4 text-slate-400 shrink-0" />
                  <a
                    href={client.siteWeb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    {client.siteWeb.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}

              {(client.ville || client.adresse) && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="text-slate-600">
                    {client.adresse && <p>{client.adresse}</p>}
                    <p>
                      {client.ville ? `${client.ville}, ` : ""}
                      {client.pays}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contacts supplémentaires */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Contacts
                </CardTitle>
                <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
                  <DialogTrigger
                    render={
                      <button className="inline-flex items-center gap-1 rounded-md border border-border bg-background text-xs font-medium h-6 px-2 hover:bg-muted transition-colors" />
                    }
                  >
                    <Plus className="h-3 w-3" />
                    Ajouter
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Nouveau contact</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Nom <span className="text-red-500">*</span></Label>
                        <Input value={contactForm.nom} onChange={(e) => setContactForm((f) => ({ ...f, nom: e.target.value }))} placeholder="KONE" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Prénom</Label>
                        <Input value={contactForm.prenom} onChange={(e) => setContactForm((f) => ({ ...f, prenom: e.target.value }))} placeholder="Awa" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Poste</Label>
                        <Input value={contactForm.poste} onChange={(e) => setContactForm((f) => ({ ...f, poste: e.target.value }))} placeholder="Directeur achats" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Email</Label>
                        <Input type="email" value={contactForm.email} onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))} placeholder="contact@..." />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Téléphone <span className="text-red-500">*</span></Label>
                        <Input type="tel" value={contactForm.phone} onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+225 07 00 00 00 00" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Téléphone 2</Label>
                        <Input type="tel" value={contactForm.phone2} onChange={(e) => setContactForm((f) => ({ ...f, phone2: e.target.value }))} placeholder="+225 05 00 00 00 00" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button type="button" onClick={() => { setContactDialogOpen(false); setContactForm(CONTACT_FORM_EMPTY) }}
                        className="inline-flex items-center justify-center rounded-lg border border-border bg-background text-sm font-medium h-8 px-3 hover:bg-muted transition-colors">
                        Annuler
                      </button>
                      <Button onClick={handleAddContact} disabled={savingContact}>
                        {savingContact ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
                        Enregistrer
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm pt-2">
              {client.contacts.length === 0 ? (
                <p className="text-xs text-slate-400 py-2 text-center">Aucun contact supplémentaire</p>
              ) : (
                client.contacts.map((c) => (
                  <div key={c.id} className="flex items-start justify-between gap-2 rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-xs">
                        {c.nom}{c.prenom ? ` ${c.prenom}` : ""}
                      </p>
                      {c.poste && <p className="text-xs text-slate-400">{c.poste}</p>}
                      <a href={`tel:${c.phone}`} className="text-xs text-blue-600 hover:underline">{c.phone}</a>
                      {c.email && <p className="text-xs text-slate-500 truncate">{c.email}</p>}
                    </div>
                    <button
                      onClick={() => handleDeleteContact(c.id)}
                      disabled={deletingContactId === c.id}
                      className="text-slate-300 hover:text-red-500 transition-colors shrink-0 mt-0.5"
                    >
                      {deletingContactId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Qualification */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Qualification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Source</span>
                <span className="text-slate-700 font-medium">{sourceLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Devis</span>
                <span className="text-slate-700 font-medium">{client.devis.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Commandes</span>
                <span className="text-slate-700 font-medium">{client.commandes.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: tabs */}
        <div className="xl:col-span-2 space-y-4">

          {/* ── Situation financière ── */}
          {client.commandes.length > 0 && (() => {
            const totalCmd = client.commandes
              .filter((c) => c.status !== "ANNULEE")
              .reduce((s, c) => s + Number(c.montantTotal ?? 0), 0)
            const totalPaye = client.commandes
              .reduce((s, c) => s + (c.paiements ?? []).reduce((ps, p) => ps + Number(p.montant ?? 0), 0), 0)
            const solde = Math.max(0, totalCmd - totalPaye)
            const pct = totalCmd > 0 && isFinite(totalPaye) ? Math.min(100, Math.round((totalPaye / totalCmd) * 100)) : 0
            return (
              <Card className={solde > 0 ? "border-red-200 bg-red-50/40" : "border-green-200 bg-green-50/30"}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-6 flex-wrap">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Commandes (hors annulées)</p>
                      <p className="text-lg font-bold text-slate-800">{formatMontant(totalCmd)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Total encaissé</p>
                      <p className="text-lg font-bold text-green-700">{formatMontant(totalPaye)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Solde en cours</p>
                      <p className={`text-lg font-bold ${solde > 0 ? "text-red-600" : "text-green-600"}`}>
                        {solde > 0 ? formatMontant(solde) : "Soldé ✓"}
                      </p>
                    </div>
                    <div className="flex-1 min-w-32">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">Recouvrement</span>
                        <span className="font-semibold">{pct}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })()}

          <Tabs defaultValue="activite">
            <TabsList className="w-full justify-start mb-4">
              <TabsTrigger value="activite" className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Activité
                {client.notes.length + client.relances.length > 0 && (
                  <span className="ml-1 rounded-full bg-slate-200 text-slate-600 text-xs px-1.5 py-0.5">
                    {client.notes.length + client.relances.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="devis" className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Devis
                {client.devis.length > 0 && (
                  <span className="ml-1 rounded-full bg-slate-200 text-slate-600 text-xs px-1.5 py-0.5">
                    {client.devis.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="commandes" className="flex items-center gap-1.5">
                <ShoppingCart className="h-3.5 w-3.5" />
                Commandes
                {client.commandes.length > 0 && (
                  <span className="ml-1 rounded-full bg-slate-200 text-slate-600 text-xs px-1.5 py-0.5">
                    {client.commandes.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Activité */}
            <TabsContent value="activite">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Journal d&apos;activité</CardTitle>
                    <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                      <DialogTrigger
                        render={
                          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-7 px-2.5 hover:bg-muted transition-colors" />
                        }
                      >
                        <MessageSquarePlus className="h-4 w-4" />
                        Ajouter une note
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Nouvelle note</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                          <Textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Saisissez votre note..."
                            rows={5}
                            className="resize-none"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setNoteDialogOpen(false)
                                setNoteText("")
                              }}
                              className="inline-flex items-center justify-center rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors"
                            >
                              Annuler
                            </button>
                            <Button onClick={handleAddNote} disabled={savingNote || !noteText.trim()}>
                              {savingNote ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                              ) : (
                                <Plus className="h-4 w-4 mr-1.5" />
                              )}
                              Enregistrer
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {client.notes.length === 0 && client.relances.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                      <MessageSquare className="h-8 w-8" />
                      <p className="text-sm">Aucune activité enregistrée</p>
                    </div>
                  ) : (
                    <ol className="relative border-l border-slate-200 space-y-6 pl-6">
                      {/* Notes */}
                      {client.notes.map((note) => (
                        <li key={note.id} className="relative">
                          <span className="absolute -left-[25px] flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 ring-4 ring-white">
                            <MessageSquare className="h-2.5 w-2.5 text-blue-600" />
                          </span>
                          <div className="bg-slate-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-medium text-slate-600">
                                {note.user.name}
                              </span>
                              <span className="text-xs text-slate-400">
                                {formatRelativeDate(note.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.contenu}</p>
                          </div>
                        </li>
                      ))}

                      {/* Relances */}
                      {client.relances.map((relance) => (
                        <li key={relance.id} className="relative">
                          <span className="absolute -left-[25px] flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 ring-4 ring-white">
                            <Clock className="h-2.5 w-2.5 text-amber-600" />
                          </span>
                          <div
                            className={`rounded-lg p-4 border ${
                              relance.estFaite
                                ? "bg-green-50 border-green-200"
                                : "bg-amber-50 border-amber-200"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-slate-700">
                                Relance : {relance.objet}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  relance.estFaite
                                    ? "bg-green-100 text-green-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {relance.estFaite ? "Effectuée" : "En attente"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              Prévue le {formatDate(relance.dateRelance)}
                              {relance.dateFaite && ` · Faite le ${formatDate(relance.dateFaite)}`}
                            </p>
                            {relance.notes && (
                              <p className="text-sm text-slate-600 mt-2">{relance.notes}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Devis */}
            <TabsContent value="devis">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Devis</CardTitle>
                    <Link
                      href={`/devis/nouveau?clientId=${client.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-7 px-2.5 transition-all hover:opacity-90"
                    >
                      <Plus className="h-4 w-4" />
                      Nouveau devis
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {client.devis.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                      <FileText className="h-8 w-8" />
                      <p className="text-sm">Aucun devis</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">N°</th>
                          <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Statut</th>
                          <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Montant</th>
                          <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {client.devis.map((d) => (
                          <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-3">
                              <Link
                                href={`/devis/${d.id}`}
                                className="font-mono text-xs text-blue-600 hover:underline"
                              >
                                {d.numero}
                              </Link>
                            </td>
                            <td className="px-6 py-3">
                              <StatusBadge status={d.status} />
                            </td>
                            <td className="px-6 py-3 text-right font-medium">
                              {formatMontant(Number(d.total))}
                            </td>
                            <td className="px-6 py-3 text-right text-slate-500 text-xs">
                              {formatDate(d.dateEmission)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Commandes */}
            <TabsContent value="commandes">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Commandes</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {client.commandes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                      <ShoppingCart className="h-8 w-8" />
                      <p className="text-sm">Aucune commande</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">N°</th>
                          <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Statut</th>
                          <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Montant</th>
                          <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {client.commandes.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-3">
                              <Link
                                href={`/commandes/${c.id}`}
                                className="font-mono text-xs text-blue-600 hover:underline"
                              >
                                {c.numero}
                              </Link>
                            </td>
                            <td className="px-6 py-3">
                              <StatusBadge status={c.status} />
                            </td>
                            <td className="px-6 py-3 text-right font-medium">
                              {formatMontant(Number(c.montantTotal))}
                            </td>
                            <td className="px-6 py-3 text-right text-slate-500 text-xs">
                              {formatDate(c.dateCommande)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

