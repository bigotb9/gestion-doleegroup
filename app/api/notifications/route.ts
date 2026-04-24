import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const notifications = await prisma.notification.findMany({
    where: { userId: session!.user.id, isLu: false },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(notifications)
}

export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  await prisma.notification.updateMany({
    where: { userId: session!.user.id, isLu: false },
    data: { isLu: true },
  })

  return NextResponse.json({ success: true })
}
