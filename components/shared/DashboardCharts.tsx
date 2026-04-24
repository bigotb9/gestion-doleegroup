"use client"

import { useEffect, useState } from "react"
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMontant } from "@/lib/utils"
import { TrendingUp, TrendingDown, Percent } from "lucide-react"

type FinancierData = {
  caParMois: { mois: string; ca: number; depenses: number; marge: number }[]
  marges: { id: string; numero: string; client: string; ca: number; couts: number; marge: number | null; tauxMarge: number | null }[]
  depensesParType: { type: string; montant: number }[]
  recouvrement: { totalCA: number; totalEncaisse: number; tauxRecouvrement: number }
}

function fmtK(v: number) {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}k`
  return String(v)
}

const COLORS = ["#1e40af", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#be185d", "#65a30d"]

export function DashboardCharts() {
  const [data, setData] = useState<FinancierData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/financier")
      .then((r) => {
        if (!r.ok) return null
        return r.json()
      })
      .then((json) => { if (json && json.caParMois) setData(json) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
      Chargement des données financières…
    </div>
  )
  if (!data) return (
    <div className="h-32 flex items-center justify-center text-slate-400 text-sm bg-slate-50 rounded-2xl border border-slate-100">
      Analyse financière disponible pour les managers uniquement.
    </div>
  )

  const { caParMois, marges, depensesParType, recouvrement } = data

  return (
    <div className="space-y-6">
      {/* KPIs recouvrement */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">CA total (commandes livrées)</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{formatMontant(recouvrement.totalCA)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Total encaissé</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{formatMontant(recouvrement.totalEncaisse)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Taux de recouvrement</p>
                <p className={`text-2xl font-bold mt-1 ${recouvrement.tauxRecouvrement >= 80 ? "text-green-700" : recouvrement.tauxRecouvrement >= 50 ? "text-amber-600" : "text-red-600"}`}>
                  {recouvrement.tauxRecouvrement}%
                </p>
              </div>
              <Percent className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique CA vs Dépenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            CA encaissé vs Dépenses — 12 derniers mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={caParMois} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: "#64748b" }} width={52} />
              <Tooltip
                formatter={(v, name) => [formatMontant(Number(v ?? 0)), name === "ca" ? "CA encaissé" : name === "depenses" ? "Dépenses" : "Marge"]}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend formatter={(v) => v === "ca" ? "CA encaissé" : v === "depenses" ? "Dépenses" : "Marge nette"} />
              <Bar dataKey="ca" fill="#1e40af" radius={[3, 3, 0, 0]} />
              <Bar dataKey="depenses" fill="#dc2626" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Marge nette évolution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-green-600" />
            Marge nette mensuelle (CA − Dépenses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={caParMois} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="margeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: "#64748b" }} width={52} />
              <Tooltip formatter={(v) => [formatMontant(Number(v ?? 0)), "Marge nette"]} />
              <Area type="monotone" dataKey="marge" stroke="#16a34a" strokeWidth={2} fill="url(#margeGrad)" dot={{ r: 3, fill: "#16a34a" }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Marges par commande */}
      {marges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Marge brute par commande livrée</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">Commande</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">Client</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">CA</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">Coûts</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">Marge</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">Taux</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {marges.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-mono text-xs font-semibold text-blue-700">{m.numero}</td>
                      <td className="px-4 py-2.5 text-slate-700 text-xs">{m.client}</td>
                      <td className="px-4 py-2.5 text-right text-slate-800 font-medium text-xs">{formatMontant(m.ca)}</td>
                      <td className="px-4 py-2.5 text-right text-slate-600 text-xs">{formatMontant(m.couts)}</td>
                      <td className={`px-4 py-2.5 text-right font-semibold text-xs ${(m.marge ?? 0) >= 0 ? "text-green-700" : "text-red-600"}`}>
                        {formatMontant(m.marge ?? 0)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${(m.tauxMarge ?? 0) >= 30 ? "bg-green-100 text-green-700" : (m.tauxMarge ?? 0) >= 10 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
                          {m.tauxMarge}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {marges.length === 0 && (
                <p className="text-center py-8 text-xs text-slate-400">
                  Aucune donnée de coûts internes renseignée sur les commandes livrées.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Répartition des dépenses */}
      {depensesParType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition des dépenses par type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {depensesParType.map((d, i) => {
                const total = depensesParType.reduce((s, x) => s + x.montant, 0)
                const pct = total > 0 ? Math.round((d.montant / total) * 100) : 0
                return (
                  <div key={d.type} className="flex items-center gap-3 text-sm">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="flex-1 text-slate-700 truncate text-xs">{d.type}</span>
                    <span className="text-xs text-slate-500 w-12 text-right">{pct}%</span>
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 w-28 text-right">{formatMontant(d.montant)}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
