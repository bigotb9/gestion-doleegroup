"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { motion } from "motion/react"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatCards } from "@/components/shared/StatCards"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { RoleGate } from "@/components/shared/RoleGate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { formatDate, cn } from "@/lib/utils"
import { staggerContainer, staggerItem } from "@/lib/motion"
import {
  Truck, Loader2, Plus, CheckCircle2, XCircle, Search,
  Calendar, Clock, MapPin, ChevronRight,
} from "lucide-react"

type LivraisonStatus = "PLANIFIEE" | "EN_COURS" | "LIVREE" | "ECHEC"

type Livraison = {
  id: string
  status: LivraisonStatus
  adresseLivraison: string
  contactLivraison: string | null
  datePrevue: string
  dateReelle: string | null
  signatureUrl: string | null
  nomSignataire: string | null
  notes: string | null
  commande: {
    id: string
    numero: string
  }
  client: {
    id: string
    raisonSociale: string
  }
  assignedTo: {
    id: string
    name: string
  } | null
}

type CommandeSelectOption = {
  id: string
  numero: string
  client: { raisonSociale: string }
}

type UserOption = {
  id: string
  name: string
}

type TabFilter = "ALL" | LivraisonStatus

const TABS: { label: string; value: TabFilter }[] = [
  { label: "Toutes", value: "ALL" },
  { label: "Planifiées", value: "PLANIFIEE" },
  { label: "En cours", value: "EN_COURS" },
  { label: "Livrées", value: "LIVREE" },
]

export default function LivraisonsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const userRole = session?.user?.role
  const userId = (session?.user as { id?: string } | undefined)?.id

  const [livraisons, setLivraisons] = useState<Livraison[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabFilter>("ALL")
  const [search, setSearch] = useState("")

  // Planifier dialog
  const [planifierOpen, setPlanifierOpen] = useState(false)
  const [commandes, setCommandes] = useState<CommandeSelectOption[]>([])
  const [chargesOps, setChargesOps] = useState<UserOption[]>([])
  const [formCommandeId, setFormCommandeId] = useState<string | null>(null)
  const [formAdresse, setFormAdresse] = useState("")
  const [formContact, setFormContact] = useState("")
  const [formDatePrevue, setFormDatePrevue] = useState("")
  const [formAssignedTo, setFormAssignedTo] = useState<string | null>(null)
  const [formNotes, setFormNotes] = useState("")
  const [formNbSignatures, setFormNbSignatures] = useState<1 | 2>(1)
  const [formSubmitting, setFormSubmitting] = useState(false)

  const fetchLivraisons = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab !== "ALL") params.set("status", activeTab)
      if (search) params.set("search", search)
      if (userRole === "CHARGE_OPERATIONS" && userId) {
        params.set("assignedToId", userId)
      }
      const res = await fetch(`/api/livraisons?${params.toString()}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setLivraisons(json.livraisons ?? json)
    } catch {
      toast.error("Impossible de charger les livraisons")
      setLivraisons([])
    } finally {
      setLoading(false)
    }
  }, [activeTab, search, userRole, userId])

  useEffect(() => {
    const timer = setTimeout(() => fetchLivraisons(), 300)
    return () => clearTimeout(timer)
  }, [fetchLivraisons])

  // KPI stats
  const stats = useMemo(() => {
    const planifiees = livraisons.filter((l) => l.status === "PLANIFIEE").length
    const enCours = livraisons.filter((l) => l.status === "EN_COURS").length
    const livrees = livraisons.filter((l) => l.status === "LIVREE").length
    const aujourdHui = livraisons.filter((l) => {
      const d = new Date(l.datePrevue)
      const now = new Date()
      return d.toDateString() === now.toDateString() && l.status !== "LIVREE"
    }).length
    return { planifiees, enCours, livrees, aujourdHui }
  }, [livraisons])

  async function fetchPlanifierData() {
    try {
      const [cmdRes, usersRes] = await Promise.all([
        fetch("/api/commandes?status=PRETE_LIVRAISON"),
        fetch("/api/utilisateurs?role=CHARGE_OPERATIONS"),
      ])
      if (cmdRes.ok) {
        const j = await cmdRes.json()
        setCommandes(j.commandes ?? j)
      }
      if (usersRes.ok) {
        const j = await usersRes.json()
        setChargesOps(j.utilisateurs ?? j)
      }
    } catch {
      // silent
    }
  }

  async function handlePlanifier() {
    if (!formCommandeId || !formAdresse || !formDatePrevue) {
      toast.error("Veuillez remplir les champs obligatoires")
      return
    }
    setFormSubmitting(true)
    try {
      const res = await fetch("/api/livraisons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commandeId: formCommandeId,
          adresseLivraison: formAdresse,
          contactLivraison: formContact || undefined,
          datePrevue: formDatePrevue,
          assignedToId: formAssignedTo || undefined,
          notes: formNotes || undefined,
          nombreSignaturesClient: formNbSignatures,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Erreur")
      }
      toast.success("Livraison planifiée")
      setPlanifierOpen(false)
      setFormCommandeId(null)
      setFormAdresse("")
      setFormContact("")
      setFormDatePrevue("")
      setFormAssignedTo(null)
      setFormNotes("")
      setFormNbSignatures(1)
      fetchLivraisons()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la planification")
    } finally {
      setFormSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Livraisons"
        description="Suivi des livraisons"
      >
        <RoleGate roles={["MANAGER", "SECRETAIRE"]}>
          <Dialog
            modal={false}
            open={planifierOpen}
            onOpenChange={(open) => {
              setPlanifierOpen(open)
              if (open) fetchPlanifierData()
            }}
          >
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="h-4 w-4 mr-1.5" />
              Planifier une livraison
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Planifier une livraison</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>
                    Commande <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formCommandeId}
                    onValueChange={(v) => setFormCommandeId(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une commande" />
                    </SelectTrigger>
                    <SelectContent>
                      {commandes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.numero} — {c.client.raisonSociale}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Adresse de livraison <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={formAdresse}
                    onChange={(e) => setFormAdresse(e.target.value)}
                    placeholder="Adresse complète..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Contact de livraison</Label>
                    <Input
                      value={formContact}
                      onChange={(e) => setFormContact(e.target.value)}
                      placeholder="Nom et téléphone"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Date prévue <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={formDatePrevue}
                      onChange={(e) => setFormDatePrevue(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Assigné à</Label>
                  <Select
                    value={formAssignedTo}
                    onValueChange={(v) => setFormAssignedTo(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un chargé des opérations" />
                    </SelectTrigger>
                    <SelectContent>
                      {chargesOps.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Signatures client requises</Label>
                  <Select
                    value={String(formNbSignatures)}
                    onValueChange={(v) => setFormNbSignatures(v === "2" ? 2 : 1)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 signature client</SelectItem>
                      <SelectItem value="2">2 signatures client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Instructions particulières..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPlanifierOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handlePlanifier} disabled={formSubmitting}>
                  {formSubmitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  Planifier
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </RoleGate>
      </PageHeader>

      {/* Stats KPI */}
      <StatCards
        cards={[
          { label: "Aujourd'hui", value: stats.aujourdHui, icon: Calendar, variant: "warning", hint: "À livrer ce jour" },
          { label: "Planifiées", value: stats.planifiees, icon: Clock, variant: "primary", hint: "En attente" },
          { label: "En cours", value: stats.enCours, icon: Truck, variant: "info", hint: "En route" },
          { label: "Livrées", value: stats.livrees, icon: CheckCircle2, variant: "success", hint: "Finalisées" },
        ]}
      />

      {/* Search + Tabs */}
      <div className="flex flex-col gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-white border-slate-200 focus-visible:border-blue-400"
          />
        </div>

        <div className="flex gap-1 border-b border-slate-200 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            const active = activeTab === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                  active
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-slate-100" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)", borderRadius: "16px" }}>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />Chargement...
            </div>
          ) : livraisons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
                <Truck className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm font-medium">Aucune livraison trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Commande</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Client</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Adresse</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Date prévue</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Livré le</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Statut</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Livreur</th>
                    <th className="text-center px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">Sig.</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <motion.tbody
                  className="divide-y divide-slate-50"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {livraisons.map((l) => (
                    <motion.tr
                      key={l.id}
                      variants={staggerItem}
                      className="group hover:bg-gradient-to-r hover:from-cyan-50/40 hover:to-transparent transition-all cursor-pointer"
                      onClick={() => router.push(`/commandes/${l.commande.id}/livraison`)}
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md group-hover:bg-blue-100 transition-colors">
                          {l.commande.numero}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900 group-hover:text-cyan-700 transition-colors">
                        {l.client.raisonSociale}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs max-w-[220px]">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-300 shrink-0 mt-0.5" />
                          <span className="truncate">{l.adresseLivraison}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs tabular-nums">{formatDate(l.datePrevue)}</td>
                      <td className="px-5 py-3.5 text-xs tabular-nums">
                        {l.dateReelle ? <span className="text-green-600 font-medium">{formatDate(l.dateReelle)}</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={l.status} /></td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs">
                        {l.assignedTo?.name ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {l.signatureUrl
                          ? <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                          : <XCircle className="h-4 w-4 text-slate-300 mx-auto" />
                        }
                      </td>
                      <td className="px-5 py-3.5">
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
