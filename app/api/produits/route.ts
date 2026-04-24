import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")
  const categorie = searchParams.get("categorie")
  const all = searchParams.get("all") === "true"

  const where: Record<string, unknown> = {}
  if (!all) where.isActive = true
  if (categorie) where.categorie = categorie
  if (search) {
    where.OR = [
      { nom: { contains: search, mode: "insensitive" } },
      { reference: { contains: search, mode: "insensitive" } },
    ]
  }

  const produits = await prisma.produit.findMany({
    where,
    orderBy: [{ categorie: "asc" }, { nom: "asc" }],
  })

  return NextResponse.json(produits)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE"])
  if (error) return error

  const body = await req.json()

  const produit = await prisma.produit.create({ data: body })
  return NextResponse.json(produit, { status: 201 })
}
