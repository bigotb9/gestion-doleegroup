"use client"

import { useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { RoleGate } from "@/components/shared/RoleGate"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Loader2, ShoppingCart, TrendingDown, Package, Receipt } from "lucide-react"

const EXPORTS = [
  {
    type: "commandes",
    label: "Commandes",
    description: "Toutes les commandes avec paiements, statuts et montants",
    icon: ShoppingCart,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    type: "factures",
    label: "Factures",
    description: "FNE et reçus de caisse avec statuts de règlement",
    icon: Receipt,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
  },
  {
    type: "depenses",
    label: "Dépenses",
    description: "Toutes les dépenses par type, date et montant",
    icon: TrendingDown,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  {
    type: "stock",
    label: "Stock",
    description: "Articles en stock avec quantités et seuils",
    icon: Package,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
  },
]

export default function ExportPage() {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleExport(type: string) {
    setLoading(type)
    try {
      const res = await fetch(`/api/export?type=${type}`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const filename = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ?? `${type}.csv`
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Export ${type} téléchargé`)
    } catch {
      toast.error("Erreur lors de l'export")
    } finally {
      setLoading(null)
    }
  }

  return (
    <RoleGate
      roles={["MANAGER", "SECRETAIRE"]}
      fallback={<p className="text-slate-500 text-sm">Accès non autorisé.</p>}
    >
      <div className="space-y-6 max-w-2xl">
        <PageHeader
          title="Exports CSV"
          description="Téléchargez vos données en format CSV pour Excel ou votre comptabilité"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {EXPORTS.map((e) => (
            <Card
              key={e.type}
              className={`border ${e.border} hover:shadow-md transition-shadow cursor-pointer`}
              onClick={() => handleExport(e.type)}
            >
              <CardContent className="pt-5 flex items-start gap-4">
                <div className={`p-2.5 rounded-lg ${e.bg} shrink-0`}>
                  <e.icon className={`h-5 w-5 ${e.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{e.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{e.description}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loading === e.type}
                  className="shrink-0"
                  onClick={(ev) => { ev.stopPropagation(); handleExport(e.type) }}
                >
                  {loading === e.type ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-slate-400">
          Les fichiers CSV sont encodés en UTF-8 avec séparateur point-virgule (;), compatibles Excel et LibreOffice.
        </p>
      </div>
    </RoleGate>
  )
}
