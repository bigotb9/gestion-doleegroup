import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ALL_ACTIONS, canDo, PERMISSION_CATEGORIES } from "@/lib/permissions"
import { Role } from "@prisma/client"
import { PageHeader } from "@/components/layout/PageHeader"
import { CheckCircle2, XCircle, Shield, Database, Layers } from "lucide-react"
import Link from "next/link"
import { ROLE_LABELS } from "@/lib/constants"

export const dynamic = "force-dynamic"

export default async function PermissionsDiagnosticPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const u = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      permissions: true,
      customRoleId: true,
      customRole: { select: { id: true, name: true, permissions: true } },
    },
  })

  if (!u) redirect("/login")

  // Compute effective permissions exactly as requirePermission does
  let effectivePermissions: string[] | null = null
  let source: string

  if (u.role === "CUSTOM" && u.customRole) {
    if (u.permissions !== null) {
      try {
        effectivePermissions = JSON.parse(u.permissions)
        source = "user.permissions (override individuel)"
      } catch {
        source = "user.permissions (parse error)"
      }
    } else {
      try {
        effectivePermissions = JSON.parse(u.customRole.permissions)
        source = `customRole "${u.customRole.name}".permissions`
      } catch {
        source = "customRole.permissions (parse error)"
      }
    }
  } else if (u.permissions) {
    try {
      effectivePermissions = JSON.parse(u.permissions)
      source = "user.permissions (override individuel)"
    } catch {
      source = "user.permissions (parse error)"
    }
  } else {
    source = `défauts du rôle ${u.role}`
  }

  const role = u.role as Role
  const totalGranted = ALL_ACTIONS.filter((a) => canDo(role, a, effectivePermissions)).length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Diagnostic de mes permissions"
        description="Vue brute des permissions effectives pour cet utilisateur"
      >
        <Link href="/profil" className="text-sm text-slate-500 hover:text-slate-700">
          ← Retour au profil
        </Link>
      </PageHeader>

      {/* User info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Utilisateur</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-500">Nom :</span> <span className="font-medium">{u.name}</span>
          </div>
          <div>
            <span className="text-slate-500">Email :</span> <span className="font-medium">{u.email}</span>
          </div>
          <div>
            <span className="text-slate-500">ID :</span> <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{u.id}</code>
          </div>
          <div>
            <span className="text-slate-500">Actif :</span>{" "}
            {u.isActive ? (
              <span className="text-emerald-600 font-medium">Oui</span>
            ) : (
              <span className="text-red-600 font-medium">Non</span>
            )}
          </div>
          <div>
            <span className="text-slate-500">Rôle :</span>{" "}
            <span className="font-medium">{ROLE_LABELS[u.role] ?? u.role}</span>
          </div>
          {u.customRole && (
            <div>
              <span className="text-slate-500">Rôle perso :</span>{" "}
              <span className="font-medium">{u.customRole.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Source */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 space-y-2">
        <div className="flex items-center gap-2 text-blue-900">
          <Database className="h-4 w-4" />
          <p className="text-xs font-bold uppercase tracking-wider">Source des permissions effectives</p>
        </div>
        <p className="text-sm font-mono text-blue-800">{source}</p>
        <p className="text-xs text-blue-600">
          {totalGranted} permission{totalGranted > 1 ? "s" : ""} accordée{totalGranted > 1 ? "s" : ""} sur{" "}
          {ALL_ACTIONS.length}
        </p>
      </div>

      {/* Raw DB values */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-700">
          <Layers className="h-4 w-4" />
          <p className="text-xs font-bold uppercase tracking-wider">Valeurs brutes en base de données</p>
        </div>
        <div className="space-y-2 text-xs">
          <div>
            <p className="font-semibold text-slate-700 mb-1">user.permissions :</p>
            <pre className="bg-white border border-slate-200 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all text-[11px]">
              {u.permissions === null ? "null (pas d'override individuel)" : u.permissions}
            </pre>
          </div>
          {u.customRole && (
            <div>
              <p className="font-semibold text-slate-700 mb-1">customRole.permissions :</p>
              <pre className="bg-white border border-slate-200 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all text-[11px]">
                {u.customRole.permissions}
              </pre>
            </div>
          )}
          <div>
            <p className="font-semibold text-slate-700 mb-1">Effective (parsé) :</p>
            <pre className="bg-white border border-slate-200 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all text-[11px]">
              {effectivePermissions === null ? "null → fallback sur les défauts du rôle" : JSON.stringify(effectivePermissions, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Permissions by category */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-slate-700" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Permissions effectives</p>
        </div>
        {PERMISSION_CATEGORIES.map((cat) => (
          <div key={cat.id} className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{cat.label}</p>
            {cat.groups.map((group) => (
              <div key={group.module} className="ml-2 space-y-1">
                <p className="text-[11px] font-semibold text-slate-400">{group.label}</p>
                <div className="grid grid-cols-2 gap-1 ml-3">
                  {group.actions.map((a) => {
                    const granted = canDo(role, a.action, effectivePermissions)
                    return (
                      <div
                        key={a.action}
                        className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${
                          granted ? "text-emerald-700" : "text-slate-400 line-through"
                        }`}
                      >
                        {granted ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                        )}
                        <span className="font-mono text-[10px]">{a.action}</span>
                        <span className="text-[10px]">— {a.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
