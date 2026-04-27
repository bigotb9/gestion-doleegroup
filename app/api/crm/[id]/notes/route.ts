import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requirePermission("crm:edit")
  const { id } = await params
  if (error) return error

  const { contenu } = await req.json()

  const note = await prisma.note.create({
    data: {
      clientId: id,
      userId: session!.user.id,
      contenu,
    },
    include: { user: { select: { id: true, name: true } } },
  })

  return NextResponse.json(note, { status: 201 })
}
