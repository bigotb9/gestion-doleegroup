"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Separator } from "@/components/ui/separator"
import { formatDate, formatDateTime, cn } from "@/lib/utils"
import {
  ArrowLeft,
  Loader2,
  Package,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import Link from "next/link"

type ArticleStock = {
  id: string
  reference: string
  nom: string
  description: string | null
  unite: string
  quantite: number
  quantiteMin: number
  surplusStock: number
  isLowStock: boolean
  createdAt: string
  updatedAt: string
}

type StockMouvement = {
  id: string
  type: "ENTREE" | "SORTIE"
  quantite: number
  quantiteAvant: number
  quantiteApres: number
  motif: string | null
  createdAt: string
}

export default function ArticleStockDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [article, setArticle] = useState<ArticleStock | null>(null)
  const [mouvements, setMouvements] = useState<StockMouvement[]>([])
  const [loading, setLoading] = useState(true)

  // Mouvement dialog state
  const [mouvementOpen, setMouvementOpen] = useState(false)
  const [mouvType, setMouvType] = useState<"ENTREE" | "SORTIE">("ENTREE")
  const [mouvQuantite, setMouvQuantite] = useState("")
  const [mouvMotif, setMouvMotif] = useState("")
  const [mouvSubmitting, setMouvSubmitting] = useState(false)

  const fetchArticle = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/stock/${id}`)
      if (!res.ok) throw new Error("Introuvable")
      const json = await res.json()
      setArticle(json.article ?? json)
      setMouvements(json.mouvements ?? [])
    } catch {
      toast.error("Impossible de charger l'article")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchArticle()
  }, [fetchArticle])

  async function handleMouvement() {
    if (!mouvQuantite) {
      toast.error("Veuillez saisir une quantité")
      return
    }
    setMouvSubmitting(true)
    try {
      const res = await fetch("/api/stock/mouvements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: id,
          type: mouvType,
          quantite: Number(mouvQuantite),
          motif: mouvMotif || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Erreur")
      }
      toast.success("Mouvement enregistré")
      setMouvementOpen(false)
      setMouvType("ENTREE")
      setMouvQuantite("")
      setMouvMotif("")
      fetchArticle()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement")
    } finally {
      setMouvSubmitting(false)
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

  if (!article) {
    return (
      <div className="text-center py-24 text-slate-500">
        Article introuvable.{" "}
        <Link href="/stock" className="text-blue-600 underline">
          Retour au stock
        </Link>
      </div>
    )
  }

  const isSurplus = article.surplusStock > 0 && article.quantite > article.surplusStock
  const isRupture = article.quantite <= 0

  return (
    <div className="space-y-6">
      <PageHeader title={article.nom} description={`Référence : ${article.reference}`}>
        <Link
          href="/stock"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background text-[0.8rem] font-medium h-7 px-2.5 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour
        </Link>

        <Dialog open={mouvementOpen} onOpenChange={setMouvementOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <ArrowUpDown className="h-4 w-4 mr-1.5" />
            Enregistrer mouvement
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Mouvement de stock — {article.nom}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Type de mouvement</Label>
                <Select
                  value={mouvType}
                  onValueChange={(v) => setMouvType((v ?? "ENTREE") as "ENTREE" | "SORTIE")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTREE">Entrée</SelectItem>
                    <SelectItem value="SORTIE">Sortie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Quantité</Label>
                <Input
                  type="number"
                  min="1"
                  value={mouvQuantite}
                  onChange={(e) => setMouvQuantite(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Motif (optionnel)</Label>
                <Textarea
                  value={mouvMotif}
                  onChange={(e) => setMouvMotif(e.target.value)}
                  placeholder="Raison du mouvement..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMouvementOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleMouvement} disabled={mouvSubmitting}>
                {mouvSubmitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Article info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500 mb-1">Quantité actuelle</p>
            <p
              className={cn(
                "text-4xl font-bold",
                isRupture ? "text-red-600" : isSurplus ? "text-blue-600" : "text-green-600"
              )}
            >
              {article.quantite}
            </p>
            <p className="text-sm text-slate-500 mt-1">{article.unite}(s)</p>
          </CardContent>
        </Card>
        <Card className={article.isLowStock ? "border-amber-300 bg-amber-50/40" : ""}>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500 mb-1">Seuil minimum</p>
            <p className={cn("text-4xl font-bold", article.isLowStock ? "text-amber-600" : "text-slate-700")}>
              {article.quantiteMin}
            </p>
            <p className="text-sm text-slate-500 mt-1">{article.isLowStock ? "⚠ Stock bas" : article.unite + "(s)"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500 mb-1">Surplus de stock</p>
            <p className="text-4xl font-bold text-slate-700">{article.surplusStock}</p>
            <p className="text-sm text-slate-500 mt-1">{article.unite}(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500 mb-1">Statut</p>
            <span
              className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold mt-1",
                isRupture
                  ? "bg-red-100 text-red-700"
                  : isSurplus
                  ? "bg-blue-100 text-blue-700"
                  : "bg-green-100 text-green-700"
              )}
            >
              {isRupture ? "RUPTURE" : isSurplus ? "SURPLUS" : "OK"}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Article details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Détails de l&apos;article
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Référence</p>
            <p className="font-mono font-semibold text-blue-700">{article.reference}</p>
          </div>
          <div>
            <p className="text-slate-500">Unité</p>
            <p className="font-medium capitalize">{article.unite}</p>
          </div>
          {article.description && (
            <div className="col-span-2">
              <p className="text-slate-500">Description</p>
              <p className="text-slate-700">{article.description}</p>
            </div>
          )}
          <div>
            <p className="text-slate-500">Créé le</p>
            <p>{formatDate(article.createdAt)}</p>
          </div>
          <div>
            <p className="text-slate-500">Dernière mise à jour</p>
            <p>{formatDateTime(article.updatedAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Movement history */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Historique des mouvements</h2>
        <Card>
          <CardContent className="p-0">
            {mouvements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                <ArrowUpDown className="h-6 w-6" />
                <p className="text-sm">Aucun mouvement enregistré</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Quantité
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Avant
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Après
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Motif
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {mouvements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 text-slate-500 text-xs">
                          {formatDateTime(m.createdAt)}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                              m.type === "ENTREE"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            )}
                          >
                            {m.type === "ENTREE" ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {m.type === "ENTREE" ? "Entrée" : "Sortie"}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right font-semibold">
                          {m.type === "ENTREE" ? "+" : "-"}{m.quantite}
                        </td>
                        <td className="px-6 py-3 text-right text-slate-500">{m.quantiteAvant}</td>
                        <td className="px-6 py-3 text-right font-medium text-slate-800">
                          {m.quantiteApres}
                        </td>
                        <td className="px-6 py-3 text-slate-500">
                          {m.motif ?? <span className="text-slate-300">—</span>}
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
  )
}
