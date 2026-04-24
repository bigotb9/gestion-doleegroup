"use client"

import { useSession } from "next-auth/react"
import { Role } from "@prisma/client"
import { canDo, type Action } from "@/lib/permissions"

interface RoleGateProps {
  roles?: Role[]
  action?: Action
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGate({ roles, action, children, fallback = null }: RoleGateProps) {
  const { data: session } = useSession()
  const role = session?.user?.role as Role | undefined
  const permissions = session?.user?.permissions ?? null

  if (roles && (!role || !roles.includes(role))) return <>{fallback}</>
  if (action && !canDo(role, action, permissions)) return <>{fallback}</>

  return <>{children}</>
}
