import type { Variants, Transition } from "motion/react"

// ── Cubic bezier premium (typé comme tuple) ───────────────────────────────
const EASE = [0.23, 1, 0.32, 1] as [number, number, number, number]

// ── Variants partagés ─────────────────────────────────────────────────────

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
  exit:    { opacity: 0, y: -8 },
}

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25 } },
  exit:    { opacity: 0 },
}

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE } },
  exit:    { opacity: 0, x: -24 },
}

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: EASE } },
  exit:    { opacity: 0, scale: 0.97 },
}

/** Stagger parent */
export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

/** Enfant de stagger */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
}

/** Page transition */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
  exit:    { opacity: 0, y: -6 },
}

/** Spring configuration */
export const spring: Transition = { type: "spring", stiffness: 380, damping: 28 }
export const gentleSpring: Transition = { type: "spring", stiffness: 260, damping: 32 }
