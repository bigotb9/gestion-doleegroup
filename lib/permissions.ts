import { Role } from "@prisma/client"

export type Action =
  // Commercial
  | "crm:read" | "crm:create" | "crm:edit" | "crm:delete"
  | "devis:read" | "devis:create" | "devis:edit" | "devis:validate" | "devis:send"
  | "commande:read" | "commande:create" | "commande:confirm" | "commande:cancel"
  // Opérations
  | "production:read" | "production:manage"
  | "stock:read" | "stock:manage"
  | "logistique:read" | "logistique:manage"
  | "reconditionnement:read" | "reconditionnement:manage"
  | "livraison:read" | "livraison:manage" | "livraison:sign"
  // Finance
  | "paiement:record" | "paiement:confirm"
  | "facturation:read" | "facturation:manage"
  | "depense:read" | "depense:manage"
  // Administration
  | "users:manage"
  | "audit:read"

export const ALL_ACTIONS: Action[] = [
  "crm:read", "crm:create", "crm:edit", "crm:delete",
  "devis:read", "devis:create", "devis:edit", "devis:validate", "devis:send",
  "commande:read", "commande:create", "commande:confirm", "commande:cancel",
  "production:read", "production:manage",
  "stock:read", "stock:manage",
  "logistique:read", "logistique:manage",
  "reconditionnement:read", "reconditionnement:manage",
  "livraison:read", "livraison:manage", "livraison:sign",
  "paiement:record", "paiement:confirm",
  "facturation:read", "facturation:manage",
  "depense:read", "depense:manage",
  "users:manage",
  "audit:read",
]

// ── Groupes organisés par domaine métier ─────────────────────────────────
export type PermissionCategory = {
  id: string
  label: string
  description: string
  color: string
  icon: string
  groups: {
    label: string
    module: string
    actions: { action: Action; label: string; hint?: string }[]
  }[]
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: "commercial",
    label: "Commercial",
    description: "CRM, devis, commandes clients",
    color: "blue",
    icon: "Briefcase",
    groups: [
      {
        label: "CRM / Prospects", module: "crm",
        actions: [
          { action: "crm:read", label: "Consulter", hint: "Voir la liste et les fiches clients" },
          { action: "crm:create", label: "Créer", hint: "Ajouter un nouveau prospect" },
          { action: "crm:edit", label: "Modifier", hint: "Éditer les fiches clients" },
          { action: "crm:delete", label: "Supprimer" },
        ],
      },
      {
        label: "Factures proforma (Devis)", module: "devis",
        actions: [
          { action: "devis:read", label: "Consulter" },
          { action: "devis:create", label: "Créer" },
          { action: "devis:edit", label: "Modifier" },
          { action: "devis:validate", label: "Valider", hint: "Validation avant envoi" },
          { action: "devis:send", label: "Envoyer au client" },
        ],
      },
      {
        label: "Commandes", module: "commande",
        actions: [
          { action: "commande:read", label: "Consulter" },
          { action: "commande:create", label: "Créer" },
          { action: "commande:confirm", label: "Confirmer" },
          { action: "commande:cancel", label: "Annuler" },
        ],
      },
    ],
  },
  {
    id: "operations",
    label: "Opérations",
    description: "Production, stock, logistique, livraisons",
    color: "purple",
    icon: "Factory",
    groups: [
      {
        label: "Production", module: "production",
        actions: [
          { action: "production:read", label: "Consulter" },
          { action: "production:manage", label: "Gérer", hint: "Créer, modifier les productions" },
        ],
      },
      {
        label: "Stock & Réceptions", module: "stock",
        actions: [
          { action: "stock:read", label: "Consulter" },
          { action: "stock:manage", label: "Gérer", hint: "Enregistrer les réceptions" },
        ],
      },
      {
        label: "Logistique", module: "logistique",
        actions: [
          { action: "logistique:read", label: "Consulter" },
          { action: "logistique:manage", label: "Gérer", hint: "Gérer le suivi transitaire" },
        ],
      },
      {
        label: "Reconditionnement", module: "reconditionnement",
        actions: [
          { action: "reconditionnement:read", label: "Consulter" },
          { action: "reconditionnement:manage", label: "Gérer" },
        ],
      },
      {
        label: "Livraisons", module: "livraison",
        actions: [
          { action: "livraison:read", label: "Consulter" },
          { action: "livraison:manage", label: "Gérer" },
          { action: "livraison:sign", label: "Signer", hint: "Recueillir les signatures" },
        ],
      },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    description: "Paiements, facturation, dépenses",
    color: "emerald",
    icon: "Banknote",
    groups: [
      {
        label: "Paiements clients", module: "paiement",
        actions: [
          { action: "paiement:record", label: "Enregistrer" },
          { action: "paiement:confirm", label: "Confirmer", hint: "Validation définitive" },
        ],
      },
      {
        label: "Facturation", module: "facturation",
        actions: [
          { action: "facturation:read", label: "Consulter" },
          { action: "facturation:manage", label: "Gérer", hint: "Créer et émettre les factures" },
        ],
      },
      {
        label: "Dépenses", module: "depense",
        actions: [
          { action: "depense:read", label: "Consulter" },
          { action: "depense:manage", label: "Gérer" },
        ],
      },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    description: "Utilisateurs et audit",
    color: "amber",
    icon: "Shield",
    groups: [
      {
        label: "Utilisateurs", module: "users",
        actions: [
          { action: "users:manage", label: "Gérer les utilisateurs", hint: "Créer, modifier, désactiver" },
        ],
      },
      {
        label: "Journal d'audit", module: "audit",
        actions: [
          { action: "audit:read", label: "Consulter le journal" },
        ],
      },
    ],
  },
]

// ── Backwards compat : flat groups ───────────────────────────────────────
export const PERMISSION_GROUPS = PERMISSION_CATEGORIES.flatMap((c) => c.groups)

// ── Rôles : permissions par défaut ───────────────────────────────────────
const ROLE_PERMISSIONS: Record<Role, Action[]> = {
  MANAGER: ALL_ACTIONS,
  SECRETAIRE: [
    "crm:read", "crm:create", "crm:edit",
    "devis:read", "devis:create", "devis:edit", "devis:send",
    "commande:read", "commande:create",
    "paiement:record",
    "production:read",
    "logistique:read",
    "stock:read",
    "reconditionnement:read",
    "livraison:read",
    "facturation:read",
    "depense:read",
  ],
  CHARGE_OPERATIONS: [
    "crm:read",
    "devis:read",
    "commande:read",
    "paiement:record",
    "production:read",
    "logistique:read", "logistique:manage",
    "stock:read", "stock:manage",
    "reconditionnement:read", "reconditionnement:manage",
    "livraison:read", "livraison:manage", "livraison:sign",
    "facturation:read",
    "depense:read",
  ],
}

export function getDefaultPermissions(role: Role): Action[] {
  return ROLE_PERMISSIONS[role] ?? []
}

export function canDo(
  role: Role | undefined | null,
  action: Action,
  customPermissions?: string[] | null
): boolean {
  if (!role) return false
  if (customPermissions && customPermissions.length > 0) {
    return customPermissions.includes(action)
  }
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false
}

export function requireRole(role: Role | undefined | null, ...allowedRoles: Role[]): boolean {
  if (!role) return false
  return allowedRoles.includes(role)
}
