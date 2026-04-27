import { requirePagePermissionAny } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"

export default async function DepensesLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermissionAny(["depense:read", "depense:manage"], "/commandes")
  return <>{children}</>
}
