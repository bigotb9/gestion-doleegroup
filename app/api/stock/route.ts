import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const articles = await prisma.articleStock.findMany({
    orderBy: { nom: "asc" },
  })

  const articlesWithFlag = articles.map((a: { quantite: number; surplusStock: number; [key: string]: unknown }) => ({
    ...a,
    isSurplus: a.surplusStock > 0 && a.quantite > a.surplusStock,
  }))

  return NextResponse.json(articlesWithFlag)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE", "CHARGE_OPERATIONS"])
  if (error) return error

  const body = await req.json()

  const article = await prisma.articleStock.create({ data: body })
  return NextResponse.json(article, { status: 201 })
}
