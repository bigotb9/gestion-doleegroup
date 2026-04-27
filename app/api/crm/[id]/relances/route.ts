import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requirePermission("crm:read")
  const { id } = await params
  if (error) return error

  const relances = await prisma.relance.findMany({
    where: { clientId: id },
    orderBy: { dateRelance: "asc" },
  })

  return NextResponse.json(relances)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requirePermission("crm:edit")
  const { id } = await params
  if (error) return error

  const { dateRelance, objet, notes } = await req.json()

  const relance = await prisma.relance.create({
    data: {
      clientId: id,
      dateRelance: new Date(dateRelance),
      objet,
      notes,
    },
  })

  return NextResponse.json(relance, { status: 201 })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requirePermission("crm:edit")
  const { id } = await params
  if (error) return error

  const { relanceId, estFaite } = await req.json()

  const relance = await prisma.relance.update({
    where: { id: relanceId, clientId: id },
    data: {
      estFaite,
      dateFaite: estFaite ? new Date() : null,
    },
  })

  return NextResponse.json(relance)
}
