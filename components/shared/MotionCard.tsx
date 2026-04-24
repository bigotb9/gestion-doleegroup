"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { staggerItem } from "@/lib/motion"

// ── Carte avec hover lift + shadow ───────────────────────────────────────
export function MotionCard({
  children,
  className,
  onClick,
  stagger = false,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  stagger?: boolean
}) {
  const base = (
    <motion.div
      className={cn("bg-white rounded-xl border border-slate-200 shadow-sm cursor-default", className)}
      whileHover={{ y: -3, boxShadow: "0 8px 30px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.04)" }}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {children}
    </motion.div>
  )

  if (stagger) {
    return <motion.div variants={staggerItem}>{base}</motion.div>
  }
  return base
}

// ── KPI Card premium ─────────────────────────────────────────────────────
export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-600",
  iconBg = "bg-blue-50",
  trend,
  href,
  children,
}: {
  title: string
  value: React.ReactNode
  subtitle?: string
  icon: React.ElementType
  iconColor?: string
  iconBg?: string
  trend?: { value: number; label: string }
  href?: string
  children?: React.ReactNode
}) {
  return (
    <motion.div
      className="relative bg-white rounded-2xl border border-slate-100 p-5 overflow-hidden"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05), 0 6px 24px rgba(0,0,0,0.04)" }}
      whileHover={{ y: -4, boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.06)" }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Subtle top accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5 gold-line opacity-60 rounded-t-2xl" />

      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{title}</p>
        <div className={cn("p-2 rounded-xl", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      </div>

      <div className="kpi-number text-3xl font-bold text-slate-900 mb-1">
        {value}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      )}

      {trend && (
        <div className={cn(
          "inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-semibold",
          trend.value >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
        )}>
          <span>{trend.value >= 0 ? "↑" : "↓"}</span>
          {Math.abs(trend.value)}% {trend.label}
        </div>
      )}

      {children}
    </motion.div>
  )
}
