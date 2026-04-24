"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { RoleGate } from "@/components/shared/RoleGate"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDateTime } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Loader2, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type AuditLog = {
  id: string
  userId: string | null
  userEmail: string | null
  action: string
  entity: string
  entityId: string
  entityRef: string | null
  details: string | null
  createdAt: string
}

const ACTION_COLORS: Record<string, string> = {
  CREATE:   "bg-blue-100 text-blue-700",
  UPDATE:   "bg-amber-100 text-amber-700",
  DELETE:   "bg-red-100 text-red-700",
  CONFIRM:  "bg-green-100 text-green-700",
  VALIDATE: "bg-green-100 text-green-700",
  SIGN:     "bg-purple-100 text-purple-700",
  ACCEPT:   "bg-green-100 text-green-700",
  REFUSE:   "bg-red-100 text-red-700",
  SEND:     "bg-indigo-100 text-indigo-700",
  EXPORT:   "bg-slate-100 text-slate-700",
}

const ENTITY_LABELS: Record<string, string> = {
  DEVIS: "Devis",
  COMMANDE: "Commande",
  PAIEMENT: "Paiement",
  FACTURE: "Facture",
  LIVRAISON: "Livraison",
  DEPENSE: "Dépense",
  USER: "Utilisateur",
}

const ENTITIES = Object.keys(ENTITY_LABELS)

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterEntity, setFilterEntity] = useState("__all__")

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (filterEntity !== "__all__") params.set("entity", filterEntity)
      const res = await fetch(`/api/audit?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLogs(data.logs)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      toast.error("Impossible de charger les logs")
    } finally {
      setLoading(false)
    }
  }, [page, filterEntity])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return (
    <RoleGate
      roles={["MANAGER"]}
      fallback={<p className="text-slate-500 text-sm">Accès réservé aux managers.</p>}
    >
      <div className="space-y-6">
        <PageHeader
          title="Journal d'audit"
          description={`${total} événement${total !== 1 ? "s" : ""} enregistré${total !== 1 ? "s" : ""}`}
        >
          <Select value={filterEntity} onValueChange={(v) => { setFilterEntity(v ?? "__all__"); setPage(1) }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Tous les modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tous les modules</SelectItem>
              {ENTITIES.map((e) => (
                <SelectItem key={e} value={e}>{ENTITY_LABELS[e]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PageHeader>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Chargement…
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                <ShieldCheck className="h-8 w-8" />
                <p className="text-sm">Aucun événement enregistré</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Utilisateur</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Module</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Référence</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Détails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-5 py-2.5 text-xs text-slate-700">
                          {log.userEmail ?? <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-5 py-2.5">
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold", ACTION_COLORS[log.action] ?? "bg-slate-100 text-slate-700")}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-xs text-slate-600">
                          {ENTITY_LABELS[log.entity] ?? log.entity}
                        </td>
                        <td className="px-5 py-2.5 font-mono text-xs text-blue-700">
                          {log.entityRef ?? log.entityId.slice(0, 8)}
                        </td>
                        <td className="px-5 py-2.5 text-xs text-slate-500 max-w-xs truncate">
                          {log.details ?? <span className="text-slate-200">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <p className="text-slate-500 text-xs">Page {page} / {totalPages}</p>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  )
}
