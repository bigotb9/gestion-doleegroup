import { requirePagePermission } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"

export default async function StockLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission("stock:read", "/commandes")
  return <>{children}</>
}
