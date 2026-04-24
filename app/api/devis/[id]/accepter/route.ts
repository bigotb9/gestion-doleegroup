import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { generateNumeroCommande } from "@/lib/numero-generator"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth(["MANAGER"])
  const { id } = await params
  if (error) return error

  const devis = await prisma.devis.findUnique({
    where: { id: id },
    include: { lignes: true },
  })
  if (!devis) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })
  if (!["ENVOYE", "VALIDE"].includes(devis.status)) {
    return NextResponse.json({ error: "Le devis doit être envoyé ou validé pour être accepté" }, { status: 400 })
  }

  const existing = await prisma.commande.findFirst({ where: { devisId: id } })
  if (existing) {
    return NextResponse.json({ error: "Une commande existe déjà pour ce devis" }, { status: 400 })
  }

  const numeroCommande = await generateNumeroCommande()

  const [updatedDevis, commande] = await prisma.$transaction([
    prisma.devis.update({
      where: { id: id },
      data: { status: "ACCEPTE" },
    }),
    prisma.commande.create({
      data: {
        numero: numeroCommande,
        clientId: devis.clientId,
        devisId: devis.id,
        modePaiement: "BON_DE_COMMANDE",
        montantTotal: devis.total,
        status: "EN_ATTENTE_CONFIRMATION",
        lignes: {
          create: devis.lignes.map((l, idx) => ({
            designation: l.designation,
            description: l.description,
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire as import("@prisma/client").Prisma.Decimal,
            total: l.total as import("@prisma/client").Prisma.Decimal,
            ordre: idx,
          })),
        },
      },
      include: {
        lignes: true,
        client: { select: { id: true, raisonSociale: true } },
      },
    }),
  ])

  return NextResponse.json({ devis: updatedDevis, commande }, { status: 201 })
}
