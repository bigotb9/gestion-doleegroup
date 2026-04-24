import { auth } from "@/auth"
import Link from "next/link"
import { PageHeader } from "@/components/layout/PageHeader"
import { getExchangeRates } from "@/lib/exchange-rates"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"
import {
  Users, ArrowRight, TrendingUp, Shield, Briefcase,
  Factory, Banknote, Activity, Lock,
} from "lucide-react"

export const metadata = { title: "Paramètres — Dolee Group" }

export default async function ParametresPage() {
  const session = await auth()
  const role = session?.user?.role as Role | undefined
  const isManager = role === "MANAGER"

  const rates = await getExchangeRates()
  const eurCfa = rates.EUR_CFA?.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) ?? "655.96"
  const usdCfa = rates.USD_CFA?.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) ?? "600"

  // Stats rapides
  const [usersCount, activeUsersCount] = isManager
    ? await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
      ])
    : [0, 0]

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" description="Configuration et administration de la plateforme" />

      {/* ── Section Administration (Manager seulement) ───────────────── */}
      {isManager && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
              <Shield className="h-4 w-4 text-amber-600" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
              Administration
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Utilisateurs */}
            <Link href="/parametres/utilisateurs" className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-8px_rgba(59,130,246,0.2)] hover:border-blue-200">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: "radial-gradient(80% 100% at 100% 0%, rgba(59,130,246,0.12) 0%, transparent 60%)" }} />
              <div className="relative flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">Utilisateurs</h3>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Comptes, rôles et permissions</p>
                  <div className="flex items-center gap-3 mt-3 text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />{activeUsersCount} actifs
                    </span>
                    <span className="text-slate-400">sur {usersCount}</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Journal d'audit */}
            <Link href="/parametres/audit" className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-8px_rgba(245,158,11,0.2)] hover:border-amber-200">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: "radial-gradient(80% 100% at 100% 0%, rgba(245,158,11,0.12) 0%, transparent 60%)" }} />
              <div className="relative flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Activity className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">Journal d&apos;audit</h3>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Traçabilité des actions</p>
                  <div className="mt-3 text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                      <Lock className="h-3 w-3" />Historique complet
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* ── Section Configuration ──────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
            <TrendingUp className="h-4 w-4 text-slate-600" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
            Configuration
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Taux de change — card premium */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Taux de change</h3>
                <p className="text-[11px] text-slate-500">Conversion automatique horaire</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="group relative overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 hover:border-blue-200 transition-colors">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">EUR → CFA</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{eurCfa}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">FCFA / 1 EUR</p>
              </div>
              <div className="group relative overflow-hidden rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 hover:border-emerald-200 transition-colors">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">USD → CFA</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{usdCfa}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">FCFA / 1 USD</p>
              </div>
            </div>
          </div>

          {/* Info modules — summary */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-sm">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Modules métiers</h3>
                <p className="text-[11px] text-slate-500">Domaines fonctionnels de la plateforme</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Briefcase, label: "Commercial", color: "bg-blue-50 text-blue-600" },
                { icon: Factory, label: "Opérations", color: "bg-purple-50 text-purple-600" },
                { icon: Banknote, label: "Finance", color: "bg-emerald-50 text-emerald-600" },
                { icon: Shield, label: "Administration", color: "bg-amber-50 text-amber-600" },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-2 rounded-lg bg-white border border-slate-100 p-2.5">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${m.color}`}>
                    <m.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-medium text-slate-700">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fallback pour non-managers */}
      {!isManager && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center">
          <Lock className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Administration réservée aux Managers</p>
          <p className="text-xs text-slate-400 mt-1">Contactez un administrateur pour toute modification.</p>
        </div>
      )}
    </div>
  )
}
