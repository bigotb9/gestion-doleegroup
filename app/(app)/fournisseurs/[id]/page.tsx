"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { RoleGate } from "@/components/shared/RoleGate"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatMontant } from "@/lib/utils"
import { CURRENCY_LABELS } from "@/lib/constants"
import {
  ArrowLeft,
  Loader2,
  Edit,
  Factory,
  Globe,
  Mail,
  Phone,
  User,
  Clock,
  Package,
  Calendar,
  ExternalLink,
} from "lucide-react"

type Currency = "EUR" | "USD" | "CFA"
type ProductionStatus = "EN_ATTENTE" | "EN_COURS" | "TERMINE"

type Production = {
  id: string
  status: ProductionStatus
  quantite: number
  coutTotal: string | number
  devise: Currency
  dateCommandeFournisseur: string | null
  dateFinProductionPrevue: string | null
  dateFinProductionReelle: string | null
  commande: { id: string; numero: string }
}

type FournisseurDetail = {
  id: string
  nom: string
  pays: string
  contactNom: string | null
  contactEmail: string | null
  contactPhone: string | null
  devise: Currency | null
  delaiProduction: number | null
  notes: string | null
  actif: boolean
  createdAt: string
  productions: Production[]
}

const STATUS_COLORS: Record<ProductionStatus, string> = {
  EN_ATTENTE: "bg-slate-100 text-slate-700",
  EN_COURS: "bg-purple-100 text-purple-700",
  TERMINE: "bg-green-100 text-green-700",
}

const STATUS_LABELS: Record<ProductionStatus, string> = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
}

export default function FournisseurDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [fournisseur, setFournisseur] = useState<FournisseurDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchFournisseur = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/fournisseurs/${id}`)
      if (!res.ok) throw new Error()
      setFournisseur(await res.json())
    } catch {
      toast.error("Impossible de charger le fournisseur")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchFournisseur()
  }, [fetchFournisseur])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Chargement...
      </div>
    )
  }

  if (!fournisseur) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-500">Fournisseur introuvable.</p>
        <Link
          href="/fournisseurs"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux fournisseurs
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={fournisseur.nom}
        description={fournisseur.pays}
      >
        <div className="flex items-center gap-2">
          <Link
            href="/fournisseurs"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-8 px-2.5 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Fournisseurs
          </Link>
          <RoleGate roles={["MANAGER", "SECRETAIRE"]}>
            <Link href={`/fournisseurs/${id}/edit`}>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Edit className="h-4 w-4" />
                Modifier
              </Button>
            </Link>
          </RoleGate>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: info */}
        <div className="xl:col-span-1 space-y-4">
          {/* Status + identity */}
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-700 text-base font-bold shrink-0">
                  {fournisseur.nom.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{fournisseur.nom}</p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      fournisseur.actif ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {fournisseur.actif ? "Actif" : "Inactif"}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2.5">
                  <Globe className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-slate-700">{fournisseur.pays}</span>
                </div>
                {fournisseur.contactNom && (
                  <div className="flex items-center gap-2.5">
                    <User className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="text-slate-700">{fournisseur.contactNom}</span>
                  </div>
                )}
                {fournisseur.contactEmail && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                    <a
                      href={`mailto:${fournisseur.contactEmail}`}
                      className="text-blue-600 hover:underline truncate"
                    >
                      {fournisseur.contactEmail}
                    </a>
                  </div>
                )}
                {fournisseur.contactPhone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <a
                      href={`tel:${fournisseur.contactPhone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {fournisseur.contactPhone}
                    </a>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                {fournisseur.devise && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Devise préférée</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {CURRENCY_LABELS[fournisseur.devise]}
                    </Badge>
                  </div>
                )}
                {fournisseur.delaiProduction && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Délai production
                    </span>
                    <span className="text-slate-700 font-medium">{fournisseur.delaiProduction} jours</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Ajouté le
                  </span>
                  <span className="text-slate-700">{formatDate(fournisseur.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" />
                    Productions
                  </span>
                  <span className="text-slate-700 font-semibold">{fournisseur.productions.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {fournisseur.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {fournisseur.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: productions */}
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Productions liées
                  {fournisseur.productions.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-slate-400">
                      ({fournisseur.productions.length})
                    </span>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {fournisseur.productions.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-3 text-slate-400">
                  <Factory className="h-8 w-8" />
                  <p className="text-sm">Aucune production liée à ce fournisseur</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Commande
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Qté
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Coût total
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Fin prévue
                        </th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {fournisseur.productions.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-3">
                            <Link
                              href={`/commandes/${p.commande.id}`}
                              className="font-mono text-xs font-semibold text-blue-700 hover:underline"
                            >
                              {p.commande.numero}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-700">{p.quantite}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            {formatMontant(Number(p.coutTotal), p.devise)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}
                            >
                              {STATUS_LABELS[p.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-xs">
                            {p.dateFinProductionPrevue ? formatDate(p.dateFinProductionPrevue) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/commandes/${p.commande.id}/production`}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              Voir
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
