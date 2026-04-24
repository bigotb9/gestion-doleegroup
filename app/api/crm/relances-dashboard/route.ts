import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE"])
  if (error) return error

  const now = new Date()
  const il7jours = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const il30jours = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // 1. Devis envoyés sans réponse depuis plus de 7 jours
  const devisEnAttente = await prisma.devis.findMany({
    where: {
      status: "ENVOYE",
      updatedAt: { lte: il7jours },
    },
    orderBy: { updatedAt: "asc" },
    select: {
      id: true,
      numero: true,
      total: true,
      devise: true,
      updatedAt: true,
      client: { select: { id: true, raisonSociale: true, contactNom: true, contactPhone: true } },
    },
  })

  // 2. Commandes CONFIRMEE sans paiement confirmé depuis plus de 7 jours
  const commandesSansPaiement = await prisma.commande.findMany({
    where: {
      status: { in: ["CONFIRMEE", "EN_PRODUCTION", "EN_LOGISTIQUE", "EN_RECONDITIONNEMENT"] },
      statusPaiement: "EN_ATTENTE",
      createdAt: { lte: il7jours },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      numero: true,
      montantTotal: true,
      devise: true,
      createdAt: true,
      client: { select: { id: true, raisonSociale: true, contactNom: true, contactPhone: true } },
    },
  })

  // 3. Commandes LIVREE sans facture associée
  const commandesSansFacture = await prisma.commande.findMany({
    where: {
      status: "LIVREE",
      factures: { none: {} },
    },
    orderBy: { updatedAt: "asc" },
    take: 20,
    select: {
      id: true,
      numero: true,
      montantTotal: true,
      devise: true,
      updatedAt: true,
      client: { select: { id: true, raisonSociale: true, contactNom: true, contactPhone: true } },
    },
  })

  // 4. Clients sans aucun contact (pas de devis ni commande) depuis 30 jours
  const clientsSansContact = await prisma.client.findMany({
    where: {
      status: { in: ["PROSPECT", "CONTACTE", "NEGOCIATION"] },
      updatedAt: { lte: il30jours },
    },
    orderBy: { updatedAt: "asc" },
    take: 20,
    select: {
      id: true,
      raisonSociale: true,
      contactNom: true,
      contactPhone: true,
      status: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({
    devisEnAttente,
    commandesSansPaiement,
    commandesSansFacture,
    clientsSansContact,
    totaux: {
      devis: devisEnAttente.length,
      paiements: commandesSansPaiement.length,
      factures: commandesSansFacture.length,
      clients: clientsSansContact.length,
    },
  })
}
