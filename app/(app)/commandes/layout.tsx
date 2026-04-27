import { requirePagePermission } from "@/lib/auth-helpers"

export default async function CommandesLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission("commande:read", "/livraisons")
  return <>{children}</>
}
