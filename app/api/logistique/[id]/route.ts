import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  const { id } = await params
  if (error) return error

  const logistique = await prisma.logistique.findUnique({
    where: { id: id },
    include: {
      etapes: { orderBy: { ordre: "asc" } },
      commande: { select: { id: true, numero: true, status: true, client: { select: { id: true, raisonSociale: true } } } },
    },
  })

  if (!logistique) return NextResponse.json({ error: "Logistique introuvable" }, { status: 404 })
  return NextResponse.json(logistique)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER", "CHARGE_OPERATIONS"])
  const { id } = await params
  if (error) return error

  const body = await req.json()

  const logistique = await prisma.logistique.update({
    where: { id: id },
    data: {
      ...body,
      dateExpeditionFournisseur: body.dateExpeditionFournisseur ? new Date(body.dateExpeditionFournisseur) : undefined,
      dateArriveeTransitaire: body.dateArriveeTransitaire ? new Date(body.dateArriveeTransitaire) : undefined,
      dateDebutDedouanement: body.dateDebutDedouanement ? new Date(body.dateDebutDedouanement) : undefined,
      dateFinDedouanement: body.dateFinDedouanement ? new Date(body.dateFinDedouanement) : undefined,
      dateDepartTransitaire: body.dateDepartTransitaire ? new Date(body.dateDepartTransitaire) : undefined,
      dateArriveeEntrepot: body.dateArriveeEntrepot ? new Date(body.dateArriveeEntrepot) : undefined,
    },
    include: { etapes: { orderBy: { ordre: "asc" } } },
  })

  return NextResponse.json(logistique)
}
