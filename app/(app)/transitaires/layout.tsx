import { requirePagePermission } from "@/lib/auth-helpers"

export default async function TransitairesLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission("logistique:read", "/commandes")
  return <>{children}</>
}
