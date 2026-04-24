"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { RoleGate } from "@/components/shared/RoleGate"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { PdfPreviewModal } from "@/components/shared/PdfPreviewModal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatMontant, currencySymbol } from "@/lib/utils"
import { DEVIS_STATUS_LABELS, CURRENCY_LABELS } from "@/lib/constants"
import { canDo } from "@/lib/permissions"
import {
  ArrowLeft,
  Edit,
  Loader2,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Send,
  CheckCircle,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  Building2,
  CreditCard,
} from "lucide-react"
type DevisStatus = "BROUILLON" | "EN_ATTENTE_VALIDATION" | "VALIDE" | "ENVOYE" | "ACCEPTE" | "REFUSE" | "EXPIRE"
type Currency = "EUR" | "USD" | "CFA"
type Role = "MANAGER" | "SECRETAIRE" | "CHARGE_OPERATIONS"

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

type LigneDetail = {
  id: string
  designation: string
  description: string | null
  quantite: number
  prixUnitaire: string | number
  remise: string | number
  remiseFixe: string | number
  total: string | number
  ordre: number
}

type DevisDetail = {
  id: string
  numero: string
  status: DevisStatus
  dateEmission: string
  dateValidite: string
  dateValidation: string | null
  sousTotal: string | number
  taxe: string | number
  total: string | number
  devise: Currency
  projet: string | null
  notes: string | null
  conditionsPaiement: string | null
  delaiLivraison: string | null
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
  createdBy: { id: string; name: string }
  validatedBy: { id: string; name: string } | null
  lignes: LigneDetail[]
  commande: { id: string; numero: string } | null
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export default function DevisDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session } = useSession()
  const role = session?.user?.role as Role | undefined

  const [devis, setDevis] = useState<DevisDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchDevis = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/devis/${id}`)
      if (!res.ok) throw new Error("Devis introuvable")
      setDevis(await res.json())
    } catch {
      toast.error("Impossible de charger le devis")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDevis()
  }, [fetchDevis])

  // ── Action helper ─────────────────────────────────────────
  async function runAction(endpoint: string, actionKey: string, successMsg: string) {
    setActionLoading(actionKey)
    try {
      const res = await fetch(`/api/devis/${id}/${endpoint}`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Une erreur est survenue")
      }
      toast.success(successMsg)
      fetchDevis()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setActionLoading(null)
    }
  }

  // ── Loading / not found ───────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Chargement...
      </div>
    )
  }

  if (!devis) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-500">Devis introuvable.</p>
        <Link
          href="/devis"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux devis
        </Link>
      </div>
    )
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isExpired =
    !["ACCEPTE", "REFUSE", "EXPIRE"].includes(devis.status) &&
    new Date(devis.dateValidite) < today

  const sym = currencySymbol(devis.devise)
  const paymentModeLabel = devis.conditionsPaiement ?? "—"

  const canEdit = devis.status === "BROUILLON" && canDo(role, "devis:edit")
  const canValidate =
    ["BROUILLON", "EN_ATTENTE_VALIDATION"].includes(devis.status) &&
    canDo(role, "devis:validate")
  const canSoumettre =
    devis.status === "BROUILLON" && role === "SECRETAIRE"
  const canSend =
    devis.status === "VALIDE" &&
    (canDo(role, "devis:send") || canDo(role, "devis:validate"))
  const canAccept = devis.status === "ENVOYE" && canDo(role, "devis:validate")
  const canRefuse = devis.status === "ENVOYE" && canDo(role, "devis:validate")

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <PageHeader
        title={`Facture proforma ${devis.numero}`}
        description={`${devis.client.raisonSociale} · ${DEVIS_STATUS_LABELS[devis.status]}`}
      >
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link
            href="/devis"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Factures proforma
          </Link>

          {/* PDF preview */}
          <PdfPreviewModal
            url={`/api/devis/${id}/pdf`}
            title={`Facture proforma ${devis?.numero ?? ""}`}
            filename={`proforma-${devis?.numero ?? "doc"}.pdf`}
            trigger={
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-1.5" />
                Voir le PDF
              </Button>
            }
          />

          {/* Edit: BROUILLON only */}
          {canEdit && (
            <Link
              href={`/devis/${id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors"
            >
              <Edit className="h-4 w-4" />
              Modifier
            </Link>
          )}

          {/* SECRETAIRE: soumettre à validation (BROUILLON → EN_ATTENTE_VALIDATION) */}
          {canSoumettre && !canValidate && (
            <ConfirmDialog
              trigger={
                <Button variant="outline" size="sm" disabled={actionLoading === "soumettre"}>
                  {actionLoading === "soumettre" ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-1.5" />
                  )}
                  Soumettre à validation
                </Button>
              }
              title="Soumettre le devis à validation"
              description="Le devis sera transmis au manager pour validation. Confirmez-vous ?"
              confirmLabel="Soumettre"
              onConfirm={() => runAction("soumettre", "soumettre", "Devis soumis à validation")}
            />
          )}

          {/* MANAGER: valider (BROUILLON ou EN_ATTENTE_VALIDATION) */}
          {canValidate && (
            <ConfirmDialog
              trigger={
                <Button size="sm" disabled={actionLoading === "valider"}>
                  {actionLoading === "valider" ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 mr-1.5" />
                  )}
                  Valider le devis
                </Button>
              }
              title="Valider le devis"
              description="Le devis passera au statut Validé. Confirmez-vous la validation ?"
              confirmLabel="Valider"
              onConfirm={() => runAction("valider", "valider", "Devis validé avec succès")}
            />
          )}

          {/* Marquer comme envoyé (VALIDE) */}
          {canSend && (
            <ConfirmDialog
              trigger={
                <Button size="sm" disabled={actionLoading === "envoyer"}>
                  {actionLoading === "envoyer" ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-1.5" />
                  )}
                  Marquer comme envoyé
                </Button>
              }
              title="Marquer le devis comme envoyé"
              description="Le statut passera à Envoyé, indiquant que le client a reçu le devis."
              confirmLabel="Confirmer"
              onConfirm={() => runAction("envoyer", "envoyer", "Devis marqué comme envoyé")}
            />
          )}

          {/* Accepter (ENVOYE, MANAGER only) */}
          {canAccept && (
            <ConfirmDialog
              trigger={
                <Button size="sm" disabled={actionLoading === "accepter"} className="bg-green-600 hover:bg-green-700">
                  {actionLoading === "accepter" ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                  )}
                  Accepter le devis
                </Button>
              }
              title="Accepter le devis"
              description="Le devis sera accepté et une commande sera créée automatiquement."
              confirmLabel="Accepter et créer la commande"
              onConfirm={() => runAction("accepter", "accepter", "Devis accepté — commande créée !")}
            />
          )}

          {/* Refuser (ENVOYE, MANAGER only) */}
          {canRefuse && (
            <ConfirmDialog
              trigger={
                <Button size="sm" variant="outline" disabled={actionLoading === "refuser"} className="border-red-300 text-red-600 hover:bg-red-50">
                  {actionLoading === "refuser" ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-1.5" />
                  )}
                  Refuser le devis
                </Button>
              }
              title="Refuser le devis"
              description="Le devis passera au statut Refusé. Cette action ne peut pas être annulée."
              confirmLabel="Confirmer le refus"
              onConfirm={() => runAction("refuser", "refuser", "Devis refusé")}
            />
          )}
        </div>
      </PageHeader>

      {/* ── Expired banner ──────────────────────────────── */}
      {isExpired && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            Ce devis a expiré le {formatDate(devis.dateValidite)}. Pensez à le renouveler si nécessaire.
          </p>
        </div>
      )}

      {/* ── Commande link banner ─────────────────────────── */}
      {devis.commande && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
          <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
          <p className="text-sm">
            Commande créée :{" "}
            <Link
              href={`/commandes/${devis.commande.id}`}
              className="font-mono font-semibold underline hover:no-underline"
            >
              {devis.commande.numero}
            </Link>
          </p>
        </div>
      )}

      {/* ── 2-column layout ─────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT: Details cards */}
        <div className="xl:col-span-1 space-y-4">
          {/* Status + meta */}
          <Card>
            <CardContent className="pt-5 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Statut</span>
                <StatusBadge status={devis.status} />
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Numéro
                  </span>
                  <span className="font-mono font-semibold text-slate-900">{devis.numero}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Émis le
                  </span>
                  <span className="text-slate-700">{formatDate(devis.dateEmission)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Valide jusqu&apos;au
                  </span>
                  <span className={isExpired ? "text-red-600 font-medium" : "text-slate-700"}>
                    {formatDate(devis.dateValidite)}
                  </span>
                </div>
                {devis.dateValidation && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Validé le
                    </span>
                    <span className="text-slate-700">{formatDate(devis.dateValidation)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Devise</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {CURRENCY_LABELS[devis.devise]}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <div className="flex items-start gap-2.5">
                <Building2 className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <Link
                    href={`/crm/${devis.client.id}`}
                    className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                  >
                    {devis.client.raisonSociale}
                  </Link>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <User className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-700">
                    {devis.client.contactNom}
                    {devis.client.contactPrenom ? ` ${devis.client.contactPrenom}` : ""}
                  </p>
                  {devis.client.contactPoste && (
                    <p className="text-xs text-slate-400">{devis.client.contactPoste}</p>
                  )}
                </div>
              </div>
              {devis.client.contactPhone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <a
                    href={`tel:${devis.client.contactPhone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {devis.client.contactPhone}
                  </a>
                </div>
              )}
              {devis.client.contactEmail && (
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <a
                    href={`mailto:${devis.client.contactEmail}`}
                    className="text-blue-600 hover:underline truncate"
                  >
                    {devis.client.contactEmail}
                  </a>
                </div>
              )}
              {(devis.client.ville || devis.client.adresse) && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="text-slate-600 text-xs">
                    {devis.client.adresse && <p>{devis.client.adresse}</p>}
                    <p>
                      {devis.client.ville ? `${devis.client.ville}, ` : ""}
                      {devis.client.pays}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conditions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {devis.projet && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Projet</span>
                  <span className="text-slate-700 font-medium text-right">{devis.projet}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" />
                  Paiement
                </span>
                <span className="text-slate-700 font-medium text-right">{paymentModeLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Créé par</span>
                <span className="text-slate-700">{devis.createdBy.name}</span>
              </div>
              {devis.validatedBy && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Validé par</span>
                  <span className="text-slate-700">{devis.validatedBy.name}</span>
                </div>
              )}
              {devis.delaiLivraison && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Délai de livraison</span>
                  <span className="text-slate-700 font-medium">{devis.delaiLivraison}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Lignes table + totals + notes */}
        <div className="xl:col-span-2 space-y-4">
          {/* Lignes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Lignes de la facture proforma</CardTitle>
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
                        Remise %
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Remise fixe
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Total ({sym})
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[...devis.lignes]
                      .sort((a, b) => a.ordre - b.ordre)
                      .map((ligne) => (
                        <tr key={ligne.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-3">
                            <p className="font-medium text-slate-900">{ligne.designation}</p>
                            {ligne.description && (
                              <p className="text-xs text-slate-400 mt-0.5">{ligne.description}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-700">
                            {ligne.quantite}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700 font-mono text-xs">
                            {formatMontant(Number(ligne.prixUnitaire), devis.devise)}
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
                          <td className="px-4 py-3 text-center">
                            {Number(ligne.remiseFixe) > 0 ? (
                              <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">
                                -{formatMontant(Number(ligne.remiseFixe), devis.devise)}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-right font-semibold text-slate-900">
                            {formatMontant(Number(ligne.total), devis.devise)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Totals footer */}
              <div className="border-t border-slate-100 px-6 py-4">
                <div className="flex justify-end">
                  <div className="w-full max-w-xs space-y-2 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>Sous-total</span>
                      <span>{formatMontant(Number(devis.sousTotal), devis.devise)}</span>
                    </div>
                    {Number(devis.taxe) > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Taxe</span>
                        <span>{formatMontant(Number(devis.taxe), devis.devise)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-slate-900 text-base">
                      <span>Total TTC</span>
                      <span>{formatMontant(Number(devis.total), devis.devise)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {devis.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {devis.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Régime Fiscal */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span className="font-semibold text-slate-700">Régime Fiscal : </span>
            Taxe d&apos;État de l&apos;Entreprenant (TEE)
          </div>
        </div>
      </div>
    </div>
  )
}
