import { requirePagePermission } from "@/lib/auth-helpers"

export default async function FichesCoutLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission("production:read", "/commandes")
  return <>{children}</>
}
