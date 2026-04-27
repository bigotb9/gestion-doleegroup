import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requirePermission("stock:read")
  const { id } = await params
  if (error) return error

  const article = await prisma.articleStock.findUnique({
    where: { id: id },
    include: {
      mouvements: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  })

  if (!article) return NextResponse.json({ error: "Article introuvable" }, { status: 404 })
  return NextResponse.json({ ...article, isLowStock: article.quantite <= article.quantiteMin })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requirePermission("stock:manage")
  const { id } = await params
  if (error) return error

  const body = await req.json()

  const article = await prisma.articleStock.update({
    where: { id: id },
    data: body,
  })
  return NextResponse.json(article)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requirePermission("stock:manage")
  const { id } = await params
  if (error) return error

  await prisma.articleStock.delete({ where: { id: id } })
  return NextResponse.json({ success: true })
}
