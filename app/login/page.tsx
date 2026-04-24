"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { motion } from "motion/react"
import { Loader2, Mail, Lock, TrendingUp, Package, Users, FileText } from "lucide-react"

// ── Formes 3D CSS ─────────────────────────────────────────────────────────

function Shape3D({ type, size, top, left, delay, duration }: {
  type: "cube" | "diamond" | "ring" | "triangle"
  size: number
  top: string
  left: string
  delay: number
  duration: number
}) {
  const base: React.CSSProperties = {
    position: "absolute",
    top,
    left,
    width: size,
    height: size,
    transformStyle: "preserve-3d",
    animation: `float3d ${duration}s ease-in-out ${delay}s infinite`,
  }

  if (type === "ring") {
    return (
      <div style={base}>
        <div style={{
          width: "100%", height: "100%", borderRadius: "50%",
          border: `${size * 0.08}px solid rgba(212,175,55,0.25)`,
          boxShadow: "0 0 20px rgba(212,175,55,0.15), inset 0 0 20px rgba(212,175,55,0.05)",
          animation: `spin3d ${duration * 1.5}s linear ${delay}s infinite`,
        }} />
      </div>
    )
  }

  if (type === "diamond") {
    return (
      <div style={{ ...base, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: size * 0.7, height: size * 0.7,
          background: `linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))`,
          border: "1px solid rgba(212,175,55,0.3)",
          transform: "rotate(45deg)",
          backdropFilter: "blur(4px)",
          boxShadow: "0 4px 20px rgba(212,175,55,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
        }} />
      </div>
    )
  }

  if (type === "triangle") {
    return (
      <div style={base}>
        <svg viewBox="0 0 100 87" width={size} height={size * 0.87} style={{ overflow: "visible" }}>
          <polygon
            points="50,5 95,82 5,82"
            fill="none"
            stroke="rgba(212,175,55,0.2)"
            strokeWidth="1.5"
            filter="url(#glow)"
          />
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
        </svg>
      </div>
    )
  }

  // Cube wireframe
  return (
    <div style={{ ...base, perspective: "200px" }}>
      <div style={{
        width: "100%", height: "100%",
        border: "1px solid rgba(212,175,55,0.2)",
        background: "linear-gradient(135deg, rgba(212,175,55,0.07), rgba(22,22,107,0.15))",
        backdropFilter: "blur(6px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
        borderRadius: "4px",
        animation: `spin3d ${duration}s linear ${delay}s infinite`,
      }} />
    </div>
  )
}

// ── Stats ─────────────────────────────────────────────────────────────────

const STATS = [
  { label: "Commandes", value: "1 200+", icon: TrendingUp, color: "#D4AF37" },
  { label: "Clients", value: "340+", icon: Users, color: "#6ee7b7" },
  { label: "Articles", value: "5 000+", icon: Package, color: "#93c5fd" },
  { label: "Factures", value: "800+", icon: FileText, color: "#f9a8d4" },
]

const fu = (delay = 0) => ({
  initial: { opacity: 0, y: 20 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.55, delay, type: "tween" as const },
})

// ── Page ──────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await signIn("credentials", { email, password, redirect: false })
      if (result?.error) {
        toast.error("Email ou mot de passe incorrect")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ backgroundColor: "#060620" }}>

      {/* ── Panneau gauche : branding 3D ── */}
      <motion.div
        className="hidden lg:flex flex-col justify-between w-[52%] relative p-12 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0d0d50 0%, #080830 60%, #12124a 100%)" }}
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, type: "tween" }}
      >
        {/* Aurora background */}
        <div className="absolute inset-0 aurora-bg opacity-40" />

        {/* Grain texture */}
        <div className="absolute inset-0 grain" />

        {/* Grille dorée */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
          <defs><pattern id="g" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#D4AF37" strokeWidth="0.6" />
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#g)" />
        </svg>

        {/* Formes 3D flottantes */}
        <div className="absolute inset-0 overflow-hidden" style={{ perspective: "600px" }}>
          <Shape3D type="ring"     size={120} top="8%"  left="70%" delay={0}   duration={7} />
          <Shape3D type="cube"     size={60}  top="20%" left="15%" delay={1.5} duration={9} />
          <Shape3D type="diamond"  size={80}  top="55%" left="75%" delay={0.5} duration={8} />
          <Shape3D type="ring"     size={60}  top="70%" left="10%" delay={2}   duration={6} />
          <Shape3D type="triangle" size={100} top="35%" left="55%" delay={1}   duration={10} />
          <Shape3D type="cube"     size={40}  top="80%" left="60%" delay={3}   duration={7} />
          <Shape3D type="diamond"  size={50}  top="15%" left="40%" delay={2.5} duration={9} />
        </div>

        {/* Orbe glow central */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style={{
            width: "350px", height: "350px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)",
            animation: "pulse-glow 4s ease-in-out infinite",
          }} />
        </div>

        {/* Logo */}
        <motion.div {...fu(0.15)} className="relative z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Dolee Group" style={{ height: "54px", width: "auto", mixBlendMode: "screen" }} />
        </motion.div>

        {/* Contenu central */}
        <div className="relative z-10 space-y-10">
          <motion.div {...fu(0.28)} className="space-y-5">
            {/* Ligne déco */}
            <div className="flex items-center gap-3">
              <div className="h-px w-8 gold-line" />
              <p className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: "rgba(212,175,55,0.55)" }}>
                Plateforme commerciale
              </p>
            </div>

            {/* Titre 3D extrusion */}
            <h1 style={{
              fontSize: "44px", fontWeight: 800, lineHeight: "1.1",
              fontFamily: "var(--font-heading)",
              color: "#fff",
              textShadow: "2px 2px 0 rgba(212,175,55,0.15), 4px 4px 0 rgba(212,175,55,0.08), 0 8px 30px rgba(0,0,0,0.5)",
            }}>
              Gérez votre activité<br />
              <span className="glow-gold" style={{ color: "#D4AF37" }}>avec précision.</span>
            </h1>

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", lineHeight: "1.7", maxWidth: "360px" }}>
              CRM, devis, commandes, logistique, stock et facturation — tout en un seul endroit, conçu pour les équipes exigeantes.
            </p>
          </motion.div>

          {/* Stats grid */}
          <motion.div
            className="grid grid-cols-2 gap-3"
            initial="initial"
            animate="animate"
            variants={{ animate: { transition: { staggerChildren: 0.1, delayChildren: 0.5 } } }}
          >
            {STATS.map((stat) => (
              <motion.div
                key={stat.label}
                variants={{ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4, type: "tween" } } }}
                className="animated-border rounded-xl p-3.5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: stat.color, boxShadow: `0 0 8px ${stat.color}` }} />
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {stat.label}
                  </p>
                </div>
                <p className="kpi-number kpi-3d-white" style={{ fontSize: "26px", fontWeight: 800, color: "#fff" }}>
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <motion.p {...fu(0.7)} style={{ color: "rgba(255,255,255,0.15)", fontSize: "11px" }} className="relative z-10">
          © 2025 Dolee Group — Accès réservé
        </motion.p>
      </motion.div>

      {/* ── Panneau droit : formulaire ── */}
      <motion.div
        className="flex-1 flex items-center justify-center p-8 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0d0d50 0%, #060620 100%)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15, type: "tween" }}
      >
        {/* Orbe background */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{
            position: "absolute", top: "-100px", right: "-100px",
            width: "500px", height: "500px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 65%)",
          }} />
          <div style={{
            position: "absolute", bottom: "-80px", left: "-80px",
            width: "400px", height: "400px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(22,22,107,0.4) 0%, transparent 65%)",
          }} />
        </div>

        <div className="w-full max-w-[390px] relative z-10">
          {/* Mobile logo */}
          <motion.div {...fu(0.1)} className="flex flex-col items-center mb-8 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Dolee Group" style={{ height: "56px", width: "auto", mixBlendMode: "screen" }} />
          </motion.div>

          {/* Titre */}
          <motion.div {...fu(0.2)} className="mb-8">
            <h2 style={{
              color: "#fff", fontSize: "28px", fontWeight: 800,
              fontFamily: "var(--font-heading)", marginBottom: "8px",
              textShadow: "0 2px 20px rgba(22,22,107,0.5)",
            }}>
              Bon retour 👋
            </h2>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px", lineHeight: "1.5" }}>
              Connectez-vous à votre espace de travail
            </p>
          </motion.div>

          {/* Card glassmorphism premium */}
          <motion.div
            {...fu(0.32)}
            className="grain"
            style={{
              borderRadius: "24px",
              padding: "36px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(212,175,55,0.2)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.08)",
              backdropFilter: "blur(32px)",
              position: "relative",
            }}
          >
            {/* Ligne supérieure lumineuse */}
            <div style={{
              position: "absolute", top: 0, left: "12%", right: "12%", height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.7), transparent)",
              borderRadius: "4px",
            }} />

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "22px" }}>

              {/* Email */}
              <motion.div {...fu(0.4)}>
                <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" }}>
                  Adresse email
                </label>
                <div style={{ position: "relative" }}>
                  <Mail style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "15px", height: "15px", color: "rgba(212,175,55,0.5)" }} />
                  <input
                    type="email"
                    placeholder="vous@dolee-group.ci"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: "100%", paddingLeft: "44px", paddingRight: "16px", paddingTop: "13px", paddingBottom: "13px",
                      borderRadius: "14px", fontSize: "14px", color: "#fff", outline: "none", boxSizing: "border-box",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(212,175,55,0.15)",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(212,175,55,0.65)"
                      e.currentTarget.style.background = "rgba(255,255,255,0.09)"
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,175,55,0.07), 0 0 20px rgba(212,175,55,0.1)"
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(212,175,55,0.15)"
                      e.currentTarget.style.background = "rgba(255,255,255,0.06)"
                      e.currentTarget.style.boxShadow = "none"
                    }}
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div {...fu(0.47)}>
                <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" }}>
                  Mot de passe
                </label>
                <div style={{ position: "relative" }}>
                  <Lock style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "15px", height: "15px", color: "rgba(212,175,55,0.5)" }} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: "100%", paddingLeft: "44px", paddingRight: "16px", paddingTop: "13px", paddingBottom: "13px",
                      borderRadius: "14px", fontSize: "14px", color: "#fff", outline: "none", boxSizing: "border-box",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(212,175,55,0.15)",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(212,175,55,0.65)"
                      e.currentTarget.style.background = "rgba(255,255,255,0.09)"
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,175,55,0.07), 0 0 20px rgba(212,175,55,0.1)"
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(212,175,55,0.15)"
                      e.currentTarget.style.background = "rgba(255,255,255,0.06)"
                      e.currentTarget.style.boxShadow = "none"
                    }}
                  />
                </div>
              </motion.div>

              {/* Bouton */}
              <motion.div {...fu(0.54)}>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? {
                    scale: 1.02,
                    boxShadow: "0 8px 32px rgba(212,175,55,0.65), 0 0 0 1px rgba(212,175,55,0.3)",
                  } : {}}
                  whileTap={!loading ? { scale: 0.97 } : {}}
                  style={{
                    width: "100%", padding: "14px 0", borderRadius: "14px", border: "none",
                    background: loading
                      ? "rgba(212,175,55,0.35)"
                      : "linear-gradient(135deg, #D4AF37 0%, #c49b2a 50%, #D4AF37 100%)",
                    backgroundSize: "200% 100%",
                    color: "#16166B", fontWeight: 800, fontSize: "15px", letterSpacing: "0.02em",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 24px rgba(212,175,55,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    fontFamily: "var(--font-heading)",
                    transition: "background-position 0.5s",
                  }}
                >
                  {loading
                    ? <><Loader2 style={{ width: "17px", height: "17px", animation: "spin 1s linear infinite" }} /> Connexion…</>
                    : "Se connecter →"
                  }
                </motion.button>
              </motion.div>
            </form>
          </motion.div>

          <motion.p
            {...fu(0.62)}
            style={{ textAlign: "center", marginTop: "22px", fontSize: "11px", color: "rgba(255,255,255,0.15)" }}
          >
            Accès réservé aux membres de l&apos;équipe Dolee Group
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}
