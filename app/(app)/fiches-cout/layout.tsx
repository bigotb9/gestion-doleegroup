import { requirePagePermissionAny } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"

export default async function FichesCoutLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermissionAny(["fiche-cout:read","fiche-cout:manage"], "/commandes")
  return <>{children}</>
}
