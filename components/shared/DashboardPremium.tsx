"use client"

import Link from "next/link"
import { motion } from "motion/react"
import {
  AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts"
import { AnimatedCounter, AnimatedMontant } from "./AnimatedCounter"
import { TiltCard, Depth } from "./TiltCard"
import { StaggerList, StaggerItem, StaggerRows, StaggerRow } from "./StaggerList"
import { StatusBadge } from "./StatusBadge"
import { formatMontant, formatRelativeDate } from "@/lib/utils"
import { staggerContainer, staggerItem } from "@/lib/motion"
import {
  ShoppingCart, TrendingUp, Clock, FileText,
  Receipt, Banknote, TrendingDown, Landmark,
  Package, Truck, ArrowRight, AlertTriangle,
} from "lucide-react"

// ── Données de tendance simulées pour les sparklines ─────────────────────
function sparkData(base: number, variance = 0.3, pts = 12) {
  return Array.from({ length: pts }, (_, i) => ({
    v: Math.max(0, base * (0.7 + Math.random() * variance + i * 0.02)),
  }))
}

// ── Mini sparkline inline ─────────────────────────────────────────────────
function Sparkline({ data, color, height = 40 }: { data: { v: number }[]; color: string; height?: number }) {
  return (
    <div className="chart-glow" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#sg-${color.replace("#", "")})`}
            dot={false}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── KPI Hero 3D Tilt ─────────────────────────────────────────────────────

interface HeroKPIProps {
  commandesActives: number
  revenuMontant: number
  commandesEnAttente: number
}

export function DashboardHeroKPIs({ commandesActives, revenuMontant, commandesEnAttente }: HeroKPIProps) {
  const sparkCommandes = sparkData(commandesActives || 10, 0.4)
  const sparkRevenu    = sparkData(revenuMontant || 1_000_000, 0.35)
  const sparkAttente   = sparkData(commandesEnAttente || 3, 0.5)

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-3 gap-5"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* ── Commandes actives ── */}
      <motion.div variants={staggerItem}>
        <Link href="/commandes">
          <TiltCard intensity={8} className="h-full">
            <div
              className="relative rounded-2xl p-6 overflow-hidden grain"
              style={{
                background: "linear-gradient(145deg, #16166B 0%, #1a1a8a 60%, #0e0e50 100%)",
                boxShadow: "0 8px 32px rgba(22,22,107,0.35), 0 1px 0 rgba(255,255,255,0.08) inset",
                minHeight: "180px",
              }}
            >
              {/* Grille */}
              <svg className="absolute inset-0 w-full h-full opacity-[0.05]">
                <defs><pattern id="kg" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#D4AF37" strokeWidth="0.5" />
                </pattern></defs>
                <rect width="100%" height="100%" fill="url(#kg)" />
              </svg>
              {/* Orbe */}
              <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full" style={{
                background: "radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 65%)",
              }} />

              <Depth z={12} className="relative">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(212,175,55,0.65)" }}>
                    Commandes actives
                  </p>
                  <div className="p-2 rounded-xl" style={{ background: "rgba(212,175,55,0.15)" }}>
                    <ShoppingCart className="h-4 w-4" style={{ color: "#D4AF37" }} />
                  </div>
                </div>
                <div className="kpi-number kpi-3d-white text-white" style={{ fontSize: "52px", fontWeight: 800, lineHeight: "1" }}>
                  <AnimatedCounter value={commandesActives} />
                </div>
                <p className="text-xs mt-1 mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>commandes en cours</p>
                <Sparkline data={sparkCommandes} color="#D4AF37" />
              </Depth>
            </div>
          </TiltCard>
        </Link>
      </motion.div>

      {/* ── Revenu du mois ── */}
      <motion.div variants={staggerItem}>
        <Link href="/commandes">
          <TiltCard intensity={8} className="h-full">
            <div
              className="relative rounded-2xl p-6 overflow-hidden grain"
              style={{
                background: "linear-gradient(145deg, #064e3b 0%, #065f46 60%, #047857 100%)",
                boxShadow: "0 8px 32px rgba(6,78,59,0.4)",
                minHeight: "180px",
              }}
            >
              <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full" style={{
                background: "radial-gradient(circle, rgba(110,231,183,0.15) 0%, transparent 65%)",
              }} />
              <Depth z={12} className="relative">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300/70">
                    Revenu du mois
                  </p>
                  <div className="p-2 rounded-xl bg-white/15">
                    <TrendingUp className="h-4 w-4 text-emerald-200" />
                  </div>
                </div>
                <div className="kpi-number kpi-3d-white text-white" style={{ fontSize: "30px", fontWeight: 800, lineHeight: "1.1" }}>
                  <AnimatedMontant value={revenuMontant} />
                </div>
                <p className="text-xs mt-1 mb-4 text-emerald-300/50">paiements confirmés ce mois</p>
                <Sparkline data={sparkRevenu} color="#6ee7b7" />
              </Depth>
            </div>
          </TiltCard>
        </Link>
      </motion.div>

      {/* ── En attente ── */}
      <motion.div variants={staggerItem}>
        <Link href="/commandes?status=EN_ATTENTE_CONFIRMATION">
          <TiltCard intensity={8} className="h-full">
            <div
              className="relative rounded-2xl p-6 overflow-hidden grain"
              style={{
                background: commandesEnAttente > 0
                  ? "linear-gradient(145deg, #92400e 0%, #b45309 60%, #d97706 100%)"
                  : "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)",
                boxShadow: commandesEnAttente > 0
                  ? "0 8px 32px rgba(146,64,14,0.4)"
                  : "0 8px 32px rgba(0,0,0,0.3)",
                minHeight: "180px",
                border: commandesEnAttente > 0 ? "1px solid rgba(251,191,36,0.2)" : "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full" style={{
                background: commandesEnAttente > 0
                  ? "radial-gradient(circle, rgba(253,224,71,0.15) 0%, transparent 65%)"
                  : "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 65%)",
              }} />
              <Depth z={12} className="relative">
                <div className="flex items-start justify-between mb-3">
                  <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${commandesEnAttente > 0 ? "text-amber-200/70" : "text-slate-400"}`}>
                    En attente confirm.
                  </p>
                  <div className={`p-2 rounded-xl ${commandesEnAttente > 0 ? "bg-white/15" : "bg-slate-700"}`}>
                    <Clock className={`h-4 w-4 ${commandesEnAttente > 0 ? "text-amber-200" : "text-slate-400"}`} />
                  </div>
                </div>
                <div className={`kpi-number kpi-3d-white text-white`} style={{ fontSize: "52px", fontWeight: 800, lineHeight: "1" }}>
                  <AnimatedCounter value={commandesEnAttente} />
                </div>
                <p className={`text-xs mt-1 mb-4 ${commandesEnAttente > 0 ? "text-amber-200/50" : "text-slate-500"}`}>
                  {commandesEnAttente > 0 ? "confirmations requises ⚠" : "tout est à jour ✓"}
                </p>
                <Sparkline data={sparkAttente} color={commandesEnAttente > 0 ? "#fbbf24" : "#475569"} />
              </Depth>
            </div>
          </TiltCard>
        </Link>
      </motion.div>
    </motion.div>
  )
}

// ── KPI financiers secondaires ────────────────────────────────────────────

interface FinanceKPIsProps {
  totalFNEMontant: number
  totalCaisseMontant: number
  totalDepensesMontant: number
  impots: number
  devisAValider: number
}

export function DashboardFinanceKPIs({
  totalFNEMontant, totalCaisseMontant, totalDepensesMontant, impots, devisAValider
}: FinanceKPIsProps) {
  const items = [
    { label: "Devis à valider", value: devisAValider, isCount: true, icon: FileText, color: "#7c3aed", bg: "#ede9fe", spark: sparkData(devisAValider, 0.6) },
    { label: "Total FNE", value: totalFNEMontant, icon: Receipt, color: "#4f46e5", bg: "#e0e7ff", spark: sparkData(totalFNEMontant || 500000, 0.3) },
    { label: "Reçus de caisse", value: totalCaisseMontant, icon: Banknote, color: "#0d9488", bg: "#ccfbf1", spark: sparkData(totalCaisseMontant || 300000, 0.35) },
    { label: "Total dépenses", value: totalDepensesMontant, icon: TrendingDown, color: "#dc2626", bg: "#fee2e2", spark: sparkData(totalDepensesMontant || 200000, 0.4) },
    { label: "Impôts estimés", value: impots, icon: Landmark, color: "#ea580c", bg: "#ffedd5", spark: sparkData(impots || 50000, 0.25) },
  ]

  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {items.map((item) => (
        <motion.div key={item.label} variants={staggerItem}>
          <TiltCard intensity={5}>
            <motion.div
              className="rounded-xl p-4 bg-white border border-slate-100 overflow-hidden"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg" style={{ background: item.bg }}>
                  <item.icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                </div>
                <p className="text-[11px] font-semibold text-slate-500 leading-tight">{item.label}</p>
              </div>
              <div className="kpi-number font-bold text-slate-900 mb-2" style={{ fontSize: item.isCount ? "28px" : "15px" }}>
                {item.isCount
                  ? <AnimatedCounter value={item.value} />
                  : <AnimatedMontant value={item.value} />
                }
              </div>
              <Sparkline data={item.spark} color={item.color} height={32} />
            </motion.div>
          </TiltCard>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ── Donut pipeline commandes ──────────────────────────────────────────────

const PIPELINE_COLORS: Record<string, string> = {
  EN_ATTENTE_CONFIRMATION: "#f59e0b",
  CONFIRMEE:               "#3b82f6",
  EN_PRODUCTION:           "#8b5cf6",
  EN_LOGISTIQUE:           "#6366f1",
  EN_RECONDITIONNEMENT:    "#ec4899",
  PRETE_LIVRAISON:         "#10b981",
  LIVREE:                  "#059669",
  ANNULEE:                 "#6b7280",
}

const PIPELINE_LABELS: Record<string, string> = {
  EN_ATTENTE_CONFIRMATION: "En attente",
  CONFIRMEE:               "Confirmées",
  EN_PRODUCTION:           "Production",
  EN_LOGISTIQUE:           "Logistique",
  EN_RECONDITIONNEMENT:    "Recondit.",
  PRETE_LIVRAISON:         "Prête",
  LIVREE:                  "Livrées",
  ANNULEE:                 "Annulées",
}

export function DashboardPipeline({ byStatus }: { byStatus: Record<string, number> }) {
  const data = Object.entries(byStatus)
    .filter(([, v]) => v > 0)
    .map(([status, value]) => ({
      name: PIPELINE_LABELS[status] ?? status,
      value,
      color: PIPELINE_COLORS[status] ?? "#94a3b8",
    }))

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-4">Pipeline</p>
      <div className="flex items-center gap-5">
        {/* Donut */}
        <div className="shrink-0" style={{ width: 120, height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={36}
                outerRadius={54}
                paddingAngle={3}
                dataKey="value"
                animationBegin={200}
                animationDuration={1000}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [`${v} commandes`, ""]}
                contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Légende */}
        <div className="flex-1 space-y-1.5 min-w-0">
          {data.slice(0, 6).map((d) => (
            <div key={d.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="text-slate-600 truncate">{d.name}</span>
              </div>
              <span className="font-bold text-slate-800 ml-2 shrink-0">{d.value}</span>
            </div>
          ))}
          <div className="pt-1 border-t border-slate-100 flex justify-between text-xs">
            <span className="text-slate-400">Total</span>
            <span className="font-bold text-slate-800">{total}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Graphique CA mensuel compact ──────────────────────────────────────────

export function DashboardMiniChart({ data }: { data: { mois: string; ca: number; depenses: number }[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">CA vs Dépenses</p>
        <Link href="/dashboard" className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1">
          Détail <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={data.slice(-6)} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="2 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="mois" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            formatter={(v) => [formatMontant(Number(v)), ""]}
            contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: "11px" }}
          />
          <Bar dataKey="ca" fill="#D4AF37" radius={[3, 3, 0, 0]} maxBarSize={20} name="CA" />
          <Bar dataKey="depenses" fill="#fca5a5" radius={[3, 3, 0, 0]} maxBarSize={20} name="Dépenses" />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full bg-yellow-400" /><span className="text-[10px] text-slate-400">CA encaissé</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full bg-red-300" /><span className="text-[10px] text-slate-400">Dépenses</span></div>
      </div>
    </div>
  )
}

// ── Table commandes récentes avec stagger ─────────────────────────────────

interface RecentCmd {
  id: string; numero: string; status: string
  montantTotal: { toString(): string } | number
  createdAt: Date
  client: { id: string; raisonSociale: string }
}

export function DashboardRecentCommandes({ commandes }: { commandes: RecentCmd[] }) {
  if (commandes.length === 0) {
    return <p className="text-sm text-slate-400 px-6 py-6">Aucune commande récente.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">N°</th>
            <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Client</th>
            <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Statut</th>
            <th className="text-right px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Montant</th>
            <th className="text-right px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
          </tr>
        </thead>
        <StaggerRows>
          {commandes.map((cmd) => (
            <StaggerRow key={cmd.id} className="border-b border-slate-50 transition-colors">
              <td className="px-6 py-3">
                <Link href={`/commandes/${cmd.id}`} className="font-mono text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors">
                  {cmd.numero}
                </Link>
              </td>
              <td className="px-6 py-3 text-slate-700 text-sm">
                <Link href={`/crm/${cmd.client.id}`} className="hover:text-blue-600 transition-colors">{cmd.client.raisonSociale}</Link>
              </td>
              <td className="px-6 py-3"><StatusBadge status={cmd.status} /></td>
              <td className="px-6 py-3 text-right font-bold text-slate-900">{formatMontant(Number(cmd.montantTotal))}</td>
              <td className="px-6 py-3 text-right text-slate-400 text-xs">{formatRelativeDate(cmd.createdAt)}</td>
            </StaggerRow>
          ))}
        </StaggerRows>
      </table>
    </div>
  )
}

// ── Alertes stock animées ─────────────────────────────────────────────────

interface StockAlert { id: string; reference: string; nom: string; quantite: number; surplusStock: number }

export function DashboardStockAlerts({ alerts, commandesEnAttente }: { alerts: StockAlert[]; commandesEnAttente: number }) {
  return (
    <StaggerList className="space-y-2">
      {alerts.length === 0 ? (
        <StaggerItem>
          <div className="flex items-center gap-2 text-sm text-emerald-600 px-1">
            <Package className="h-4 w-4" />
            <span>Stock en ordre ✓</span>
          </div>
        </StaggerItem>
      ) : (
        alerts.map((a) => (
          <StaggerItem key={a.id}>
            <motion.div
              className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5"
              whileHover={{ x: 3, boxShadow: "2px 2px 12px rgba(245,158,11,0.15)" }}
              transition={{ duration: 0.15 }}
            >
              <div>
                <p className="text-xs font-bold text-slate-700">{a.nom}</p>
                <p className="text-[11px] text-slate-500 font-mono">{a.reference}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-amber-700">{a.quantite}/{a.surplusStock}</p>
                <p className="text-[10px] text-slate-400">stock / seuil</p>
              </div>
            </motion.div>
          </StaggerItem>
        ))
      )}
      {commandesEnAttente > 0 && (
        <StaggerItem>
          <Link href="/commandes?status=EN_ATTENTE_CONFIRMATION">
            <motion.div
              className="flex items-center justify-between rounded-xl bg-red-50 border border-red-100 px-3 py-2.5"
              whileHover={{ x: 3 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-500" />
                <p className="text-xs font-bold text-red-700">
                  {commandesEnAttente} commande{commandesEnAttente > 1 ? "s" : ""} en attente
                </p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-red-400" />
            </motion.div>
          </Link>
        </StaggerItem>
      )}
    </StaggerList>
  )
}
