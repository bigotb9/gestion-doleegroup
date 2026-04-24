import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  const { id } = await params
  if (error) return error

  const client = await prisma.client.findUnique({
    where: { id: id },
    include: {
      notes: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
      relances: { orderBy: { dateRelance: "asc" } },
      devis: { orderBy: { createdAt: "desc" }, select: { id: true, numero: true, status: true, total: true, dateEmission: true } },
      commandes: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true, numero: true, status: true, montantTotal: true, dateCommande: true, statusPaiement: true,
          paiements: { where: { isConfirmed: true }, select: { montant: true } },
        },
      },
      contacts: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 })
  return NextResponse.json(client)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE"])
  const { id } = await params
  if (error) return error

  const body = await req.json()

  const client = await prisma.client.update({
    where: { id: id },
    data: body,
  })
  return NextResponse.json(client)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER"])
  const { id } = await params
  if (error) return error

  await prisma.client.delete({ where: { id: id } })
  return NextResponse.json({ success: true })
}
