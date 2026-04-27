import { requirePagePermissionAny } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"

export default async function FacturationLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermissionAny(["facturation:read","facturation:manage"], "/commandes")
  return <>{children}</>
}
