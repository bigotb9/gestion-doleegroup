import { requirePagePermission } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"

export default async function LivraisonsLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission("livraison:read", "/commandes")
  return <>{children}</>
}
