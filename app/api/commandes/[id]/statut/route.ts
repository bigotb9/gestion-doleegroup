import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

const VALID_TRANSITIONS: Record<string, string[]> = {
  EN_ATTENTE_CONFIRMATION: ["CONFIRMEE", "ANNULEE"],
  CONFIRMEE: ["EN_PRODUCTION", "ANNULEE"],
  EN_PRODUCTION: ["EN_LOGISTIQUE", "ANNULEE"],
  EN_LOGISTIQUE: ["EN_RECONDITIONNEMENT", "PRETE_LIVRAISON"],
  EN_RECONDITIONNEMENT: ["PRETE_LIVRAISON"],
  PRETE_LIVRAISON: ["LIVREE"],
  LIVREE: [],
  ANNULEE: [],
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER", "CHARGE_OPERATIONS"])
  const { id } = await params
  if (error) return error

  const { status } = await req.json()

  const commande = await prisma.commande.findUnique({ where: { id: id } })
  if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

  const allowed = VALID_TRANSITIONS[commande.status] ?? []
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Transition non autorisée : la commande est actuellement "${commande.status}"` },
      { status: 400 }
    )
  }

  try {
    const updated = await prisma.commande.update({
      where: { id: id },
      data: { status },
    })
    return NextResponse.json(updated)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
