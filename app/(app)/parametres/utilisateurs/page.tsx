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
  RefreshCw, Link2, Layers,
} from "lucide-react"
import { Role } from "@prisma/client"
import { cn } from "@/lib/utils"

type CustomRole = {
  id: string
  name: string
  description: string | null
  permissions: string
  _count?: { users: number }
}

type User = {
  id: string
  name: string
  email: string
  role: Role
  isActive: boolean
  avatarUrl: string | null
  permissions: string | null
  supabaseUid: string | null
  customRoleId: string | null
  customRole: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
}

const ROLE_META: Record<Exclude<Role, "CUSTOM">, { label: string; desc: string; gradient: string; badgeClass: string }> = {
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

function getRoleDisplay(u: User, customRoles: CustomRole[]) {
  if (u.role === "CUSTOM") {
    const cr = customRoles.find((r) => r.id === u.customRoleId)
    return {
      label: cr?.name ?? "Rôle custom",
      desc: cr?.description ?? "Rôle personnalisé",
      gradient: "from-teal-500 to-cyan-600",
      badgeClass: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
    }
  }
  return ROLE_META[u.role as Exclude<Role, "CUSTOM">] ?? ROLE_META.SECRETAIRE
}

// ── Composant sélecteur de permissions (réutilisé dans user edit + role edit) ──
function PermissionsEditor({
  permissions,
  onChange,
}: {
  permissions: Set<Action>
  onChange: (next: Set<Action>) => void
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  function toggle(action: Action) {
    const next = new Set(permissions)
    if (next.has(action)) next.delete(action)
    else next.add(action)
    onChange(next)
  }

  function toggleCat(catId: string, allSelected: boolean) {
    const cat = PERMISSION_CATEGORIES.find((c) => c.id === catId)
    if (!cat) return
    const next = new Set(permissions)
    for (const g of cat.groups) for (const a of g.actions) {
      if (allSelected) next.delete(a.action)
      else next.add(a.action)
    }
    onChange(next)
  }

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-3">
      {PERMISSION_CATEGORIES.map((cat) => {
        const Icon = CATEGORY_ICONS[cat.id] ?? Shield
        const colors = CATEGORY_COLORS[cat.id]
        const allActions = cat.groups.flatMap((g) => g.actions.map((a) => a.action))
        const checked = allActions.filter((a) => permissions.has(a)).length
        const allChecked = checked === allActions.length
        const someChecked = checked > 0 && !allChecked
        const isCollapsed = collapsed.has(cat.id)

        return (
          <div key={cat.id} className={cn("rounded-xl border overflow-hidden", colors.border, colors.bg)}>
            <div className="flex items-center justify-between px-4 py-3">
              <button onClick={() => toggleCollapse(cat.id)} className="flex items-center gap-3 flex-1 text-left">
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
                <span className="text-[11px] font-medium text-slate-500">{checked}/{allActions.length}</span>
                <button
                  onClick={() => toggleCat(cat.id, allChecked)}
                  className={cn("inline-flex items-center justify-center h-5 w-5 rounded border-2 transition-all",
                    allChecked ? "bg-indigo-600 border-indigo-600 text-white"
                      : someChecked ? "bg-indigo-200 border-indigo-400"
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
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">{group.label}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.actions.map((a) => {
                        const isChecked = permissions.has(a.action)
                        return (
                          <button
                            key={a.action}
                            onClick={() => toggle(a.action)}
                            className={cn("flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-all",
                              isChecked ? "bg-indigo-50 border border-indigo-200" : "bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-100")}
                          >
                            <div className={cn("flex h-4 w-4 items-center justify-center rounded border-2 shrink-0 mt-0.5 transition-all",
                              isChecked ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-300")}>
                              {isChecked && <CheckCircle2 className="h-3 w-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-xs font-medium", isChecked ? "text-indigo-900" : "text-slate-700")}>{a.label}</p>
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
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Page principale
// ────────────────────────────────────────────────────────────────────────────

export default function UtilisateursPage() {
  const [users, setUsers] = useState<User[]>([])
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // ── Create user dialog ────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false)
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formRole, setFormRole] = useState<Role>("SECRETAIRE")
  const [formCustomRoleId, setFormCustomRoleId] = useState("")
  const [creating, setCreating] = useState(false)

  // ── Edit user dialog ──────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editTab, setEditTab] = useState<"infos" | "permissions">("infos")
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editRole, setEditRole] = useState<Role>("SECRETAIRE")
  const [editCustomRoleId, setEditCustomRoleId] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [editPermissions, setEditPermissions] = useState<Set<Action>>(new Set())
  const [hasCustomPerms, setHasCustomPerms] = useState(false)
  const [saving, setSaving] = useState(false)

  // ── Delete user ───────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Supabase sync ─────────────────────────────────────────
  const [syncing, setSyncing] = useState(false)

  // ── Roles management dialog ───────────────────────────────
  const [rolesOpen, setRolesOpen] = useState(false)
  const [roleFormName, setRoleFormName] = useState("")
  const [roleFormDesc, setRoleFormDesc] = useState("")
  const [roleFormPerms, setRoleFormPerms] = useState<Set<Action>>(new Set())
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null)
  const [savingRole, setSavingRole] = useState(false)
  const [deletingRole, setDeleteRoleTarget] = useState<CustomRole | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch("/api/utilisateurs"),
        fetch("/api/roles"),
      ])
      if (usersRes.ok) setUsers(await usersRes.json())
      if (rolesRes.ok) setCustomRoles(await rolesRes.json())
    } catch {
      toast.error("Impossible de charger les données")
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Create user ───────────────────────────────────────────
  async function handleCreate() {
    if (!formName.trim() || !formEmail.trim() || !formPassword) {
      toast.error("Tous les champs sont obligatoires"); return
    }
    if (formPassword.length < 8) {
      toast.error("Le mot de passe doit faire au moins 8 caractères"); return
    }
    if (formRole === "CUSTOM" && !formCustomRoleId) {
      toast.error("Veuillez sélectionner un rôle personnalisé"); return
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
          ...(formRole === "CUSTOM" ? { customRoleId: formCustomRoleId } : {}),
        }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erreur")
      toast.success("Utilisateur créé — compte Supabase généré")
      setCreateOpen(false)
      setFormName(""); setFormEmail(""); setFormPassword(""); setFormRole("SECRETAIRE"); setFormCustomRoleId("")
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally { setCreating(false) }
  }

  // ── Open edit dialog ──────────────────────────────────────
  function openEdit(u: User) {
    setEditUser(u)
    setEditTab("infos")
    setEditName(u.name)
    setEditEmail(u.email)
    setEditRole(u.role)
    setEditCustomRoleId(u.customRoleId ?? "")
    setEditPassword("")
    const custom = parsePermissions(u.permissions)
    if (custom && custom.length > 0) {
      setHasCustomPerms(true)
      setEditPermissions(new Set(custom))
    } else {
      setHasCustomPerms(false)
      if (u.role === "CUSTOM" && u.customRoleId) {
        const cr = customRoles.find((r) => r.id === u.customRoleId)
        const crPerms = parsePermissions(cr?.permissions ?? null)
        setEditPermissions(new Set(crPerms ?? []))
      } else {
        setEditPermissions(new Set(getDefaultPermissions(u.role)))
      }
    }
    setEditOpen(true)
  }

  // ── Save edit ─────────────────────────────────────────────
  async function handleSaveEdit() {
    if (!editUser) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole,
        permissions: hasCustomPerms ? Array.from(editPermissions) : null,
        ...(editRole === "CUSTOM" ? { customRoleId: editCustomRoleId || null } : { customRoleId: null }),
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
      fetchData()
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
      fetchData()
    } catch { toast.error("Impossible de changer le statut") }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/utilisateurs/${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erreur")
      toast.success("Utilisateur supprimé")
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suppression impossible")
    } finally { setDeleting(false) }
  }

  async function handleSyncSupabase() {
    setSyncing(true)
    try {
      const res = await fetch("/api/utilisateurs/sync-supabase", { method: "POST" })
      if (!res.ok) throw new Error()
      const { summary } = await res.json()
      if (summary.errors > 0) {
        toast.warning(`Sync partielle : ${summary.synced} synchronisé(s), ${summary.errors} erreur(s)`)
      } else {
        toast.success(`Sync terminée — ${summary.created} créé(s), ${summary.linked} lié(s), ${summary.alreadyOk} déjà OK`)
      }
      fetchData()
    } catch { toast.error("Erreur lors de la synchronisation Supabase") }
    finally { setSyncing(false) }
  }

  // ── Custom roles CRUD ─────────────────────────────────────
  function openCreateRole() {
    setEditingRole(null)
    setRoleFormName("")
    setRoleFormDesc("")
    setRoleFormPerms(new Set())
  }

  function openEditRole(r: CustomRole) {
    setEditingRole(r)
    setRoleFormName(r.name)
    setRoleFormDesc(r.description ?? "")
    setRoleFormPerms(new Set(parsePermissions(r.permissions) ?? []))
  }

  async function handleSaveRole() {
    if (!roleFormName.trim()) { toast.error("Le nom du rôle est obligatoire"); return }
    setSavingRole(true)
    try {
      const body = {
        name: roleFormName.trim(),
        description: roleFormDesc.trim() || null,
        permissions: Array.from(roleFormPerms),
      }
      const url = editingRole ? `/api/roles/${editingRole.id}` : "/api/roles"
      const method = editingRole ? "PATCH" : "POST"
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erreur")
      toast.success(editingRole ? "Rôle mis à jour" : "Rôle créé")
      openCreateRole()
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally { setSavingRole(false) }
  }

  async function handleDeleteRole() {
    if (!deletingRole) return
    try {
      const res = await fetch(`/api/roles/${deletingRole.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erreur")
      toast.success("Rôle supprimé")
      setDeleteRoleTarget(null)
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suppression impossible")
    }
  }

  // ── Stats ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const actifs = users.filter((u) => u.isActive).length
    const customPerms = users.filter((u) => (parsePermissions(u.permissions) ?? []).length > 0).length
    const managers = users.filter((u) => u.role === "MANAGER").length
    return { actifs, customPerms, managers }
  }, [users])

  const filteredUsers = useMemo(() => {
    if (!search) return users
    const q = search.toLowerCase()
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }, [users, search])

  // ── Role selector component ───────────────────────────────
  function RoleSelector({
    value, customId, onChange,
  }: {
    value: Role
    customId: string
    onChange: (role: Role, customRoleId: string) => void
  }) {
    return (
      <Select
        value={value === "CUSTOM" ? `CUSTOM:${customId}` : value}
        onValueChange={(v) => {
          if (!v) return
          if (v.startsWith("CUSTOM:")) {
            onChange("CUSTOM", v.slice(7))
          } else {
            onChange(v as Role, "")
          }
        }}
      >
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {(Object.keys(ROLE_META) as Exclude<Role, "CUSTOM">[]).map((r) => (
            <SelectItem key={r} value={r}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{ROLE_META[r].label}</span>
                <span className="text-[10px] text-slate-400">— {ROLE_META[r].desc}</span>
              </div>
            </SelectItem>
          ))}
          {customRoles.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-t mt-1 pt-2">
                Rôles personnalisés
              </div>
              {customRoles.map((cr) => (
                <SelectItem key={cr.id} value={`CUSTOM:${cr.id}`}>
                  <div className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-teal-600" />
                    <span className="font-medium">{cr.name}</span>
                    {cr.description && (
                      <span className="text-[10px] text-slate-400">— {cr.description}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    )
  }

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
            onClick={() => { openCreateRole(); setRolesOpen(true) }}
            className="h-9 gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50"
          >
            <Layers className="h-4 w-4" />Gérer les rôles
            {customRoles.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[9px] font-bold bg-teal-100 text-teal-700">
                {customRoles.length}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleSyncSupabase}
            disabled={syncing}
            className="h-9 gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync Supabase
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="h-9 shadow-sm">
            <Plus className="h-4 w-4 mr-1.5" />Nouvel utilisateur
          </Button>
        </PageHeader>

        <StatCards
          cards={[
            { label: "Total", value: users.length, icon: Users, variant: "primary", hint: "Tous comptes" },
            { label: "Actifs", value: stats.actifs, icon: UserCheck, variant: "success", hint: "Accès autorisé" },
            { label: "Managers", value: stats.managers, icon: Shield, variant: "warning", hint: "Accès complet" },
            { label: "Perm. custom", value: stats.customPerms, icon: Settings2, variant: "info", hint: "Personnalisées" },
          ]}
        />

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
            variants={staggerContainer} initial="initial" animate="animate"
          >
            {filteredUsers.map((u) => {
              const meta = getRoleDisplay(u, customRoles)
              const custom = parsePermissions(u.permissions)
              const initials = u.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()

              return (
                <motion.div
                  key={u.id} variants={staggerItem}
                  className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.12)] hover:border-slate-200"
                >
                  <div className="relative space-y-4">
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

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", meta.badgeClass)}>
                        {u.role === "CUSTOM" ? <Layers className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                        {meta.label}
                      </span>
                      <div className="flex items-center gap-1.5">
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

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(u)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md px-2 py-1.5 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />Modifier
                        </button>
                        <button onClick={() => handleToggleActive(u)}
                          className={cn("inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2 py-1.5 transition-colors",
                            u.isActive ? "text-slate-500 hover:text-amber-600 hover:bg-amber-50" : "text-slate-500 hover:text-green-600 hover:bg-green-50")}>
                          {u.isActive ? <><UserX className="h-3.5 w-3.5" />Désactiver</> : <><UserCheck className="h-3.5 w-3.5" />Activer</>}
                        </button>
                      </div>
                      <button onClick={() => setDeleteTarget(u)}
                        className="text-slate-300 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* ── Dialog : Créer utilisateur ──────────────────── */}
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
                <RoleSelector
                  value={formRole}
                  customId={formCustomRoleId}
                  onChange={(r, cid) => { setFormRole(r); setFormCustomRoleId(cid) }}
                />
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

        {/* ── Dialog : Modifier utilisateur ──────────────── */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-6 pt-5 pb-0">
              <DialogTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-blue-600" />Modifier l&apos;utilisateur
              </DialogTitle>
            </DialogHeader>

            <div className="flex gap-1 border-b border-slate-100 px-6 mt-3">
              <button onClick={() => setEditTab("infos")}
                className={cn("px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px",
                  editTab === "infos" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800")}>
                <span className="inline-flex items-center gap-1.5"><UserCog className="h-3.5 w-3.5" />Infos générales</span>
              </button>
              <button onClick={() => setEditTab("permissions")}
                className={cn("px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px",
                  editTab === "permissions" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800")}>
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
                      <RoleSelector
                        value={editRole}
                        customId={editCustomRoleId}
                        onChange={(r, cid) => {
                          setEditRole(r)
                          setEditCustomRoleId(cid)
                          if (!hasCustomPerms) {
                            if (r === "CUSTOM" && cid) {
                              const cr = customRoles.find((x) => x.id === cid)
                              setEditPermissions(new Set(parsePermissions(cr?.permissions ?? null) ?? []))
                            } else {
                              setEditPermissions(new Set(getDefaultPermissions(r)))
                            }
                          }
                        }}
                      />
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
                            : `Permissions par défaut`}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {hasCustomPerms ? "Personnalisation active — surcharge le rôle" : "Cliquez sur une permission pour personnaliser"}
                        </p>
                      </div>
                      {hasCustomPerms && (
                        <button
                          onClick={() => {
                            setHasCustomPerms(false)
                            if (editRole === "CUSTOM" && editCustomRoleId) {
                              const cr = customRoles.find((x) => x.id === editCustomRoleId)
                              setEditPermissions(new Set(parsePermissions(cr?.permissions ?? null) ?? []))
                            } else {
                              setEditPermissions(new Set(getDefaultPermissions(editRole)))
                            }
                          }}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-md hover:bg-indigo-50 transition-colors">
                          Réinitialiser
                        </button>
                      )}
                    </div>
                    <PermissionsEditor
                      permissions={editPermissions}
                      onChange={(next) => { setHasCustomPerms(true); setEditPermissions(next) }}
                    />
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

        {/* ── Dialog : Supprimer utilisateur ─────────────── */}
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

        {/* ── Dialog : Gérer les rôles personnalisés ─────── */}
        <Dialog open={rolesOpen} onOpenChange={setRolesOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-teal-600" />Rôles personnalisés
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 h-full divide-x divide-slate-100">
                {/* Colonne gauche : liste des rôles */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Rôles existants</p>
                    <Button size="sm" variant="outline" onClick={openCreateRole} className="h-7 text-xs gap-1">
                      <Plus className="h-3 w-3" />Nouveau
                    </Button>
                  </div>

                  {customRoles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                      <Layers className="h-8 w-8 text-slate-200" />
                      <p className="text-xs">Aucun rôle créé</p>
                    </div>
                  ) : (
                    customRoles.map((r) => (
                      <div key={r.id}
                        className={cn("rounded-xl border p-3 cursor-pointer transition-all",
                          editingRole?.id === r.id
                            ? "border-teal-300 bg-teal-50"
                            : "border-slate-100 bg-white hover:border-slate-200")}
                        onClick={() => openEditRole(r)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                              <Layers className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                              {r.description && <p className="text-[11px] text-slate-500">{r.description}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] text-slate-400">{r._count?.users ?? 0} user(s)</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteRoleTarget(r) }}
                              className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-1 flex-wrap">
                          {(() => {
                            const perms = parsePermissions(r.permissions) ?? []
                            return (
                              <>
                                <span className="text-[10px] font-medium text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                                  {perms.length} permission{perms.length > 1 ? "s" : ""}
                                </span>
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Colonne droite : formulaire de création / édition */}
                <div className="p-4 space-y-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    {editingRole ? `Modifier « ${editingRole.name} »` : "Nouveau rôle"}
                  </p>

                  <div className="space-y-1.5">
                    <Label>Nom du rôle <span className="text-red-500">*</span></Label>
                    <Input value={roleFormName} onChange={(e) => setRoleFormName(e.target.value)} placeholder="Ex : Comptable, Responsable Commercial..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description <span className="text-slate-400 text-xs font-normal">(optionnel)</span></Label>
                    <Input value={roleFormDesc} onChange={(e) => setRoleFormDesc(e.target.value)} placeholder="Courte description du rôle" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Permissions</Label>
                      <span className="text-[11px] text-slate-400">{roleFormPerms.size} sélectionnée(s)</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto pr-1">
                      <PermissionsEditor
                        permissions={roleFormPerms}
                        onChange={setRoleFormPerms}
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveRole} disabled={savingRole} className="w-full">
                    {savingRole && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                    {editingRole ? "Mettre à jour le rôle" : "Créer le rôle"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Dialog : Confirmer suppression rôle ────────── */}
        <Dialog open={!!deletingRole} onOpenChange={(o) => { if (!o) setDeleteRoleTarget(null) }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />Supprimer le rôle
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-600">
              Supprimer le rôle <span className="font-semibold">« {deletingRole?.name} »</span> ?{" "}
              Les utilisateurs assignés devront être réassignés au préalable.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteRoleTarget(null)}>Annuler</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteRole}>
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGate>
  )
}
