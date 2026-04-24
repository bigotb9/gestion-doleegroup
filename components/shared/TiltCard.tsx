"use client"

import { useRef } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "motion/react"
import { cn } from "@/lib/utils"

interface TiltCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  intensity?: number
  glare?: boolean
  onClick?: () => void
}

export function TiltCard({
  children,
  className,
  style,
  intensity = 10,
  glare = true,
  onClick,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springX = useSpring(mouseX, { stiffness: 300, damping: 30 })
  const springY = useSpring(mouseY, { stiffness: 300, damping: 30 })

  const rotateX = useTransform(springY, [-0.5, 0.5], [intensity, -intensity])
  const rotateY = useTransform(springX, [-0.5, 0.5], [-intensity, intensity])

  // Glare — always computed, only rendered when glare=true
  const glareBackground = useTransform(
    [springX, springY],
    ([x, y]) =>
      `radial-gradient(circle at ${((x as number) + 0.5) * 100}% ${((y as number) + 0.5) * 100}%, rgba(255,255,255,0.12) 0%, transparent 60%)`
  )

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  function onMouseLeave() {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={cn("relative", className)}
      style={{
        ...style,
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        transformPerspective: 800,
        cursor: onClick ? "pointer" : "default",
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      whileHover={{ scale: 1.015 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {children}

      {glare && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden"
          style={{ background: glareBackground, zIndex: 10 }}
        />
      )}
    </motion.div>
  )
}

export function Depth({ children, z = 20, className }: { children: React.ReactNode; z?: number; className?: string }) {
  return (
    <div
      className={className}
      style={{ transform: `translateZ(${z}px)`, transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  )
}
