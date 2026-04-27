import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requirePermission("facturation:read")
  const { id } = await params
  if (error) return error

  const facture = await prisma.facture.findUnique({
    where: { id: id },
    include: {
      commande: {
        select: {
          id: true,
          numero: true,
          devise: true,
          montantTotal: true,
          dateCommande: true,
          client: true,
          lignes: { orderBy: { ordre: "asc" } },
          paiements: { where: { isConfirmed: true }, select: { montant: true } },
        },
      },
    },
  })

  if (!facture) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })
  return NextResponse.json(facture)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requirePermission("facturation:manage")
  const { id } = await params
  if (error) return error

  const body = await req.json()

  const facture = await prisma.facture.update({
    where: { id: id },
    data: {
      ...body,
      dateEcheance: body.dateEcheance ? new Date(body.dateEcheance) : undefined,
      datePaiement: body.datePaiement ? new Date(body.datePaiement) : undefined,
    },
  })

  return NextResponse.json(facture)
}
