"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { canDo } from "@/lib/permissions"
import { Role } from "@prisma/client"
import {
  LayoutDashboard,
  Users,
  FileText,
  ShoppingCart,
  Truck,
  Package,
  PackageCheck,
  Receipt,
  Settings,
  ChevronRight,
  Building2,
  TrendingDown,
  Anchor,
  BookOpen,
  Download,
  Bell,
  ShieldCheck,
  CalendarClock,
  X,
  LayoutGrid,
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  action?: Parameters<typeof canDo>[1]
}

const NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "CRM / Prospects", href: "/crm", icon: Users, action: "crm:read" },
  { label: "Factures proforma", href: "/devis", icon: FileText, action: "devis:read" },
  { label: "Commandes", href: "/commandes", icon: ShoppingCart, action: "commande:read" },
  { label: "Kanban commandes", href: "/commandes/kanban", icon: LayoutGrid, action: "commande:read" },
  { label: "Fournisseurs", href: "/fournisseurs", icon: Building2, action: "production:read" },
  { label: "Transitaires", href: "/transitaires", icon: Anchor, action: "logistique:read" },
  { label: "Logistique", href: "/logistique", icon: Truck, action: "logistique:read" },
  { label: "Stock", href: "/stock", icon: Package, action: "stock:read" },
  { label: "Livraisons", href: "/livraisons", icon: PackageCheck, action: "livraison:read" },
  { label: "Facturation", href: "/facturation", icon: Receipt, action: "facturation:read" },
  { label: "Dépenses", href: "/depenses", icon: TrendingDown },
  { label: "Fiche de coût produit", href: "/fiches-cout", icon: BookOpen },
  { label: "Échéances", href: "/echeances", icon: CalendarClock },
  { label: "Relances CRM", href: "/crm/relances", icon: Bell },
  { label: "Exports CSV", href: "/export", icon: Download },
]

const SETTINGS_ITEMS: NavItem[] = [
  { label: "Paramètres", href: "/parametres", icon: Settings },
  { label: "Utilisateurs", href: "/parametres/utilisateurs", icon: Users, action: "users:manage" },
  { label: "Catalogue produits", href: "/parametres/produits", icon: Package, action: "produits:manage" },
  { label: "Journal d'audit", href: "/parametres/audit", icon: ShieldCheck, action: "users:manage" },
]

const ROLE_LABELS: Record<string, string> = {
  MANAGER: "Manager",
  SECRETAIRE: "Secrétaire",
  CHARGE_OPERATIONS: "Chargé des Opérations",
}

export function AppSidebar({ onClose }: { onClose?: () => void } = {}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role as Role | undefined
  const permissions = session?.user?.permissions ?? null

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  function renderNavItem(item: NavItem) {
    if (item.action && !canDo(role, item.action, permissions)) return null
    const active = isActive(item.href)
    return (
      <motion.div key={item.href} whileHover={{ x: 2 }} transition={{ duration: 0.15 }}>
        <Link
          href={item.href}
          className={cn(
            "relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            active
              ? "text-[#D4AF37]"
              : "text-blue-200/70 hover:text-white hover:bg-white/10"
          )}
          style={active ? { backgroundColor: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.25)" } : {}}
        >
          {active && (
            <motion.div
              layoutId="sidebar-active-dot"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
              style={{ background: "#D4AF37" }}
              transition={{ type: "spring", stiffness: 500, damping: 36 }}
            />
          )}
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="flex-1">{item.label}</span>
          {active && <ChevronRight className="h-3 w-3 opacity-60" />}
        </Link>
      </motion.div>
    )
  }

  const initials = (session?.user?.name ?? "??").slice(0, 2).toUpperCase()
  const avatarUrl = session?.user?.image

  return (
    <aside
      className="flex flex-col w-64 h-full border-r relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #16166B 0%, #1a1a8a 50%, #12124d 100%)",
        borderColor: "#1e1e8a",
      }}
    >
      {/* Orbe lumineux en haut-droite */}
      <div
        className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(212,175,55,0.35) 0%, transparent 70%)" }}
      />
      {/* Grille subtile */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none">
        <defs>
          <pattern id="sidebar-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#D4AF37" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sidebar-grid)" />
      </svg>

      {/* Brand / Logo */}
      <div
        className="relative flex items-center justify-between px-4 py-4 border-b"
        style={{ borderColor: "#1e1e8a" }}
      >
        <img
          src="/logo.png"
          alt="Dolee Group"
          style={{ height: "36px", width: "auto", display: "block", mixBlendMode: "screen" }}
        />
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg text-blue-200/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 overflow-y-auto p-3 space-y-1">
        <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-1 text-[#D4AF37]/50">
          Principal
        </p>
        {NAV_ITEMS.map(renderNavItem)}

        <div className="my-4 border-t" style={{ borderColor: "#1e1e8a" }} />
        <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-1 text-[#D4AF37]/50">
          Configuration
        </p>
        {SETTINGS_ITEMS.map(renderNavItem)}
      </nav>

      {/* User info — cliquable vers le profil */}
      {session?.user && (
        <Link
          href="/profil"
          className="p-3 border-t transition-all hover:bg-white/5"
          style={{ borderColor: "#1e1e8a" }}
        >
          <div className="flex items-center gap-3 px-2 py-1">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={session.user.name ?? ""}
                className="w-9 h-9 rounded-full object-cover shrink-0 ring-2"
                style={{ '--tw-ring-color': '#D4AF37' } as React.CSSProperties}
              />
            ) : (
              <div
                className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0"
                style={{ backgroundColor: "#D4AF37", color: "#16166B" }}
              >
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{session.user.name}</p>
              <p className="text-xs truncate" style={{ color: "#D4AF37" }}>
                {ROLE_LABELS[role ?? ""] ?? role}
              </p>
            </div>
          </div>
        </Link>
      )}
    </aside>
  )
}
