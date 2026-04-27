import { requirePagePermission } from "@/lib/auth-helpers"

export default async function FournisseursLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission("production:read", "/commandes")
  return <>{children}</>
}
