"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { RoleGate } from "@/components/shared/RoleGate"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatDate, formatDateTime, formatMontant, cn } from "@/lib/utils"
import { PdfPreviewModal } from "@/components/shared/PdfPreviewModal"
import {
  ArrowLeft,
  Loader2,
  Receipt,
  ExternalLink,
  FileText,
  Building2,
  Banknote,
  FileCheck,
  Send,
  FileDown,
} from "lucide-react"
import Link from "next/link"

type Facture = {
  id: string
  numero: string
  type: string
  statut: string
  statutReglement: string | null
  montantHT: string | number
  montantTVA: string | number
  montantTTC: string | number
  dateEmission: string
  dateEcheance: string | null
  datePaiement: string | null
  fneFileUrl: string | null
  pdfUrl: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  commande: {
    id: string
    numero: string
    devise: string
    montantTotal: string | number
    dateCommande: string
    client: {
      id: string
      raisonSociale: string
      contactNom: string
      contactEmail: string | null
      contactPhone: string
      adresse: string | null
      ville: string | null
      pays: string
    }
    paiements: { montant: string | number }[]
  }
}

const STATUT_STYLES: Record<string, string> = {
  EN_ATTENTE: "bg-amber-100 text-amber-700",
  ENVOYEE: "bg-blue-100 text-blue-700",
  PAYEE: "bg-green-100 text-green-700",
  PARTIELLEMENT_PAYEE: "bg-indigo-100 text-indigo-700",
  EN_RETARD: "bg-red-100 text-red-700",
  ANNULEE: "bg-slate-100 text-slate-500",
}

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  ENVOYEE: "Envoyée",
  PAYEE: "Payée",
  PARTIELLEMENT_PAYEE: "Partiellement payée",
  EN_RETARD: "En retard",
  ANNULEE: "Annulée",
}

const REGLEMENT_STYLES: Record<string, string> = {
  PARTIEL: "bg-orange-100 text-orange-700",
  COMPLET: "bg-green-100 text-green-700",
}

const REGLEMENT_LABELS: Record<string, string> = {
  PARTIEL: "Règlement partiel",
  COMPLET: "Règlement complet",
}

export default function FactureDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [facture, setFacture] = useState<Facture | null>(null)
  const [loading, setLoading] = useState(true)
  const [markingEnvoyee, setMarkingEnvoyee] = useState(false)

  const fetchFacture = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/facturation/${id}`)
      if (!res.ok) throw new Error("Introuvable")
      const json = await res.json()
      setFacture(json.facture ?? json)
    } catch {
      toast.error("Impossible de charger la facture")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchFacture()
  }, [fetchFacture])

  async function handleMarkEnvoyee() {
    if (!facture) return
    setMarkingEnvoyee(true)
    try {
      const res = await fetch(`/api/facturation/${facture.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "ENVOYEE" }),
      })
      if (!res.ok) throw new Error()
      toast.success("Reçu marqué comme envoyé")
      fetchFacture()
    } catch {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setMarkingEnvoyee(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Chargement...
      </div>
    )
  }

  if (!facture) {
    return (
      <div className="text-center py-24 text-slate-500">
        Facture introuvable.{" "}
        <Link href="/facturation" className="text-blue-600 underline">
          Retour à la facturation
        </Link>
      </div>
    )
  }

  const totalConfirmed = facture.commande.paiements.reduce((s, p) => s + Number(p.montant), 0)
  const isRecuCaisse = facture.type === "RECU_CAISSE"

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={`Facture ${facture.numero}`}
        description={`Émise le ${formatDate(facture.dateEmission)}`}
      >
        <Link
          href="/facturation"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background text-[0.8rem] font-medium h-7 px-2.5 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour
        </Link>

        {/* Prévisualisation PDF reçu de caisse */}
        {isRecuCaisse && (
          <PdfPreviewModal
            url={`/api/facturation/${facture.id}/pdf`}
            title={`Reçu de caisse ${facture.numero}`}
            filename={`recu-${facture.numero}.pdf`}
            trigger={
              <button className="inline-flex items-center gap-1 rounded-lg border border-border bg-background text-[0.8rem] font-medium h-7 px-2.5 hover:bg-muted transition-colors">
                <FileDown className="h-3.5 w-3.5" />
                Reçu PDF
              </button>
            }
          />
        )}

        {facture.pdfUrl && (
          <a
            href={facture.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background text-[0.8rem] font-medium h-7 px-2.5 hover:bg-muted transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            PDF
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </PageHeader>

      {/* Type + Statut document + Statut règlement */}
      <div className="flex flex-wrap gap-3 items-center">
        {facture.type === "FNE" ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700">
            <FileCheck className="h-4 w-4" />
            Facture FNE
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800">
            <Banknote className="h-4 w-4" />
            Reçu de caisse
          </span>
        )}

        <span
          className={cn(
            "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
            STATUT_STYLES[facture.statut] ?? "bg-slate-100 text-slate-700"
          )}
        >
          {STATUT_LABELS[facture.statut] ?? facture.statut}
        </span>

        {facture.statutReglement && (
          <span
            className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
              REGLEMENT_STYLES[facture.statutReglement] ?? "bg-slate-100 text-slate-700"
            )}
          >
            {REGLEMENT_LABELS[facture.statutReglement] ?? facture.statutReglement}
          </span>
        )}

        {/* Bouton "Marquer comme envoyé" pour reçu de caisse en attente */}
        {isRecuCaisse && facture.statut === "EN_ATTENTE" && (
          <RoleGate roles={["MANAGER"]}>
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkEnvoyee}
              disabled={markingEnvoyee}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              {markingEnvoyee ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1.5" />
              )}
              Marquer comme envoyé
            </Button>
          </RoleGate>
        )}
      </div>

      {/* Montants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Montants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Montant HT</span>
            <span className="font-medium">{formatMontant(Number(facture.montantHT))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">TVA</span>
            <span className="font-medium">{formatMontant(Number(facture.montantTVA))}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span>Montant TTC</span>
            <span className="text-slate-900">{formatMontant(Number(facture.montantTTC))}</span>
          </div>
          {totalConfirmed > 0 && (
            <>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total paiements confirmés</span>
                <span className={cn(
                  "font-semibold",
                  totalConfirmed >= Number(facture.montantTTC) ? "text-green-700" : "text-orange-600"
                )}>
                  {formatMontant(totalConfirmed)}
                </span>
              </div>
              {totalConfirmed < Number(facture.montantTTC) && (
                <div className="flex justify-between text-sm">
                  <span className="text-red-500">Reste à payer</span>
                  <span className="font-semibold text-red-600">
                    {formatMontant(Number(facture.montantTTC) - totalConfirmed)}
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dates</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Date d&apos;émission</p>
            <p className="font-medium">{formatDate(facture.dateEmission)}</p>
          </div>
          {facture.dateEcheance && (
            <div>
              <p className="text-slate-500">Date d&apos;échéance</p>
              <p className="font-medium">{formatDate(facture.dateEcheance)}</p>
            </div>
          )}
          {facture.datePaiement && (
            <div>
              <p className="text-slate-500">Date de paiement</p>
              <p className="font-medium text-green-700">{formatDate(facture.datePaiement)}</p>
            </div>
          )}
          <div>
            <p className="text-slate-500">Dernière mise à jour</p>
            <p>{formatDateTime(facture.updatedAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Fichier FNE */}
      {facture.fneFileUrl && (
        <Card className="border-indigo-100 bg-indigo-50">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-800">
              <FileCheck className="h-5 w-5" />
              <span className="text-sm font-medium">Facture FNE uploadée</span>
            </div>
            <a
              href={facture.fneFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 text-indigo-700 bg-white text-[0.8rem] font-medium h-7 px-2.5 hover:bg-indigo-50 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ouvrir
            </a>
          </CardContent>
        </Card>
      )}

      {/* PDF custom */}
      {facture.pdfUrl && (
        <Card className="border-blue-100 bg-blue-50">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-800">
              <FileText className="h-5 w-5" />
              <span className="text-sm font-medium">Facture PDF disponible</span>
            </div>
            <a
              href={facture.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 text-blue-700 bg-white text-[0.8rem] font-medium h-7 px-2.5 hover:bg-blue-50 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ouvrir le PDF
            </a>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Commande associée */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Commande associée
        </h2>
        <Card>
          <CardContent className="pt-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Numéro de commande</p>
              <Link
                href={`/commandes/${facture.commande.id}`}
                className="font-mono font-semibold text-blue-700 hover:underline"
              >
                {facture.commande.numero}
              </Link>
            </div>
            <div>
              <p className="text-slate-500">Montant total commande</p>
              <p className="font-medium">
                {formatMontant(Number(facture.commande.montantTotal))}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Date de commande</p>
              <p>{formatDate(facture.commande.dateCommande)}</p>
            </div>
            <div>
              <p className="text-slate-500">Client</p>
              <Link
                href={`/crm/${facture.commande.client.id}`}
                className="font-medium text-blue-700 hover:underline"
              >
                {facture.commande.client.raisonSociale}
              </Link>
            </div>
            <div>
              <p className="text-slate-500">Contact</p>
              <p>{facture.commande.client.contactNom}</p>
              {facture.commande.client.contactEmail && (
                <p className="text-xs text-slate-400">{facture.commande.client.contactEmail}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">Téléphone</p>
              <p>{facture.commande.client.contactPhone}</p>
            </div>
            {(facture.commande.client.adresse || facture.commande.client.ville) && (
              <div className="col-span-2">
                <p className="text-slate-500">Adresse</p>
                <p>
                  {[
                    facture.commande.client.adresse,
                    facture.commande.client.ville,
                    facture.commande.client.pays,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
