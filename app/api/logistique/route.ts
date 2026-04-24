import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

const DEFAULT_ETAPES = [
  { etape: "Chez le fournisseur", ordre: 1, estFait: true, dateReelle: new Date() },
  { etape: "Expédition", ordre: 2 },
  { etape: "Chez le transitaire", ordre: 3 },
  { etape: "Livraison bureau", ordre: 4 },
]

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const logistiques = await prisma.logistique.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        commandeId: true,
        status: true,
        transitaireNom: true,
        dateArriveeEntrepot: true,
        commande: {
          select: {
            id: true,
            numero: true,
            client: { select: { raisonSociale: true } },
          },
        },
      },
    })
    return NextResponse.json(logistiques)
  } catch (err) {
    console.error("[GET /api/logistique]", err)
    const message = err instanceof Error ? err.message : "Erreur inconnue"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE", "CHARGE_OPERATIONS"])
  if (error) return error

  try {
    const body = await req.json()
    const { commandeId, ...rest } = body

    const commande = await prisma.commande.findUnique({ where: { id: commandeId } })
    if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

    const logistique = await prisma.logistique.create({
      data: {
        commandeId,
        ...rest,
        etapes: { create: DEFAULT_ETAPES },
      },
      include: { etapes: { orderBy: { ordre: "asc" } } },
    })

    await prisma.commande.update({
      where: { id: commandeId },
      data: { status: "EN_LOGISTIQUE" },
    })

    // Créer automatiquement une dépense pour les frais de transport et dédouanement
    if (rest.fraisLogistiqueCFA && Number(rest.fraisLogistiqueCFA) > 0) {
      const commandeForDepense = await prisma.commande.findUnique({
        where: { id: commandeId },
        select: { numero: true },
      })
      await prisma.depense.create({
        data: {
          titre: `Frais de transport et dédouanement — Commande ${commandeForDepense?.numero ?? commandeId}`,
          montant: Number(rest.fraisLogistiqueCFA),
          categorie: "Transport et dédouanement",
          date: new Date(),
          description: `Enregistré automatiquement lors de la création de la logistique.`,
        },
      })
    }

    return NextResponse.json(logistique, { status: 201 })
  } catch (err) {
    console.error("[POST /api/logistique]", err)
    const message = err instanceof Error ? err.message : "Erreur inconnue"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
