import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const commandeId = searchParams.get("commandeId")

  if (commandeId) {
    const livraisons = await prisma.livraison.findMany({
      where: { commandeId },
      include: {
        lignes: { include: { reception: true } },
        client: {
          select: { id: true, raisonSociale: true, adresse: true, contactNom: true, contactPhone: true },
        },
        commande: {
          select: { id: true, numero: true },
        },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ livraisons })
  }

  const role = session!.user.role as string
  const userId = session!.user.id
  const where = role === "CHARGE_OPERATIONS" ? { assignedToId: userId } : {}

  const livraisons = await prisma.livraison.findMany({
    where,
    include: {
      client: { select: { id: true, raisonSociale: true } },
      commande: { select: { id: true, numero: true, status: true } },
      assignedTo: { select: { id: true, name: true } },
      lignes: true,
    },
    orderBy: { datePrevue: "asc" },
  })

  return NextResponse.json(livraisons)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE"])
  if (error) return error

  const {
    commandeId,
    adresseLivraison,
    contactLivraison,
    datePrevue,
    assignedToId,
    notes,
    nombreSignaturesClient,
    lignes, // [{ receptionId, designation, quantite }]
  } = await req.json()

  if (!adresseLivraison || !datePrevue) {
    return NextResponse.json({ error: "Adresse et date requises" }, { status: 400 })
  }
  if (!lignes || lignes.length === 0) {
    return NextResponse.json({ error: "Au moins une ligne de livraison requise" }, { status: 400 })
  }

  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    select: { id: true, clientId: true },
  })
  if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

  try {
    const livraison = await prisma.livraison.create({
      data: {
        commandeId,
        clientId: commande.clientId,
        adresseLivraison,
        contactLivraison: contactLivraison || null,
        datePrevue: new Date(datePrevue),
        assignedToId: assignedToId || null,
        notes: notes || null,
        nombreSignaturesClient: nombreSignaturesClient === 2 ? 2 : 1,
        lignes: {
          create: lignes.map((l: { receptionId: string; designation: string; quantite: number }) => ({
            receptionId: l.receptionId,
            designation: l.designation,
            quantite: l.quantite,
          })),
        },
      },
      include: {
        lignes: { include: { reception: true } },
        client: { select: { id: true, raisonSociale: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json(livraison, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
