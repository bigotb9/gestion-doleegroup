import { requirePagePermission } from "@/lib/auth-helpers"

export default async function ExportLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission("commande:read", "/dashboard")
  return <>{children}</>
}
