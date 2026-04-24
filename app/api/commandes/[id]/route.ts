import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  const { id } = await params
  if (error) return error

  const commande = await prisma.commande.findUnique({
    where: { id },
    include: {
      client: true,
      lignes: { orderBy: { ordre: "asc" } },
      paiements: { include: { confirmedBy: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
      productions: {
        include: {
          fournisseur: true,
          paiementsFournisseur: { orderBy: { datePaiement: "asc" } },
        },
        orderBy: { createdAt: "asc" },
      },
      logistiques: { include: { etapes: { orderBy: { ordre: "asc" } } }, orderBy: { createdAt: "asc" } },
      reconditionnements: { include: { articlesUtilises: { include: { article: true } } }, orderBy: { createdAt: "asc" } },
      livraisons: {
        include: {
          lignes: { include: { reception: true } },
          assignedTo: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      factures: { orderBy: { createdAt: "desc" } },
      confirmedBy: { select: { id: true, name: true } },
      devis: { select: { id: true, numero: true } },
    },
  })

  if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
  return NextResponse.json(commande)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE"])
  const { id } = await params
  if (error) return error

  const body = await req.json()
  const {
    notes,
    dateLivraisonPrevue,
    dateLivraisonSouhaitee,
    bonDeCommande,
    montantTotal,
    montantAvance,
    modePaiement,
    status,
  } = body

  const data: Record<string, unknown> = {}
  if (notes !== undefined) data.notes = notes
  if (dateLivraisonPrevue !== undefined)
    data.dateLivraisonPrevue = dateLivraisonPrevue ? new Date(dateLivraisonPrevue) : null
  if (dateLivraisonSouhaitee !== undefined)
    data.dateLivraisonSouhaitee = dateLivraisonSouhaitee ? new Date(dateLivraisonSouhaitee) : null
  if (bonDeCommande !== undefined) data.bonDeCommande = bonDeCommande
  if (montantTotal !== undefined) data.montantTotal = montantTotal
  if (montantAvance !== undefined) data.montantAvance = montantAvance ?? null
  if (modePaiement !== undefined) data.modePaiement = modePaiement
  if (status !== undefined) data.status = status

  try {
    const commande = await prisma.commande.update({ where: { id }, data })
    return NextResponse.json(commande)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER"])
  const { id } = await params
  if (error) return error

  const commande = await prisma.commande.findUnique({
    where: { id },
    select: { status: true, numero: true },
  })
  if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
  if (commande.status === "LIVREE") {
    return NextResponse.json({ error: "Impossible de supprimer une commande livrée" }, { status: 400 })
  }

  try {
    await prisma.commande.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
