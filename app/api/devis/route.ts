import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { generateNumeroDevis } from "@/lib/numero-generator"

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get("clientId")
  const status = searchParams.get("status")
  const search = searchParams.get("search")

  const where: Record<string, unknown> = {}
  if (clientId) where.clientId = clientId
  if (status) where.status = status
  if (search) {
    where.OR = [
      { numero: { contains: search, mode: "insensitive" } },
      { client: { raisonSociale: { contains: search, mode: "insensitive" } } },
    ]
  }

  const devis = await prisma.devis.findMany({
    where,
    include: {
      client: { select: { id: true, raisonSociale: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(devis)
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { clientId, contactId, dateValidite, lignes, notes, conditionsPaiement, taxe, devise, delaiLivraison, projet } = await req.json()

  const numero = await generateNumeroDevis()

  const sousTotal = lignes.reduce((acc: number, l: { quantite: number; prixUnitaire: number; remise?: number; remiseFixe?: number }) => {
    const lineTotal = l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100) - (l.remiseFixe ?? 0)
    return acc + Math.max(0, lineTotal)
  }, 0)

  const taxeAmount = taxe ?? 0
  const total = sousTotal + taxeAmount

  const devis = await prisma.devis.create({
    data: {
      numero,
      clientId,
      contactId: contactId ?? null,
      createdById: session!.user.id,
      dateValidite: new Date(dateValidite),
      status: "BROUILLON",
      sousTotal,
      taxe: taxeAmount,
      total,
      projet: projet ?? null,
      notes,
      conditionsPaiement,
      devise: devise ?? "CFA",
      delaiLivraison: delaiLivraison ?? null,
      lignes: {
        create: lignes.map((l: { designation: string; produitId?: string; quantite: number; prixUnitaire: number; remise?: number; remiseFixe?: number; description?: string }, idx: number) => ({
          designation: l.designation,
          produitId: l.produitId,
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
          remise: l.remise ?? 0,
          remiseFixe: l.remiseFixe ?? 0,
          description: l.description,
          total: Math.max(0, l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100) - (l.remiseFixe ?? 0)),
          ordre: idx,
        })),
      },
    },
    include: {
      lignes: true,
      client: { select: { id: true, raisonSociale: true } },
    },
  })

  return NextResponse.json(devis, { status: 201 })
}
