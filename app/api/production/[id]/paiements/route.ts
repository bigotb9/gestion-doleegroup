import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

// POST — enregistrer un paiement fournisseur
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER"])
  const { id: productionId } = await params
  if (error) return error

  const { montant, datePaiement, preuvePaiementUrl, notes } = await req.json()

  if (!montant || montant <= 0) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 })
  }
  if (!datePaiement) {
    return NextResponse.json({ error: "Date de paiement requise" }, { status: 400 })
  }

  const production = await prisma.production.findUnique({
    where: { id: productionId },
    include: {
      fournisseur: true,
      commande: true,
      paiementsFournisseur: true,
    },
  })
  if (!production) return NextResponse.json({ error: "Production introuvable" }, { status: 404 })

  // Créer la dépense associée
  const depense = await prisma.depense.create({
    data: {
      titre: `Paiement fournisseur — ${production.fournisseur.nom}`,
      montant,
      categorie: "Fournisseurs",
      date: new Date(datePaiement),
      description: `Commande ${production.commande.numero} — paiement partiel`,
      justificatifUrl: preuvePaiementUrl ?? null,
    },
  })

  // Créer le paiement fournisseur
  const paiement = await prisma.paiementFournisseur.create({
    data: {
      productionId,
      montant,
      datePaiement: new Date(datePaiement),
      preuvePaiementUrl: preuvePaiementUrl ?? null,
      notes: notes ?? null,
      depenseId: depense.id,
    },
  })

  // Démarrer la production dès le premier paiement (partiel ou total)
  if (!production.dateDebutProduction) {
    const dateDebutProduction = new Date()
    let dateFinProductionPrevue: Date | undefined
    if (production.delaiProduction) {
      dateFinProductionPrevue = new Date(dateDebutProduction)
      dateFinProductionPrevue.setDate(dateFinProductionPrevue.getDate() + production.delaiProduction)
    }
    await prisma.production.update({
      where: { id: productionId },
      data: {
        dateDebutProduction,
        ...(dateFinProductionPrevue ? { dateFinProductionPrevue } : {}),
      },
    })
  }

  // Passer la commande en EN_PRODUCTION si elle ne l'est pas encore
  if (production.commande.status !== "EN_PRODUCTION") {
    await prisma.commande.update({
      where: { id: production.commandeId },
      data: { status: "EN_PRODUCTION" },
    })
  }

  return NextResponse.json(paiement, { status: 201 })
}

// DELETE — supprimer un paiement fournisseur
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER"])
  const { id: productionId } = await params
  if (error) return error

  const { paiementId } = await req.json()
  if (!paiementId) return NextResponse.json({ error: "paiementId requis" }, { status: 400 })

  const paiement = await prisma.paiementFournisseur.findUnique({ where: { id: paiementId } })
  if (!paiement || paiement.productionId !== productionId) {
    return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 })
  }

  // Supprimer la dépense liée
  if (paiement.depenseId) {
    await prisma.depense.delete({ where: { id: paiement.depenseId } }).catch(() => null)
  }

  await prisma.paiementFournisseur.delete({ where: { id: paiementId } })

  return NextResponse.json({ success: true })
}
