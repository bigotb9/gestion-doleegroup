import { cn } from "@/lib/utils"

// ── Bloc générique ────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton-shimmer rounded-md", className)} />
}

// ── Ligne de texte ────────────────────────────────────────────────────────
export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 && lines > 1 ? "w-3/4" : "w-full")}
        />
      ))}
    </div>
  )
}

// ── Carte KPI ────────────────────────────────────────────────────────────
export function SkeletonKPI() {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

// ── Ligne de tableau ─────────────────────────────────────────────────────
export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-slate-50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className={cn("h-4", i === 0 ? "w-28" : i === cols - 1 ? "w-16" : "w-full max-w-[120px]")} />
        </td>
      ))}
    </tr>
  )
}

// ── Table entière ────────────────────────────────────────────────────────
export function SkeletonTable({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} cols={cols} />
      ))}
    </tbody>
  )
}

// ── Carte produit ────────────────────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-sm">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-4 w-24 ml-auto" />
        </div>
      </div>
    </div>
  )
}

// ── Kanban card ──────────────────────────────────────────────────────────
export function SkeletonKanbanCard() {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-4 space-y-2 shadow-sm">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}
