import { requirePagePermission } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission("crm:read", "/commandes")
  return <>{children}</>
}
