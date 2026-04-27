import { requirePagePermission } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"

export default async function FournisseursLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission("production:read", "/commandes")
  return <>{children}</>
}
