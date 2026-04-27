import { requirePagePermission } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"

export default async function FacturationLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission("facturation:read", "/commandes")
  return <>{children}</>
}
