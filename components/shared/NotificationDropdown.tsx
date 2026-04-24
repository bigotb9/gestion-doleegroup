"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatRelativeDate } from "@/lib/utils"

interface Notification {
  id: string
  titre: string
  corps: string
  type: string
  lienUrl?: string
  isLu: boolean
  createdAt: string
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((data) => setNotifications(Array.isArray(data) ? data : []))
        .catch(() => {})
    }
  }, [open])

  const unreadCount = notifications.filter((n) => !n.isLu).length

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" })
    setNotifications((prev) => prev.map((n) => ({ ...n, isLu: true })))
  }

  const typeColor: Record<string, string> = {
    info: "bg-blue-500",
    warning: "bg-amber-500",
    success: "bg-green-500",
    error: "bg-red-500",
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">Notifications</p>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
              Tout marquer lu
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Aucune notification
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <a
                key={n.id}
                href={n.lienUrl ?? "#"}
                className={`flex gap-3 px-3 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 ${!n.isLu ? "bg-blue-50/50" : ""}`}
              >
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${typeColor[n.type] ?? "bg-slate-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 leading-tight">{n.titre}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.corps}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatRelativeDate(n.createdAt)}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
