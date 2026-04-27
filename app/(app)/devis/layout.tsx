import { requirePagePermission } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"

export default async function DevisLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission("devis:read", "/commandes")
  return <>{children}</>
}
