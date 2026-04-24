"use client"

import { motion } from "motion/react"
import { staggerContainer, staggerItem } from "@/lib/motion"

// ── Conteneur avec stagger ────────────────────────────────────────────────
export function StaggerList({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      variants={{ ...staggerContainer, animate: { transition: { staggerChildren: 0.07, delayChildren: delay } } }}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── Enfant animé ─────────────────────────────────────────────────────────
export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  )
}

// ── Lignes de tableau avec stagger ───────────────────────────────────────
export function StaggerRows({ children }: { children: React.ReactNode }) {
  return (
    <motion.tbody
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.tbody>
  )
}

export function StaggerRow({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <motion.tr
      variants={staggerItem}
      className={className}
      onClick={onClick}
      whileHover={{ backgroundColor: "rgba(248, 250, 252, 0.8)" }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.tr>
  )
}
