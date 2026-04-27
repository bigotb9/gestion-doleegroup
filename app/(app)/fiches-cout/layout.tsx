import { requirePagePermissionAny } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"

export default async function FichesCoutLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermissionAny(["production:read","production:manage"], "/commandes")
  return <>{children}</>
}
