import { requirePagePermissionAny } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"

export default async function StockLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermissionAny(["stock:read","stock:manage"], "/commandes")
  return <>{children}</>
}
