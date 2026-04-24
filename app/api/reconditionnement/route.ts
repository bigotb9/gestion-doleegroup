import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const commandeId = searchParams.get("commandeId")

  try {
    if (commandeId) {
      const reconditionnements = await prisma.reconditionnement.findMany({
        where: { commandeId },
        include: { articlesUtilises: { include: { article: true } } },
        orderBy: { createdAt: "asc" },
      })
      return NextResponse.json({ reconditionnements })
    }

    const reconditionnements = await prisma.reconditionnement.findMany({
      orderBy: { createdAt: "desc" },
      include: { commande: { select: { id: true, numero: true } } },
    })
    return NextResponse.json(reconditionnements)
  } catch (err) {
    console.error("[GET /api/reconditionnement]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE", "CHARGE_OPERATIONS"])
  if (error) return error

  const { commandeId, label, typePersonalisation, instructions, fichierBAT, notes } = await req.json()

  const commande = await prisma.commande.findUnique({ where: { id: commandeId } })
  if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

  const reconditionnement = await prisma.reconditionnement.create({
    data: {
      commandeId,
      label: label ?? null,
      typePersonalisation,
      instructions,
      fichierBAT,
      notes: notes ?? null,
    },
  })

  await prisma.commande.update({
    where: { id: commandeId },
    data: { status: "EN_RECONDITIONNEMENT" },
  })

  return NextResponse.json(reconditionnement, { status: 201 })
}
