import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { generateNumeroBCF } from "@/lib/numero-generator"

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE"])
  if (error) return error

  const {
    commandeId,
    fournisseurId,
    designation,
    devise,
    coutUnitaire,
    quantite,
    tauxChange,
    dateCommandeFournisseur,
    delaiProduction,
    notesFournisseur,
  } = await req.json()

  const coutTotal = coutUnitaire * quantite
  const coutTotalCFA = tauxChange ? coutTotal * tauxChange : null

  const commande = await prisma.commande.findUnique({ where: { id: commandeId } })
  if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

  const numeroBCF = await generateNumeroBCF()

  const production = await prisma.production.create({
    data: {
      commandeId,
      fournisseurId,
      designation: designation?.trim() || null,
      devise,
      coutUnitaire,
      quantite,
      coutTotal,
      tauxChange,
      coutTotalCFA,
      dateCommandeFournisseur: dateCommandeFournisseur ? new Date(dateCommandeFournisseur) : undefined,
      delaiProduction,
      notesFournisseur,
      numeroBCF,
    },
    include: { fournisseur: true },
  })

  // Pas d'auto-transition ici : la commande passe EN_PRODUCTION uniquement
  // lorsque le fournisseur est intégralement soldé (voir route paiements)

  return NextResponse.json(production, { status: 201 })
}
