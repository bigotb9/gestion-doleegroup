import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  const { id } = await params
  if (error) return error

  const production = await prisma.production.findUnique({
    where: { id: id },
    include: {
      fournisseur: true,
      commande: { select: { id: true, numero: true, status: true, client: { select: { id: true, raisonSociale: true } } } },
      paiementsFournisseur: { orderBy: { datePaiement: "asc" } },
    },
  })

  if (!production) return NextResponse.json({ error: "Production introuvable" }, { status: 404 })
  return NextResponse.json(production)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE"])
  const { id } = await params
  if (error) return error

  const body = await req.json()

  // Recalculate totals if cost fields changed
  const existing = await prisma.production.findUnique({ where: { id: id } })
  if (!existing) return NextResponse.json({ error: "Production introuvable" }, { status: 404 })

  const coutUnitaire = body.coutUnitaire ?? Number(existing.coutUnitaire)
  const quantite = body.quantite ?? existing.quantite
  const tauxChange = body.tauxChange ?? (existing.tauxChange ? Number(existing.tauxChange) : null)

  const coutTotal = coutUnitaire * quantite
  const coutTotalCFA = tauxChange ? coutTotal * tauxChange : null

  const production = await prisma.production.update({
    where: { id: id },
    data: {
      ...body,
      coutTotal,
      coutTotalCFA,
      dateCommandeFournisseur: body.dateCommandeFournisseur ? new Date(body.dateCommandeFournisseur) : undefined,
      dateDebutProduction: body.dateDebutProduction ? new Date(body.dateDebutProduction) : undefined,
      dateFinProductionPrevue: body.dateFinProductionPrevue ? new Date(body.dateFinProductionPrevue) : undefined,
      dateFinProductionReelle: body.dateFinProductionReelle ? new Date(body.dateFinProductionReelle) : undefined,
    },
  })

  return NextResponse.json(production)
}
