import { requirePagePermission } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"

export default async function LogistiqueLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission("logistique:read", "/commandes")
  return <>{children}</>
}
