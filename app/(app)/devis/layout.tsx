import { requirePagePermission } from "@/lib/auth-helpers"

export default async function DevisLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission("devis:read", "/commandes")
  return <>{children}</>
}
