"use client"

import { signOut } from "next-auth/react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { LogOut, Menu, User, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-white/95 backdrop-blur-sm border-b border-slate-100 h-14 sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center gap-1.5">
        <NotificationDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="flex items-center gap-2 h-9 px-2 rounded-xl" />}>
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
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                {ROLE_LABELS[(session?.user?.role as Role) ?? "SECRETAIRE"]}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold text-slate-800">{session?.user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{session?.user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href="/profil" />}>
                <User className="h-4 w-4 mr-2 text-slate-500" />
                Mon profil
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/parametres" />}>
                <Settings className="h-4 w-4 mr-2 text-slate-500" />
                Paramètres
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
