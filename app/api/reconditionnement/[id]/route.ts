import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  const { id } = await params
  if (error) return error

  const reconditionnement = await prisma.reconditionnement.findUnique({
    where: { id: id },
    include: {
      articlesUtilises: { include: { article: true } },
      commande: { select: { id: true, numero: true, status: true, client: { select: { id: true, raisonSociale: true } } } },
    },
  })

  if (!reconditionnement) return NextResponse.json({ error: "Reconditionnement introuvable" }, { status: 404 })
  return NextResponse.json(reconditionnement)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER", "CHARGE_OPERATIONS"])
  const { id } = await params
  if (error) return error

  const { articlesUtilises, ...rest } = await req.json()

  const updated = await prisma.reconditionnement.update({
    where: { id: id },
    data: {
      ...rest,
      dateDebut: rest.dateDebut ? new Date(rest.dateDebut) : undefined,
      dateFin: rest.dateFin ? new Date(rest.dateFin) : undefined,
      ...(articlesUtilises && {
        articlesUtilises: {
          deleteMany: {},
          create: articlesUtilises.map((a: { articleId: string; quantiteUtilisee: number }) => ({
            articleId: a.articleId,
            quantiteUtilisee: a.quantiteUtilisee,
          })),
        },
      }),
    },
    include: { articlesUtilises: { include: { article: true } } },
  })

  return NextResponse.json(updated)
}
