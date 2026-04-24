import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const url = new URL(req.url)
  const search = url.searchParams.get("search") ?? ""
  const includeInactif = url.searchParams.get("includeInactif") === "true"

  const where: Record<string, unknown> = {}
  if (!includeInactif) where.isActive = true
  if (search) {
    where.OR = [
      { nom: { contains: search, mode: "insensitive" } },
      { pays: { contains: search, mode: "insensitive" } },
    ]
  }

  const transitaires = await prisma.transitaire.findMany({
    where,
    orderBy: { nom: "asc" },
    include: {
      _count: { select: { logistiques: true } },
    },
  })

  return NextResponse.json({ transitaires, total: transitaires.length })
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE"])
  if (error) return error

  const body = await req.json()
  const transitaire = await prisma.transitaire.create({ data: body })
  return NextResponse.json(transitaire, { status: 201 })
}
