import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  const { id } = await params
  if (error) return error

  const produit = await prisma.produit.findUnique({ where: { id: id } })
  if (!produit) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })
  return NextResponse.json(produit)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE"])
  const { id } = await params
  if (error) return error

  const body = await req.json()

  const produit = await prisma.produit.update({
    where: { id: id },
    data: body,
  })
  return NextResponse.json(produit)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER"])
  const { id } = await params
  if (error) return error

  // Soft delete
  const produit = await prisma.produit.update({
    where: { id: id },
    data: { isActive: false },
  })
  return NextResponse.json(produit)
}
