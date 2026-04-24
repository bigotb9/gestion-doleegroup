"use client"

import { useSession } from "next-auth/react"
import { useRef, useState } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ROLE_LABELS } from "@/lib/constants"
import { Role } from "@prisma/client"
import { Mail, Shield, User, Camera, Loader2 } from "lucide-react"
import { SignOutButton } from "./SignOutButton"
import { toast } from "sonner"

export default function ProfilPage() {
  const { data: session, status, update } = useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [localAvatar, setLocalAvatar] = useState<string | null>(null)

  if (status === "loading") return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
    </div>
  )
  if (!session?.user) return null

  const { name, email, role, image } = session.user
  const avatarUrl = localAvatar ?? image ?? null
  const initials = (name ?? "??").slice(0, 2).toUpperCase()
  const roleLabel = ROLE_LABELS[(role as Role) ?? "SECRETAIRE"]

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/profile/avatar", { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? "Erreur lors de l'upload")
        return
      }

      setLocalAvatar(data.avatarUrl)
      await update() // refresh session
      toast.success("Photo de profil mise à jour")
    } catch {
      toast.error("Erreur lors de l'upload")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <PageHeader title="Mon profil" description="Vos informations personnelles" />

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 pb-4 border-b border-slate-100">
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name ?? "Photo de profil"}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-slate-100"
                />
              ) : (
                <div
                  className="flex items-center justify-center w-24 h-24 rounded-full text-2xl font-bold text-white ring-4 ring-slate-100"
                  style={{ backgroundColor: "#D4AF37", color: "#16166B" }}
                >
                  {initials}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {uploading ? "Envoi en cours…" : "Changer la photo"}
            </Button>

            <div className="text-center">
              <p className="text-lg font-semibold text-slate-900">{name}</p>
              <p className="text-sm text-slate-500">{roleLabel}</p>
            </div>
          </div>

          {/* Informations */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0" style={{ backgroundColor: "#16166B15", color: "#16166B" }}>
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Nom complet</p>
                <p className="font-medium text-slate-900">{name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 text-green-600 shrink-0">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Adresse email</p>
                <p className="font-medium text-slate-900">{email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0" style={{ backgroundColor: "#D4AF3715", color: "#D4AF37" }}>
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Rôle</p>
                <p className="font-medium text-slate-900">{roleLabel}</p>
              </div>
            </div>
          </div>

          {/* Déconnexion */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <SignOutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
