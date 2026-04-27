import { requirePagePermissionAny } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"

export default async function TransitairesLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermissionAny(["logistique:read","logistique:manage"], "/commandes")
  return <>{children}</>
}
