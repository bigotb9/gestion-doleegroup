"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { motion, AnimatePresence } from "motion/react"
import { PageHeader } from "@/components/layout/PageHeader"
import { RoleGate } from "@/components/shared/RoleGate"
import { StatCards } from "@/components/shared/StatCards"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  PERMISSION_CATEGORIES,
  getDefaultPermissions, type Action,
} from "@/lib/permissions"
import { staggerContainer, staggerItem } from "@/lib/motion"
import {
  ArrowLeft, Plus, Pencil, ShieldCheck, Loader2, UserCog,
  Users, UserCheck, UserX, KeyRound, Mail, Shield, Trash2,
  AlertTriangle, Briefcase, Factory, Banknote,
  ChevronDown, CheckCircle2, XCircle, Search, Settings2,
  RefreshCw, Link2,
} from "lucide-react"
import { Role } from "@prisma/client"
import { cn } from "@/lib/utils"

type User = {
  id: string
  name: string
  email: string
  role: Role
  isActive: boolean
  avatarUrl: string | null
  permissions: string | null
  supabaseUid: string | null
  createdAt: string
  updatedAt: string
}

const ROLE_META: Record<Role, { label: string; desc: string; gradient: string; badgeClass: string }> = {
  MANAGER: {
    label: "Manager",
    desc: "Accès complet",
    gradient: "from-amber-500 to-orange-500",
    badgeClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
  SECRETAIRE: {
    label: "Secrétaire",
    desc: "Commercial & saisie",
    gradient: "from-blue-500 to-indigo-600",
    badgeClass: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  },
  CHARGE_OPERATIONS: {
    label: "Chargé des Opérations",
    desc: "Opérations & logistique",
    gradient: "from-purple-500 to-violet-600",
    badgeClass: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
  },
}

const CATEGORY_ICONS: Record<string, typeof Briefcase> = {
  commercial: Briefcase,
  operations: Factory,
  finance: Banknote,
  administration: Shield,
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  commercial: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
  operations: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100" },
  finance: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
  administration: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
}

function parsePermissions(json: string | null): Action[] | null {
  if (!json) return null
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : null
  } catch { return null }
}

export default function UtilisateursPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formRole, setFormRole] = useState<Role>("SECRETAIRE")
  const [creating, setCreating] = useState(false)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editTab, setEditTab] = useState<"infos" | "permissions">("infos")
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editRole, setEditRole] = useState<Role>("SECRETAIRE")
  const [editPassword, setEditPassword] = useState("")
  const [editPermissions, setEditPermissions] = useState<Set<Action>>(new Set())
  const [hasCustomPerms, setHasCustomPerms] = useState(false)
  const [saving, setSaving] = useState(false)
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set())

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Supabase sync
  const [syncing, setSyncing] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/utilisateurs")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Impossible de charger les utilisateurs")
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function handleCreate() {
    if (!formName.trim() || !formEmail.trim() || !formPassword) {
      toast.error("Tous les champs sont obligatoires"); return
    }
    if (formPassword.length < 8) {
      toast.error("Le mot de passe doit faire au moins 8 caractères"); return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/utilisateurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword,
          role: formRole,
        }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erreur")
      toast.success("Utilisateur créé — compte Supabase généré")
      setCreateOpen(false)
      setFormName(""); setFormEmail(""); setFormPassword(""); setFormRole("SECRETAIRE")
      fetchUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally { setCreating(false) }
  }

  function openEdit(u: User) {
    setEditUser(u)
    setEditTab("infos")
    setEditName(u.name)
    setEditEmail(u.email)
    setEditRole(u.role)
    setEditPassword("")
    const custom = parsePermissions(u.permissions)
    if (custom && custom.length > 0) {
      setHasCustomPerms(true)
      setEditPermissions(new Set(custom))
    } else {
      setHasCustomPerms(false)
      setEditPermissions(new Set(getDefaultPermissions(u.role)))
    }
    setEditOpen(true)
  }

  async function handleSaveEdit() {
    if (!editUser) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole,
        permissions: hasCustomPerms ? Array.from(editPermissions) : null,
      }
      if (editPassword) body.password = editPassword

      const res = await fetch(`/api/utilisateurs/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erreur")
      toast.success("Utilisateur mis à jour")
      setEditOpen(false)
      fetchUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally { setSaving(false) }
  }

  async function handleToggleActive(u: User) {
    try {
      const res = await fetch(`/api/utilisateurs/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !u.isActive }),
      })
      if (!res.ok) throw new Error()
      toast.success(u.isActive ? "Utilisateur désactivé" : "Utilisateur activé")
      fetchUsers()
    } catch {
      toast.error("Impossible de changer le statut")
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/utilisateurs/${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erreur")
      toast.success("Utilisateur supprimé")
      setDeleteTarget(null)
      fetchUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suppression impossible")
    } finally { setDeleting(false) }
  }

  async function handleSyncSupabase() {
    setSyncing(true)
    try {
      const res = await fetch("/api/utilisateurs/sync-supabase", { method: "POST" })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const { summary } = data
      if (summary.errors > 0) {
        toast.warning(
          `Sync partielle : ${summary.synced} synchronisé(s), ${summary.errors} erreur(s)`
        )
      } else {
        toast.success(
          `Sync Supabase terminée — ${summary.created} créé(s), ${summary.linked} lié(s), ${summary.alreadyOk} déjà OK`
        )
      }
      fetchUsers()
    } catch {
      toast.error("Erreur lors de la synchronisation Supabase")
    } finally {
      setSyncing(false) }
  }

  function togglePermission(action: Action) {
    setHasCustomPerms(true)
    setEditPermissions((prev) => {
      const next = new Set(prev)
      if (next.has(action)) next.delete(action)
      else next.add(action)
      return next
    })
  }

  function toggleCategoryAll(categoryId: string, allSelected: boolean) {
    const cat = PERMISSION_CATEGORIES.find((c) => c.id === categoryId)
    if (!cat) return
    setHasCustomPerms(true)
    setEditPermissions((prev) => {
      const next = new Set(prev)
      for (const group of cat.groups) {
        for (const a of group.actions) {
          if (allSelected) next.delete(a.action)
          else next.add(a.action)
        }
      }
      return next
    })
  }

  function resetToRoleDefaults() {
    setHasCustomPerms(false)
    setEditPermissions(new Set(getDefaultPermissions(editRole)))
  }

  function toggleCategoryCollapse(id: string) {
    setCollapsedCats((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Stats
  const stats = useMemo(() => {
    const actifs = users.filter((u) => u.isActive).length
    const customPerms = users.filter((u) => (parsePermissions(u.permissions) ?? []).length > 0).length
    const managers = users.filter((u) => u.role === "MANAGER").length
    return { actifs, customPerms, managers }
  }, [users])

  const filteredUsers = useMemo(() => {
    if (!search) return users
    const q = search.toLowerCase()
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    )
  }, [users, search])

  return (
    <RoleGate
      roles={["MANAGER"]}
      fallback={
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
          <Shield className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium">Accès réservé aux Managers</p>
        </div>
      }
    >
      <div className="space-y-6">
        <PageHeader title="Gestion des utilisateurs" description="Comptes, rôles et permissions">
          <Link href="/parametres"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium h-9 px-3 hover:bg-muted transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />Paramètres
          </Link>
          <Button
            variant="outline"
            onClick={handleSyncSupabase}
            disabled={syncing}
            className="h-9 gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            title="Synchroniser les comptes existants vers Supabase Auth"
          >
            {syncing
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <RefreshCw className="h-4 w-4" />}
            Sync Supabase
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="h-9 shadow-sm">
            <Plus className="h-4 w-4 mr-1.5" />Nouvel utilisateur
          </Button>
        </PageHeader>

        {/* Stats KPI */}
        <StatCards
          cards={[
            { label: "Total", value: users.length, icon: Users, variant: "primary", hint: "Tous comptes" },
            { label: "Actifs", value: stats.actifs, icon: UserCheck, variant: "success", hint: "Accès autorisé" },
            { label: "Managers", value: stats.managers, icon: Shield, variant: "warning", hint: "Accès complet" },
            { label: "Perm. custom", value: stats.customPerms, icon: Settings2, variant: "info", hint: "Personnalisées" },
          ]}
        />

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Rechercher par nom, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-white border-slate-200 focus-visible:border-blue-400"
          />
        </div>

        {/* Grille utilisateurs */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />Chargement...
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card className="py-16">
            <CardContent className="flex flex-col items-center gap-3 text-slate-400">
              <Users className="h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium">Aucun utilisateur trouvé</p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {filteredUsers.map((u) => {
              const meta = ROLE_META[u.role]
              const custom = parsePermissions(u.permissions)
              const initials = u.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()

              return (
                <motion.div
                  key={u.id}
                  variants={staggerItem}
                  className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.12)] hover:border-slate-200"
                >
                  <div className="relative space-y-4">
                    {/* Header avec avatar */}
                    <div className="flex items-start gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient} text-white font-bold shadow-sm shrink-0 group-hover:scale-110 transition-transform overflow-hidden`}>
                        {u.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.avatarUrl} alt={u.name} className="h-full w-full object-cover" />
                        ) : initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 truncate">{u.name}</p>
                          {!u.isActive && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                              <XCircle className="h-3 w-3" />Inactif
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{u.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Role badge + custom indicator */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", meta.badgeClass)}>
                        <Shield className="h-3 w-3" />
                        {meta.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {/* Indicateur Supabase Auth */}
                        {u.supabaseUid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full ring-1 ring-emerald-200">
                            <Link2 className="h-3 w-3" />Supabase
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full ring-1 ring-amber-200">
                            <RefreshCw className="h-3 w-3" />Non sync
                          </span>
                        )}
                        {custom && custom.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                            <Settings2 className="h-3 w-3" />Custom
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md px-2 py-1.5 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />Modifier
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2 py-1.5 transition-colors",
                            u.isActive
                              ? "text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                              : "text-slate-500 hover:text-green-600 hover:bg-green-50"
                          )}
                        >
                          {u.isActive
                            ? <><UserX className="h-3.5 w-3.5" />Désactiver</>
                            : <><UserCheck className="h-3.5 w-3.5" />Activer</>
                          }
                        </button>
                      </div>
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="text-slate-300 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* ── Create Dialog ─────────────────────────────────────────── */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-blue-600" />Nouvel utilisateur
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Nom complet <span className="text-red-500">*</span></Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Prénom Nom" />
              </div>
              <div className="space-y-1.5">
                <Label>Email <span className="text-red-500">*</span></Label>
                <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="nom@dolee-group.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Mot de passe <span className="text-red-500">*</span></Label>
                <Input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Minimum 8 caractères" />
                <p className="text-[10px] text-slate-400">Sera synchronisé avec Supabase Auth</p>
              </div>
              <div className="space-y-1.5">
                <Label>Rôle <span className="text-red-500">*</span></Label>
                <Select value={formRole} onValueChange={(v) => setFormRole((v as Role) ?? "SECRETAIRE")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_META) as Role[]).map((r) => (
                      <SelectItem key={r} value={r}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{ROLE_META[r].label}</span>
                          <span className="text-[10px] text-slate-400">— {ROLE_META[r].desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Edit Dialog ───────────────────────────────────────────── */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-6 pt-5 pb-0">
              <DialogTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-blue-600" />Modifier l&apos;utilisateur
              </DialogTitle>
            </DialogHeader>

            <div className="flex gap-1 border-b border-slate-100 px-6 mt-3">
              <button
                onClick={() => setEditTab("infos")}
                className={cn("px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px",
                  editTab === "infos" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800")}
              >
                <span className="inline-flex items-center gap-1.5"><UserCog className="h-3.5 w-3.5" />Infos générales</span>
              </button>
              <button
                onClick={() => setEditTab("permissions")}
                className={cn("px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px",
                  editTab === "permissions" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800")}
              >
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />Permissions
                  {hasCustomPerms && (
                    <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700">
                      {editPermissions.size}
                    </span>
                  )}
                </span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <AnimatePresence mode="wait">
                {editTab === "infos" && (
                  <motion.div key="infos" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Nom complet</Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Rôle</Label>
                      <Select value={editRole} onValueChange={(v) => {
                        const newRole = (v as Role) ?? "SECRETAIRE"
                        setEditRole(newRole)
                        if (!hasCustomPerms) setEditPermissions(new Set(getDefaultPermissions(newRole)))
                      }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(ROLE_META) as Role[]).map((r) => (
                            <SelectItem key={r} value={r}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{ROLE_META[r].label}</span>
                                <span className="text-[10px] text-slate-400">— {ROLE_META[r].desc}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Nouveau mot de passe <span className="text-slate-400 text-xs font-normal">(optionnel)</span></Label>
                      <Input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Laisser vide pour conserver" />
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <KeyRound className="h-3 w-3" />Sera synchronisé avec Supabase Auth
                      </p>
                    </div>
                  </motion.div>
                )}

                {editTab === "permissions" && (
                  <motion.div key="permissions" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {hasCustomPerms
                            ? `${editPermissions.size} permission${editPermissions.size > 1 ? "s" : ""} personnalisée${editPermissions.size > 1 ? "s" : ""}`
                            : `Permissions par défaut — ${ROLE_META[editRole].label}`}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {hasCustomPerms ? "Personnalisation active — surcharge le rôle" : "Cliquez sur une permission pour personnaliser"}
                        </p>
                      </div>
                      {hasCustomPerms && (
                        <button onClick={resetToRoleDefaults}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-md hover:bg-indigo-50 transition-colors">
                          Réinitialiser
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {PERMISSION_CATEGORIES.map((cat) => {
                        const Icon = CATEGORY_ICONS[cat.id] ?? Shield
                        const colors = CATEGORY_COLORS[cat.id]
                        const allActions = cat.groups.flatMap((g) => g.actions.map((a) => a.action))
                        const checkedInCat = allActions.filter((a) => editPermissions.has(a)).length
                        const allChecked = checkedInCat === allActions.length
                        const someChecked = checkedInCat > 0 && !allChecked
                        const isCollapsed = collapsedCats.has(cat.id)

                        return (
                          <div key={cat.id} className={cn("rounded-xl border overflow-hidden", colors.border, colors.bg)}>
                            <div className="flex items-center justify-between px-4 py-3">
                              <button onClick={() => toggleCategoryCollapse(cat.id)} className="flex items-center gap-3 flex-1 text-left">
                                <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-white border", colors.border)}>
                                  <Icon className={cn("h-4 w-4", colors.text)} />
                                </div>
                                <div className="flex-1">
                                  <p className={cn("text-sm font-bold", colors.text)}>{cat.label}</p>
                                  <p className="text-[11px] text-slate-500">{cat.description}</p>
                                </div>
                                <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", !isCollapsed && "rotate-180")} />
                              </button>
                              <div className="flex items-center gap-2 ml-3">
                                <span className="text-[11px] font-medium text-slate-500">{checkedInCat}/{allActions.length}</span>
                                <button
                                  onClick={() => toggleCategoryAll(cat.id, allChecked)}
                                  className={cn("inline-flex items-center justify-center h-5 w-5 rounded border-2 transition-all",
                                    allChecked
                                      ? "bg-indigo-600 border-indigo-600 text-white"
                                      : someChecked
                                        ? "bg-indigo-200 border-indigo-400"
                                        : "bg-white border-slate-300 hover:border-indigo-400")}
                                >
                                  {allChecked && <CheckCircle2 className="h-3 w-3" />}
                                  {someChecked && !allChecked && <div className="h-1.5 w-1.5 bg-indigo-600 rounded-sm" />}
                                </button>
                              </div>
                            </div>

                            {!isCollapsed && (
                              <div className="bg-white border-t border-slate-100">
                                {cat.groups.map((group) => (
                                  <div key={group.module} className="px-4 py-3 border-b border-slate-50 last:border-b-0">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                      {group.label}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {group.actions.map((a) => {
                                        const checked = editPermissions.has(a.action)
                                        return (
                                          <button
                                            key={a.action}
                                            onClick={() => togglePermission(a.action)}
                                            className={cn("flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-all",
                                              checked
                                                ? "bg-indigo-50 border border-indigo-200"
                                                : "bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-100")}
                                          >
                                            <div className={cn("flex h-4 w-4 items-center justify-center rounded border-2 shrink-0 mt-0.5 transition-all",
                                              checked ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-300")}>
                                              {checked && <CheckCircle2 className="h-3 w-3" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className={cn("text-xs font-medium", checked ? "text-indigo-900" : "text-slate-700")}>
                                                {a.label}
                                              </p>
                                              {a.hint && <p className="text-[10px] text-slate-400 mt-0.5">{a.hint}</p>}
                                            </div>
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Delete confirm ────────────────────────────────────────── */}
        <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />Supprimer l&apos;utilisateur
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-600">
              Vous êtes sur le point de supprimer <span className="font-semibold">{deleteTarget?.name}</span>{" "}
              ({deleteTarget?.email}). Le compte Supabase Auth sera également supprimé. Cette action est irréversible.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Annuler</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete} disabled={deleting}>
                {deleting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}Supprimer définitivement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGate>
  )
}
