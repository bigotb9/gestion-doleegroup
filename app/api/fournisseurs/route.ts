import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
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
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE"])
  if (error) return error

  const body = await req.json()

  const fournisseur = await prisma.fournisseur.create({ data: body })
  return NextResponse.json(fournisseur, { status: 201 })
}
