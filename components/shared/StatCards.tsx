"use client"

import { motion } from "motion/react"
import { AnimatedCounter, AnimatedMontant } from "./AnimatedCounter"
import { staggerContainer, staggerItem } from "@/lib/motion"
import type { LucideIcon } from "lucide-react"

export interface StatCardDef {
  label: string
  value: number
  icon: LucideIcon
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info"
  isMontant?: boolean
  devise?: "EUR" | "USD" | "CFA"
  hint?: string
}

const VARIANT_STYLES = {
  default: { iconBg: "bg-slate-100", iconColor: "text-slate-600", accent: "rgba(100,116,139,0.3)" },
  primary: { iconBg: "bg-blue-50", iconColor: "text-blue-600", accent: "rgba(37,99,235,0.25)" },
  success: { iconBg: "bg-emerald-50", iconColor: "text-emerald-600", accent: "rgba(16,185,129,0.25)" },
  warning: { iconBg: "bg-amber-50", iconColor: "text-amber-600", accent: "rgba(245,158,11,0.25)" },
  danger: { iconBg: "bg-red-50", iconColor: "text-red-600", accent: "rgba(239,68,68,0.25)" },
  info: { iconBg: "bg-indigo-50", iconColor: "text-indigo-600", accent: "rgba(99,102,241,0.25)" },
} as const

export function StatCards({ cards }: { cards: StatCardDef[] }) {
  return (
    <motion.div
      className={`grid grid-cols-2 ${cards.length >= 4 ? "sm:grid-cols-4" : cards.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3`}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {cards.map((card, i) => {
        const Icon = card.icon
        const v = VARIANT_STYLES[card.variant ?? "default"]
        return (
          <motion.div key={i} variants={staggerItem}>
            <div
              className="group relative rounded-2xl bg-white border border-slate-100 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.1)] hover:border-slate-200 cursor-default overflow-hidden"
              style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
            >
              {/* Gradient hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(80% 100% at 100% 0%, ${v.accent} 0%, transparent 60%)`,
                }}
              />
              <div className="relative flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${v.iconBg} ${v.iconColor} shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 truncate">
                    {card.label}
                  </p>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">
                    {card.isMontant ? (
                      <AnimatedMontant value={card.value} />
                    ) : (
                      <AnimatedCounter value={card.value} />
                    )}
                  </div>
                  {card.hint && (
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{card.hint}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
