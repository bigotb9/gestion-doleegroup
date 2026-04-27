import { requirePagePermission } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"

export default async function EcheancesLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission("commande:read", "/dashboard")
  return <>{children}</>
}
