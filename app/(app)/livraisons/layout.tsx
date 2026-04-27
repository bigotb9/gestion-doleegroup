import { requirePagePermissionAny } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"

export default async function LivraisonsLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermissionAny(["livraison:read","livraison:manage"], "/commandes")
  return <>{children}</>
}
