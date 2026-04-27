"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationDropdown } from "@/components/shared/NotificationDropdown"
import { ROLE_LABELS } from "@/lib/constants"
import { Role } from "@prisma/client"

interface AppHeaderProps {
  onMenuClick?: () => void
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { data: session } = useSession()

  const initials = session?.user?.name?.slice(0, 2).toUpperCase() ?? "??"
  const avatarUrl = session?.user?.image
  const role = (session?.user?.role as Role) ?? "SECRETAIRE"
  const customRoleName = session?.user?.customRoleName
  const roleLabel = role === "CUSTOM" && customRoleName
    ? customRoleName
    : ROLE_LABELS[role]

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-white/95 backdrop-blur-sm border-b border-slate-100 h-14 sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center gap-1.5">
        <NotificationDropdown />

        <Link
          href="/profil"
          className="flex items-center gap-2 h-9 px-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={session?.user?.name ?? "Photo de profil"}
              className="w-7 h-7 rounded-full object-cover ring-2 ring-slate-100"
            />
          ) : (
            <div
              className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
              style={{ backgroundColor: "#16166B", color: "#D4AF37" }}
            >
              {initials}
            </div>
          )}
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold leading-none text-slate-800">{session?.user?.name}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{roleLabel}</p>
          </div>
        </Link>
      </div>
    </header>
  )
}
