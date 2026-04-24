"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { formatMontant, cn } from "@/lib/utils"
import { Plus, Search, Package, Loader2, ChevronRight, Pencil, Tag } from "lucide-react"

type ProduitRow = {
  id: string
  reference: string
  nom: string
  categorie: string | null
  prixUnitaireCFA: string | number
  isActive: boolean
}

export default function ProduitsPage() {
  const router = useRouter()
  const [produits, setProduits] = useState<ProduitRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [activeCategorie, setActiveCategorie] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const fetchProduits = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("all", "true")
      if (debouncedSearch) params.set("search", debouncedSearch)
      const res = await fetch(`/api/produits?${params.toString()}`)
      if (!res.ok) throw new Error()
      setProduits(await res.json())
    } catch {
      toast.error("Impossible de charger les produits")
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    fetchProduits()
  }, [fetchProduits])

  // Catégories uniques triées extraites des produits chargés
  const categories = [...new Set(produits.map((p) => p.categorie).filter(Boolean))].sort() as string[]

  // Produits filtrés par catégorie sélectionnée
  const displayed = activeCategorie
    ? produits.filter((p) => p.categorie === activeCategorie)
    : produits

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalogue des produits"
        description={`${produits.length} produit${produits.length !== 1 ? "s" : ""} au catalogue`}
      >
        <Link href="/parametres/produits/nouveau">
          <Button>
            <Plus className="h-4 w-4" />
            Nouveau produit
          </Button>
        </Link>
      </PageHeader>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Rechercher par nom ou référence..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filtre par catégorie */}
      {!loading && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <Tag className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <button
            onClick={() => setActiveCategorie(null)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              activeCategorie === null
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Toutes ({produits.length})
          </button>
          {categories.map((cat) => {
            const count = produits.filter((p) => p.categorie === cat).length
            return (
              <button
                key={cat}
                onClick={() => setActiveCategorie(activeCategorie === cat ? null : cat)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  activeCategorie === cat
                    ? "bg-green-700 text-white"
                    : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                )}
              >
                {cat} ({count})
              </button>
            )
          })}
          {produits.some((p) => !p.categorie) && (
            <button
              onClick={() => setActiveCategorie(activeCategorie === "__none__" ? null : "__none__")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                activeCategorie === "__none__"
                  ? "bg-slate-500 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              Sans catégorie ({produits.filter((p) => !p.categorie).length})
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Chargement...
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-3">
              <Package className="h-10 w-10" />
              <p className="text-sm">
                {activeCategorie ? "Aucun produit dans cette catégorie." : "Aucun produit trouvé."}
              </p>
              {!activeCategorie && (
                <Link href="/parametres/produits/nouveau">
                  <Button variant="outline" size="sm">
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter le premier produit
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Prix unitaire CFA
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayed.map((p, i) => {
                    // Afficher un séparateur de catégorie quand elle change (uniquement si pas de filtre actif)
                    const prevCat = i > 0 ? displayed[i - 1].categorie : undefined
                    const showCatHeader = !activeCategorie && p.categorie !== prevCat

                    return (
                      <React.Fragment key={p.id}>
                        {showCatHeader && (
                          <tr className="bg-slate-50">
                            <td colSpan={6} className="px-6 py-2">
                              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Tag className="h-3 w-3" />
                                {p.categorie ?? "Sans catégorie"}
                              </span>
                            </td>
                          </tr>
                        )}
                        <tr
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/parametres/produits/${p.id}`)}
                        >
                          <td className="px-6 py-3 font-mono text-xs text-slate-600">
                            {p.reference}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 h-7 w-7 rounded-md bg-green-50 flex items-center justify-center">
                                <Package className="h-4 w-4 text-green-600" />
                              </div>
                              <span className="font-medium text-slate-900">{p.nom}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            {p.categorie ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                {p.categorie}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-right font-medium text-slate-900">
                            {formatMontant(Number(p.prixUnitaireCFA))}
                          </td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                              {p.isActive ? "Actif" : "Inactif"}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/parametres/produits/${p.id}`)
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
