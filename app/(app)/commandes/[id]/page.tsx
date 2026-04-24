"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { RoleGate } from "@/components/shared/RoleGate"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  DialogFooter,
} from "@/components/ui/dialog"
import { formatDate, formatDateTime, formatMontant, currencySymbol } from "@/lib/utils"
import {
  COMMANDE_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_MODES,
  CURRENCY_LABELS,
} from "@/lib/constants"
import { canDo } from "@/lib/permissions"
import { useRouter } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"
import { CommandeGallery } from "@/components/shared/CommandeGallery"
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  CreditCard,
  Factory,
  Truck,
  Home,
  PackageCheck,
  ShoppingCart,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  AlertTriangle,
  Plus,
  ShieldCheck,
  Pencil,
  Trash2,
  FileDown,
} from "lucide-react"

type CommandeStatus =
  | "EN_ATTENTE_CONFIRMATION"
  | "CONFIRMEE"
  | "EN_PRODUCTION"
  | "EN_LOGISTIQUE"
  | "EN_RECONDITIONNEMENT"
  | "PRETE_LIVRAISON"
  | "LIVREE"
  | "ANNULEE"

type PaymentStatus =
  | "EN_ATTENTE"
  | "AVANCE_RECUE"
  | "SOLDE_RECU"
  | "PAIEMENT_COMPLET"
  | "EN_RETARD"

type Currency = "EUR" | "USD" | "CFA"
type Role = "MANAGER" | "SECRETAIRE" | "CHARGE_OPERATIONS"

type Paiement = {
  id: string
  type: "AVANCE" | "SOLDE" | "COMPLET"
  montant: string | number
  dateReception: string
  modePaiement: string | null
  reference: string | null
  justificatifUrl: string | null
  isConfirmed: boolean
  dateConfirmation: string | null
  confirmedBy: { name: string } | null
  createdAt: string
}

type LigneDetail = {
  id: string
  designation: string
  description: string | null
  quantite: number
  prixUnitaire: string | number
  remise: string | number
  total: string | number
  ordre: number
  coutAchat: string | number | null
  fraisDedouanement: string | number | null
  fraisTransport: string | number | null
}

type CommandeDetail = {
  id: string
  numero: string
  status: CommandeStatus
  statusPaiement: PaymentStatus
  modePaiement: "AVANCE_SOLDE" | "BON_DE_COMMANDE"
  montantTotal: string | number
  montantAvance: string | number | null
  devise: Currency
  dateLivraisonSouhaitee: string | null
  notes: string | null
  createdAt: string
  client: {
    id: string
    raisonSociale: string
    contactNom: string
    contactPrenom: string | null
    contactPoste: string | null
    contactEmail: string | null
    contactPhone: string
    ville: string | null
    pays: string
    adresse: string | null
  }
  devis: { id: string; numero: string } | null
  createdBy?: { name: string } | null
  lignes: LigneDetail[]
  paiements: Paiement[]
  productions: { id: string; status: string }[]
  logistiques: { id: string; status: string; label: string | null }[]
  reconditionnements: { id: string; status: string; label: string | null }[]
  livraisons: { id: string; status: string }[]
}

const PAIEMENT_TYPE_LABELS: Record<string, string> = {
  AVANCE: "Avance",
  SOLDE: "Solde",
  COMPLET: "Paiement complet",
}

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  EN_ATTENTE: "bg-slate-100 text-slate-700",
  AVANCE_RECUE: "bg-blue-100 text-blue-700",
  SOLDE_RECU: "bg-teal-100 text-teal-700",
  PAIEMENT_COMPLET: "bg-green-100 text-green-700",
  EN_RETARD: "bg-red-100 text-red-700",
}

const TABS = ["Détails", "Production", "Logistique", "Reconditionnement", "Livraison", "Photos"] as const
type Tab = (typeof TABS)[number]

export default function CommandeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const role = session?.user?.role as Role | undefined
  const isManager = role === "MANAGER"

  const [commande, setCommande] = useState<CommandeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>("Détails")

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editNotes, setEditNotes] = useState("")
  const [editMontantTotal, setEditMontantTotal] = useState<number | "">("")
  const [editMontantAvance, setEditMontantAvance] = useState<number | "">("")
  const [editDateLivraison, setEditDateLivraison] = useState("")
  const [editSaving, setEditSaving] = useState(false)

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Paiement dialog
  const [paiementOpen, setPaiementOpen] = useState(false)
  const [paiementType, setPaiementType] = useState<"AVANCE" | "SOLDE" | "COMPLET">("AVANCE")
  const [paiementMontant, setPaiementMontant] = useState<number | "">("")
  const [paiementDate, setPaiementDate] = useState(new Date().toISOString().split("T")[0])
  const [paiementMode, setPaiementMode] = useState("")
  const [paiementRef, setPaiementRef] = useState("")
  const [paiementFile, setPaiementFile] = useState<File | null>(null)
  const [paiementUploading, setPaiementUploading] = useState(false)
  const [paiementSaving, setPaiementSaving] = useState(false)

  const fetchCommande = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/commandes/${id}`)
      if (!res.ok) throw new Error("Commande introuvable")
      const data = await res.json()
      setCommande(data)
      // Recalcule le statut paiement si des paiements sont confirmés mais le statut est en attente
      const hasConfirmed = data.paiements?.some((p: { isConfirmed: boolean }) => p.isConfirmed)
      if (hasConfirmed && data.statusPaiement === "EN_ATTENTE") {
        fetch(`/api/commandes/${id}/recalculer-paiement`, { method: "POST" })
          .then(r => r.ok ? r.json() : null)
          .then(updated => { if (updated) setCommande(prev => prev ? { ...prev, statusPaiement: updated.statusPaiement } : prev) })
          .catch(() => null)
      }
    } catch {
      toast.error("Impossible de charger la commande")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchCommande()
  }, [fetchCommande])

  async function runAction(endpoint: string, actionKey: string, successMsg: string) {
    setActionLoading(actionKey)
    try {
      const res = await fetch(`/api/commandes/${id}/${endpoint}`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Une erreur est survenue")
      }
      toast.success(successMsg)
      fetchCommande()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setActionLoading(null)
    }
  }

  async function uploadJustificatif(file: File): Promise<string> {
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/paiements/upload-justificatif", { method: "POST", body: formData })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? "Erreur lors de l'upload du justificatif")
    }
    const { url } = await res.json()
    return url
  }

  async function handlePaiementSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!paiementMontant || paiementMontant <= 0) {
      toast.error("Le montant doit être supérieur à 0")
      return
    }
    setPaiementSaving(true)
    try {
      let justificatifUrl: string | undefined = undefined
      if (paiementFile) {
        setPaiementUploading(true)
        justificatifUrl = await uploadJustificatif(paiementFile)
        setPaiementUploading(false)
      }

      const res = await fetch("/api/paiements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commandeId: id,
          type: paiementType,
          montant: paiementMontant,
          dateReception: paiementDate,
          modePaiement: paiementMode || undefined,
          reference: paiementRef.trim() || undefined,
          justificatifUrl,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Erreur lors de l'enregistrement")
      }
      toast.success("Paiement enregistré avec succès")
      setPaiementOpen(false)
      setPaiementMontant("")
      setPaiementRef("")
      setPaiementFile(null)
      setPaiementMode("")
      fetchCommande()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setPaiementSaving(false)
    }
  }

  function openEdit() {
    if (!commande) return
    setEditNotes(commande.notes ?? "")
    setEditMontantTotal(Number(commande.montantTotal))
    setEditMontantAvance(commande.montantAvance ? Number(commande.montantAvance) : "")
    setEditDateLivraison(commande.dateLivraisonSouhaitee ? commande.dateLivraisonSouhaitee.split("T")[0] : "")
    setEditOpen(true)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setEditSaving(true)
    try {
      const res = await fetch(`/api/commandes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: editNotes || null,
          montantTotal: editMontantTotal || undefined,
          montantAvance: editMontantAvance || null,
          dateLivraisonSouhaitee: editDateLivraison || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Erreur")
      }
      toast.success("Commande mise à jour")
      setEditOpen(false)
      fetchCommande()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/commandes/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Erreur")
      }
      toast.success("Commande supprimée")
      router.push("/commandes")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression")
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  async function confirmerPaiement(paiementId: string) {
    try {
      const res = await fetch(`/api/paiements/${paiementId}/confirmer`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Erreur serveur")
      }
      toast.success("Paiement confirmé")
      fetchCommande()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de confirmer le paiement")
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

  if (!commande) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-500">Commande introuvable.</p>
        <Link
          href="/commandes"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux commandes
        </Link>
      </div>
    )
  }

  const sym = currencySymbol(commande.devise)
  const isFullyPaid = commande.statusPaiement === "PAIEMENT_COMPLET"
  const canConfirm = commande.status === "EN_ATTENTE_CONFIRMATION" && canDo(role, "commande:confirm")
  const canRecordPayment = !isFullyPaid && canDo(role, "paiement:record")

  const sousTotal = commande.lignes.reduce((acc, l) => acc + Number(l.total), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={commande.numero}
        description={`${commande.client.raisonSociale} · ${COMMANDE_STATUS_LABELS[commande.status]}`}
      >
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link
            href="/commandes"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Commandes
          </Link>

          {canConfirm && (
            <ConfirmDialog
              trigger={
                <Button size="sm" disabled={actionLoading === "confirmer"} className="bg-green-600 hover:bg-green-700">
                  {actionLoading === "confirmer" ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                  )}
                  Confirmer la commande
                </Button>
              }
              title="Confirmer la commande"
              description="La commande passera au statut Confirmée. Cette action lancera le processus de production."
              confirmLabel="Confirmer"
              onConfirm={() => runAction("confirmer", "confirmer", "Commande confirmée !")}
            />
          )}

          {canRecordPayment && (
            <RoleGate roles={["MANAGER", "SECRETAIRE"]}>
              <Button size="sm" variant="outline" onClick={() => setPaiementOpen(true)}>
                <CreditCard className="h-4 w-4 mr-1.5" />
                Enregistrer un paiement
              </Button>
            </RoleGate>
          )}

          {isManager && (
            <>
              <Button size="sm" variant="outline" onClick={openEdit}>
                <Pencil className="h-4 w-4 mr-1.5" />
                Modifier
              </Button>
              <a href={`/api/commandes/${id}/rapport-pdf`} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline">
                  <FileDown className="h-4 w-4 mr-1.5" />
                  Rapport PDF
                </Button>
              </a>
              {commande.status !== "LIVREE" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Supprimer
                </Button>
              )}
            </>
          )}
        </div>
      </PageHeader>

      {/* Status bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <StatusBadge status={commande.status} />
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[commande.statusPaiement]}`}
        >
          {PAYMENT_STATUS_LABELS[commande.statusPaiement]}
        </span>
        <span className="text-sm font-bold text-slate-900">
          {formatMontant(Number(commande.montantTotal), commande.devise)}
        </span>
        {commande.modePaiement === "AVANCE_SOLDE" && commande.montantAvance && (
          <span className="text-xs text-slate-500">
            Avance : {formatMontant(Number(commande.montantAvance), commande.devise)}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Détails" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left sidebar */}
          <div className="xl:col-span-1 space-y-4">
            {/* Commande info */}
            <Card>
              <CardContent className="pt-5 pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Statut</span>
                  <StatusBadge status={commande.status} />
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Numéro
                    </span>
                    <span className="font-mono font-semibold text-slate-900">{commande.numero}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Créée le
                    </span>
                    <span className="text-slate-700">{formatDate(commande.createdAt)}</span>
                  </div>
                  {commande.dateLivraisonSouhaitee && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5" />
                        Livraison souhaitée
                      </span>
                      <span className="text-slate-700">{formatDate(commande.dateLivraisonSouhaitee)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Mode paiement</span>
                    <Badge variant="outline" className="text-xs">
                      {commande.modePaiement === "AVANCE_SOLDE" ? "Avance+Solde" : "Bon de commande"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Devise</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {CURRENCY_LABELS[commande.devise]}
                    </Badge>
                  </div>
                  {commande.devis && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Devis lié</span>
                      <Link
                        href={`/devis/${commande.devis.id}`}
                        className="font-mono text-xs text-blue-600 hover:underline"
                      >
                        {commande.devis.numero}
                      </Link>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Créée par</span>
                    <span className="text-slate-700 text-xs">{commande.createdBy?.name ?? "—"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-sm">
                <div className="flex items-start gap-2.5">
                  <Building2 className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <Link
                    href={`/crm/${commande.client.id}`}
                    className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                  >
                    {commande.client.raisonSociale}
                  </Link>
                </div>
                <div className="flex items-start gap-2.5">
                  <User className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-slate-700">
                      {commande.client.contactNom}
                      {commande.client.contactPrenom ? ` ${commande.client.contactPrenom}` : ""}
                    </p>
                    {commande.client.contactPoste && (
                      <p className="text-xs text-slate-400">{commande.client.contactPoste}</p>
                    )}
                  </div>
                </div>
                {commande.client.contactPhone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <a href={`tel:${commande.client.contactPhone}`} className="text-blue-600 hover:underline">
                      {commande.client.contactPhone}
                    </a>
                  </div>
                )}
                {commande.client.contactEmail && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                    <a href={`mailto:${commande.client.contactEmail}`} className="text-blue-600 hover:underline truncate">
                      {commande.client.contactEmail}
                    </a>
                  </div>
                )}
                {(commande.client.ville || commande.client.adresse) && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <div className="text-slate-600 text-xs">
                      {commande.client.adresse && <p>{commande.client.adresse}</p>}
                      <p>
                        {commande.client.ville ? `${commande.client.ville}, ` : ""}
                        {commande.client.pays}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right main area */}
          <div className="xl:col-span-2 space-y-4">
            {/* Lignes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Lignes de commande</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Désignation
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Qté
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          P.U. ({sym})
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Remise
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Total ({sym})
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...commande.lignes]
                        .sort((a, b) => a.ordre - b.ordre)
                        .map((ligne) => {
                          const hasCouts =
                            Number(ligne.coutAchat) > 0 ||
                            Number(ligne.fraisDedouanement) > 0 ||
                            Number(ligne.fraisTransport) > 0
                          const coutUnitTotal =
                            Number(ligne.coutAchat ?? 0) +
                            Number(ligne.fraisDedouanement ?? 0) +
                            Number(ligne.fraisTransport ?? 0)
                          return (
                            <React.Fragment key={ligne.id}>
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-6 py-3">
                                  <p className="font-medium text-slate-900">{ligne.designation}</p>
                                  {ligne.description && (
                                    <p className="text-xs text-slate-400 mt-0.5">{ligne.description}</p>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center text-slate-700">{ligne.quantite}</td>
                                <td className="px-4 py-3 text-right text-slate-700 font-mono text-xs">
                                  {formatMontant(Number(ligne.prixUnitaire), commande.devise)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {Number(ligne.remise) > 0 ? (
                                    <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">
                                      -{Number(ligne.remise)}%
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 text-xs">—</span>
                                  )}
                                </td>
                                <td className="px-6 py-3 text-right font-semibold text-slate-900">
                                  {formatMontant(Number(ligne.total), commande.devise)}
                                </td>
                              </tr>
                              {hasCouts && (
                                <tr key={`${ligne.id}-couts`} className="bg-slate-50/70">
                                  <td colSpan={5} className="px-6 py-2">
                                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                                      <span className="font-medium text-slate-600 uppercase tracking-wide">Coûts internes :</span>
                                      {Number(ligne.coutAchat) > 0 && (
                                        <span>
                                          Achat : <span className="font-semibold text-slate-700">{formatMontant(Number(ligne.coutAchat), commande.devise)}/u</span>
                                        </span>
                                      )}
                                      {Number(ligne.fraisDedouanement) > 0 && (
                                        <span>
                                          Dédouanement : <span className="font-semibold text-slate-700">{formatMontant(Number(ligne.fraisDedouanement), commande.devise)}/u</span>
                                        </span>
                                      )}
                                      {Number(ligne.fraisTransport) > 0 && (
                                        <span>
                                          Transport : <span className="font-semibold text-slate-700">{formatMontant(Number(ligne.fraisTransport), commande.devise)}/u</span>
                                        </span>
                                      )}
                                      <span className="ml-auto font-semibold text-slate-700">
                                        Total coûts × {ligne.quantite} = {formatMontant(coutUnitTotal * ligne.quantite, commande.devise)}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-slate-100 px-6 py-4">
                  <div className="flex justify-end">
                    <div className="w-full max-w-xs space-y-2 text-sm">
                      <div className="flex justify-between text-slate-600">
                        <span>Sous-total</span>
                        <span>{formatMontant(sousTotal, commande.devise)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-slate-900 text-base">
                        <span>Total</span>
                        <span>{formatMontant(Number(commande.montantTotal), commande.devise)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Paiements timeline */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Paiements</CardTitle>
                {canRecordPayment && (
                  <RoleGate roles={["MANAGER", "SECRETAIRE"]}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPaiementOpen(true)}
                      className="gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Ajouter
                    </Button>
                  </RoleGate>
                )}
              </CardHeader>
              <CardContent>
                {commande.paiements.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-slate-400 gap-2">
                    <CreditCard className="h-8 w-8" />
                    <p className="text-sm">Aucun paiement enregistré</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {commande.paiements.map((p) => {
                      const modeLabel = PAYMENT_MODES.find((m) => m.value === p.modePaiement)?.label ?? p.modePaiement
                      return (
                        <div
                          key={p.id}
                          className={`flex items-start gap-4 rounded-lg border p-4 ${
                            p.isConfirmed ? "border-green-100 bg-green-50/30" : "border-slate-100 bg-slate-50/30"
                          }`}
                        >
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 ${
                            p.isConfirmed ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                          }`}>
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-900">
                                {formatMontant(Number(p.montant), commande.devise)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {PAIEMENT_TYPE_LABELS[p.type] ?? p.type}
                              </Badge>
                              {p.isConfirmed ? (
                                <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  Confirmé
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  En attente de confirmation
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-slate-500">
                              <span>Reçu le {formatDate(p.dateReception)}</span>
                              {modeLabel && <span>{modeLabel}</span>}
                              {p.reference && <span>Réf: {p.reference}</span>}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Enregistré le {formatDateTime(p.createdAt)}{p.confirmedBy ? ` · Confirmé par ${p.confirmedBy.name}` : ""}
                            </p>
                            {p.justificatifUrl && (
                              <a
                                href={p.justificatifUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline mt-0.5 block"
                              >
                                Voir le justificatif
                              </a>
                            )}
                          </div>
                          {!p.isConfirmed && (
                            <RoleGate roles={["MANAGER"]}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="shrink-0 text-green-700 border-green-200 hover:bg-green-50"
                                onClick={() => confirmerPaiement(p.id)}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                Confirmer
                              </Button>
                            </RoleGate>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {commande.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{commande.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Production tab */}
      {activeTab === "Production" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Production</h2>
            <Link
              href={`/commandes/${id}/production`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors"
            >
              <Factory className="h-4 w-4" />
              Gérer la production
            </Link>
          </div>
          {commande.productions.length > 0 ? (
            <div className="space-y-2">
              {commande.productions.map((prod) => (
                <Card key={prod.id}>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700 shrink-0">
                        <Factory className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Production en cours</p>
                        <StatusBadge status={prod.status as never} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12 gap-3 text-slate-400">
                <Factory className="h-10 w-10" />
                <p className="text-sm">Aucune production créée pour cette commande</p>
                <RoleGate roles={["MANAGER", "SECRETAIRE"]}>
                  <Link
                    href={`/commandes/${id}/production`}
                    className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors text-slate-600"
                  >
                    <Plus className="h-4 w-4" />
                    Créer la production
                  </Link>
                </RoleGate>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Logistique tab */}
      {activeTab === "Logistique" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Logistique</h2>
            <Link
              href={`/commandes/${id}/logistique`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors"
            >
              <Truck className="h-4 w-4" />
              Gérer la logistique
            </Link>
          </div>
          {commande.logistiques.length > 0 ? (
            <div className="space-y-2">
              {commande.logistiques.map((log) => (
                <Card key={log.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 shrink-0">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{log.label ?? "Logistique"}</p>
                        <StatusBadge status={log.status as never} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12 gap-3 text-slate-400">
                <Truck className="h-10 w-10" />
                <p className="text-sm">Aucune logistique créée pour cette commande</p>
                <RoleGate roles={["MANAGER", "CHARGE_OPERATIONS"]}>
                  <Link
                    href={`/commandes/${id}/logistique`}
                    className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors text-slate-600"
                  >
                    <Plus className="h-4 w-4" />
                    Créer la logistique
                  </Link>
                </RoleGate>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Reconditionnement tab */}
      {activeTab === "Reconditionnement" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Reconditionnement</h2>
            <Link
              href={`/commandes/${id}/reconditionnement`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors"
            >
              <PackageCheck className="h-4 w-4" />
              Gérer le reconditionnement
            </Link>
          </div>
          {commande.reconditionnements.length > 0 ? (
            <div className="space-y-2">
              {commande.reconditionnements.map((rec) => (
                <Card key={rec.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-orange-700 shrink-0">
                        <PackageCheck className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{rec.label ?? "Reconditionnement"}</p>
                        <StatusBadge status={rec.status as never} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12 gap-3 text-slate-400">
                <PackageCheck className="h-10 w-10" />
                <p className="text-sm">Aucun reconditionnement créé pour cette commande</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Livraison tab */}
      {activeTab === "Livraison" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Livraison</h2>
            <Link
              href={`/commandes/${id}/livraison`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors"
            >
              <Home className="h-4 w-4" />
              Gérer la livraison
            </Link>
          </div>
          {commande.livraisons.length > 0 ? (
            <div className="space-y-2">
              {commande.livraisons.map((liv) => (
                <Card key={liv.id}>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-100 text-lime-700 shrink-0">
                        <Home className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Livraison</p>
                        <StatusBadge status={liv.status as never} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12 gap-3 text-slate-400">
                <Home className="h-10 w-10" />
                <p className="text-sm">Aucune livraison planifiée pour cette commande</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Paiement Dialog */}
      <Dialog open={paiementOpen} onOpenChange={setPaiementOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePaiementSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pType">Type de paiement</Label>
              <Select
                value={paiementType}
                onValueChange={(v) => setPaiementType(v as "AVANCE" | "SOLDE" | "COMPLET")}
              >
                <SelectTrigger id="pType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVANCE">Avance</SelectItem>
                  <SelectItem value="SOLDE">Solde</SelectItem>
                  <SelectItem value="COMPLET">Paiement complet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pMontant">
                Montant ({sym}) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pMontant"
                type="number"
                min={0}
                step="0.01"
                placeholder="0"
                value={paiementMontant}
                onChange={(e) => setPaiementMontant(parseFloat(e.target.value) || "")}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pDate">Date de réception</Label>
              <Input
                id="pDate"
                type="date"
                value={paiementDate}
                onChange={(e) => setPaiementDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pMode">Mode de paiement</Label>
              <Select value={paiementMode} onValueChange={(v) => setPaiementMode(v ?? "")}>
                <SelectTrigger id="pMode">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pRef">Référence</Label>
              <Input
                id="pRef"
                placeholder="Numéro de transaction, chèque..."
                value={paiementRef}
                onChange={(e) => setPaiementRef(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pJustificatif">Justificatif (PDF)</Label>
              <Input
                id="pJustificatif"
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setPaiementFile(e.target.files?.[0] ?? null)}
              />
              {paiementFile && (
                <p className="text-xs text-slate-500 truncate">{paiementFile.name}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaiementOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={paiementSaving || paiementUploading}>
                {paiementUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Upload...
                  </>
                ) : paiementSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier la commande — {commande?.numero}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Montant total (FCFA)</Label>
                <Input
                  type="number"
                  value={editMontantTotal}
                  onChange={(e) => setEditMontantTotal(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Montant avance (FCFA)</Label>
                <Input
                  type="number"
                  value={editMontantAvance}
                  onChange={(e) => setEditMontantAvance(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Optionnel"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Date de livraison souhaitée</Label>
              <Input
                type="date"
                value={editDateLivraison}
                onChange={(e) => setEditDateLivraison(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes internes</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Notes sur la commande..."
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={editSaving}>
                Annuler
              </Button>
              <Button type="submit" disabled={editSaving}>
                {editSaving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Photos tab */}
      {activeTab === "Photos" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            Photos de commande
          </h2>
          <CommandeGallery commandeId={commande.id} />
        </div>
      )}

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={(o) => { if (!o) setDeleteOpen(false) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Supprimer la commande
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Vous allez supprimer la commande <span className="font-semibold font-mono">{commande?.numero}</span>.
            Cette action est irréversible et supprimera tous les paiements, lignes et données associées.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Annuler</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
