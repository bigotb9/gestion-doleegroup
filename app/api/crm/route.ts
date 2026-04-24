import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") as string | null
  const search = searchParams.get("search")
  const page = parseInt(searchParams.get("page") ?? "1")
  const pageSize = 20

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { raisonSociale: { contains: search, mode: "insensitive" } },
      { contactNom: { contains: search, mode: "insensitive" } },
      { contactEmail: { contains: search, mode: "insensitive" } },
    ]
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        _count: { select: { devis: true, commandes: true } },
        commandes: {
          where: { status: { notIn: ["ANNULEE"] } },
          select: {
            montantTotal: true,
            statusPaiement: true,
            paiements: {
              where: { isConfirmed: true },
              select: { montant: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.client.count({ where }),
  ])

  // Calculer le solde en cours par client
  const clientsWithBalance = clients.map((c) => {
    const totalCmd = c.commandes.reduce((s, cmd) => s + Number(cmd.montantTotal), 0)
    const totalPaye = c.commandes.reduce(
      (s, cmd) => s + cmd.paiements.reduce((ps, p) => ps + Number(p.montant), 0),
      0
    )
    const soldeEnCours = Math.max(0, totalCmd - totalPaye)
    const { commandes, ...clientWithoutCommandes } = c
    return { ...clientWithoutCommandes, soldeEnCours, totalCmd, totalPaye }
  })

  return NextResponse.json({ clients: clientsWithBalance, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const body = await req.json()

  const client = await prisma.client.create({ data: body })
  return NextResponse.json(client, { status: 201 })
}
