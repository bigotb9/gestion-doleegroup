"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  // Pages à afficher : 2 autour de la page courante + première + dernière
  const pages: (number | "…")[] = []
  const range = new Set<number>()
  range.add(1)
  range.add(totalPages)
  for (let i = Math.max(2, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) range.add(i)
  const sorted = [...range].sort((a, b) => a - b)
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) pages.push("…")
    pages.push(sorted[i])
  }

  return (
    <div className={cn("flex items-center justify-between text-sm", className)}>
      <p className="text-xs text-slate-500">
        {from}–{to} sur {total} résultat{total !== 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" onClick={() => onPageChange(1)} disabled={page <= 1} className="h-7 w-7 p-0">
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="h-7 w-7 p-0">
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ell-${i}`} className="w-7 text-center text-slate-400 text-xs">…</span>
          ) : (
            <Button
              key={p}
              size="sm"
              variant={p === page ? "default" : "outline"}
              onClick={() => onPageChange(p)}
              className="h-7 w-7 p-0 text-xs"
            >
              {p}
            </Button>
          )
        )}
        <Button size="sm" variant="outline" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="h-7 w-7 p-0">
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => onPageChange(totalPages)} disabled={page >= totalPages} className="h-7 w-7 p-0">
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
