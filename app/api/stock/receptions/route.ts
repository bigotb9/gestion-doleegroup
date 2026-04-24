import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

// GET — liste toutes les réceptions (avec infos commande)
export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const commandeId = searchParams.get("commandeId")

  const receptions = await prisma.receptionStock.findMany({
    where: commandeId ? { commandeId } : undefined,
    include: {
      commande: {
        select: {
          id: true,
          numero: true,
          status: true,
          client: { select: { raisonSociale: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(receptions)
}

// POST — initialise les réceptions depuis les lignes d'une commande
export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE", "CHARGE_OPERATIONS"])
  if (error) return error

  const { commandeId } = await req.json()
  if (!commandeId) return NextResponse.json({ error: "commandeId requis" }, { status: 400 })

  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    include: { lignes: { orderBy: { ordre: "asc" } } },
  })
  if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

  // Vérifie si des réceptions existent déjà pour cette commande
  const existing = await prisma.receptionStock.findMany({ where: { commandeId } })
  if (existing.length > 0) {
    return NextResponse.json({ error: "Les réceptions existent déjà pour cette commande" }, { status: 400 })
  }

  const receptions = await prisma.receptionStock.createMany({
    data: commande.lignes.map((ligne) => ({
      commandeId,
      designation: ligne.designation,
      quantiteCommandee: ligne.quantite,
    })),
  })

  const created = await prisma.receptionStock.findMany({ where: { commandeId } })
  return NextResponse.json(created, { status: 201 })
}
