import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { generateNumeroCommande } from "@/lib/numero-generator"

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const search = searchParams.get("search")
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const pageSize = parseInt(searchParams.get("pageSize") ?? "25")
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc"

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { numero: { contains: search, mode: "insensitive" } },
      { client: { raisonSociale: { contains: search, mode: "insensitive" } } },
    ]
  }

  const [commandes, total] = await Promise.all([
    prisma.commande.findMany({
      where,
      include: {
        client: { select: { id: true, raisonSociale: true } },
        _count: { select: { paiements: true } },
      },
      orderBy: { createdAt: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.commande.count({ where }),
  ])

  return NextResponse.json({
    commandes,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE"])
  if (error) return error

  try {
    const { clientId, devisId, modePaiement, montantTotal, montantAvance, dateLivraisonSouhaitee, notes, lignes } = await req.json()

    // Vérifier qu'un devis n'est pas déjà lié à une autre commande
    if (devisId) {
      const existing = await prisma.commande.findFirst({ where: { devisId } })
      if (existing) {
        return NextResponse.json({ error: "Ce devis est déjà lié à une commande existante." }, { status: 400 })
      }
    }

    const numero = await generateNumeroCommande()

    const commande = await prisma.commande.create({
      data: {
        numero,
        clientId,
        devisId: devisId || undefined,
        modePaiement,
        montantTotal,
        montantAvance: montantAvance ?? undefined,
        dateLivraisonSouhaitee: dateLivraisonSouhaitee ? new Date(dateLivraisonSouhaitee) : undefined,
        notes: notes || undefined,
        lignes: lignes?.length
          ? {
              create: lignes.map((l: {
                designation: string
                description?: string
                quantite: number
                prixUnitaire: number
                remise?: number
                coutAchat?: number
                fraisDedouanement?: number
                fraisTransport?: number
              }, idx: number) => ({
                designation: l.designation,
                description: l.description || undefined,
                quantite: l.quantite,
                prixUnitaire: l.prixUnitaire,
                remise: l.remise ?? 0,
                total: l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100),
                ordre: idx,
                coutAchat: l.coutAchat || null,
                fraisDedouanement: l.fraisDedouanement || null,
                fraisTransport: l.fraisTransport || null,
              })),
            }
          : undefined,
      },
      include: {
        lignes: true,
        client: { select: { id: true, raisonSociale: true } },
      },
    })

    return NextResponse.json(commande, { status: 201 })
  } catch (err) {
    console.error("[POST /api/commandes]", err)
    const message = err instanceof Error ? err.message : "Erreur inconnue"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
