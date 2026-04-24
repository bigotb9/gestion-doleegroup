"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  CalendarClock,
} from "lucide-react"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau", icon: LayoutDashboard },
  { href: "/commandes", label: "Commandes", icon: ShoppingCart },
  { href: "/crm", label: "CRM", icon: Users },
  { href: "/stock", label: "Stock", icon: Package },
  { href: "/echeances", label: "Échéances", icon: CalendarClock },
]

export function BottomNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(22,22,107,0.08)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-safe">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 flex-1 py-1.5 px-1 relative"
            >
              {active && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                  style={{ background: "linear-gradient(90deg, #16166B, #D4AF37)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 36 }}
                />
              )}
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={cn(
                  "p-1.5 rounded-xl transition-colors",
                  active ? "bg-blue-50" : "bg-transparent"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    active ? "text-[#16166B]" : "text-slate-400"
                  )}
                />
              </motion.div>
              <span
                className={cn(
                  "text-[10px] font-semibold transition-colors",
                  active ? "text-[#16166B]" : "text-slate-400"
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
      {/* Safe area spacer iOS */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  )
}
