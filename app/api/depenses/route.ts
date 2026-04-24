import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const categorie = searchParams.get("categorie")
  const page = parseInt(searchParams.get("page") ?? "1")
  const pageSize = 20

  const where: Record<string, unknown> = {}
  if (categorie) where.categorie = categorie

  const [depenses, total, aggregate] = await Promise.all([
    prisma.depense.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.depense.count({ where }),
    prisma.depense.aggregate({ _sum: { montant: true } }),
  ])

  return NextResponse.json({
    depenses,
    total,
    page,
    pageSize,
    totalMontant: Number(aggregate._sum.montant ?? 0),
  })
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["MANAGER"])
  if (error) return error

  const body = await req.json()

  if (!body.titre?.trim()) {
    return NextResponse.json({ error: "Le titre est obligatoire" }, { status: 400 })
  }
  if (!body.montant || isNaN(Number(body.montant))) {
    return NextResponse.json({ error: "Le montant est invalide" }, { status: 400 })
  }
  if (!body.date) {
    return NextResponse.json({ error: "La date est obligatoire" }, { status: 400 })
  }

  const depense = await prisma.depense.create({
    data: {
      titre: body.titre.trim(),
      montant: Number(body.montant),
      categorie: body.categorie || null,
      date: new Date(body.date),
      description: body.description?.trim() || null,
      justificatifUrl: body.justificatifUrl?.trim() || null,
    },
  })

  return NextResponse.json(depense, { status: 201 })
}
