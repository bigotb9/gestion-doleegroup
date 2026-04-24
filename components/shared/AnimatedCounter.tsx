"use client"

import { useEffect, useRef, useState } from "react"
import { animate } from "motion"

interface AnimatedCounterProps {
  value: number
  duration?: number
  formatter?: (n: number) => string
  className?: string
}

/**
 * Compteur animé qui s'incrémente depuis 0 jusqu'à `value` au montage.
 * Utilise motion/animate pour une interpolation fluide avec easing.
 */
export function AnimatedCounter({
  value,
  duration = 1.4,
  formatter = (n) => Math.round(n).toLocaleString("fr-FR"),
  className,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState("0")
  const nodeRef = useRef<HTMLSpanElement>(null)
  const prevValue = useRef(0)

  useEffect(() => {
    const from = prevValue.current
    prevValue.current = value

    const controls = animate(from, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(formatter(latest)),
    })

    return () => controls.stop()
  }, [value, duration, formatter])

  return (
    <span ref={nodeRef} className={className}>
      {display}
    </span>
  )
}

/**
 * Compteur pour montants en FCFA
 */
export function AnimatedMontant({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  return (
    <AnimatedCounter
      value={value}
      formatter={(n) => {
        const rounded = Math.round(n)
        if (rounded >= 1_000_000) return `${(rounded / 1_000_000).toFixed(1)} M FCFA`
        if (rounded >= 1_000) return `${(rounded / 1_000).toFixed(0)} k FCFA`
        return `${rounded.toLocaleString("fr-FR")} FCFA`
      }}
      className={className}
    />
  )
}
