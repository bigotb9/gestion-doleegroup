import { requirePagePermission } from "@/lib/auth-helpers"

export default async function DepensesLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission("depense:read", "/commandes")
  return <>{children}</>
}
