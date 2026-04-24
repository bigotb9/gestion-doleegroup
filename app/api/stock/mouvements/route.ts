import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE", "CHARGE_OPERATIONS"])
  if (error) return error

  const { articleId, type, quantite, motif, commandeId } = await req.json()

  if (!articleId || !type || !quantite || quantite <= 0) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 })
  }

  try {
    const article = await prisma.articleStock.findUnique({ where: { id: articleId } })
    if (!article) return NextResponse.json({ error: "Article introuvable" }, { status: 404 })

    const quantiteAvant = article.quantite
    const quantiteApres = type === "ENTREE" ? quantiteAvant + quantite : quantiteAvant - quantite

    if (quantiteApres < 0) {
      return NextResponse.json({ error: "Stock insuffisant" }, { status: 400 })
    }

    const [mouvement] = await prisma.$transaction([
      prisma.stockMouvement.create({
        data: {
          articleId,
          commandeId: commandeId || null,
          type,
          quantite,
          quantiteAvant,
          quantiteApres,
          motif: motif || null,
        },
      }),
      prisma.articleStock.update({
        where: { id: articleId },
        data: { quantite: quantiteApres },
      }),
    ])

    return NextResponse.json(mouvement, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur"
    console.error("[stock mouvements]", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
