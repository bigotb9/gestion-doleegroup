import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { error } = await requirePermission("production:read")
  if (error) return error

  const fournisseurs = await prisma.fournisseur.findMany({
    orderBy: { nom: "asc" },
    include: {
      _count: { select: { productions: true } },
    },
  })

  return NextResponse.json(fournisseurs)
}

export async function POST(req: NextRequest) {
  const { error } = await requirePermission("production:manage")
  if (error) return error

  const body = await req.json()

  const fournisseur = await prisma.fournisseur.create({ data: body })
  return NextResponse.json(fournisseur, { status: 201 })
}
