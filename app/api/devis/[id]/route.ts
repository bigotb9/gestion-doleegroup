import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requirePermission("devis:read")
  const { id } = await params
  if (error) return error

  const devis = await prisma.devis.findUnique({
    where: { id: id },
    include: {
      lignes: { include: { produit: true }, orderBy: { ordre: "asc" } },
      client: true,
      createdBy: { select: { id: true, name: true } },
      validatedBy: { select: { id: true, name: true } },
      commandes: { select: { id: true, numero: true }, take: 1 },
    },
  })

  if (!devis) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })

  // Normalise commandes[] → commande for backward compat
  const { commandes, ...rest } = devis
  return NextResponse.json({ ...rest, commande: commandes[0] ?? null })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requirePermission("devis:edit")
  const { id } = await params
  if (error) return error

  try {
    const existing = await prisma.devis.findUnique({ where: { id: id } })
    if (!existing) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })
    if (existing.status !== "BROUILLON") {
      return NextResponse.json({ error: "Seuls les devis en brouillon peuvent être modifiés" }, { status: 400 })
    }

    const { lignes, taxe, dateValidite, ...rest } = await req.json()

    let updateData: Record<string, unknown> = { ...rest }

    if (dateValidite) {
      updateData.dateValidite = new Date(dateValidite)
    }

    if (lignes) {
      const sousTotal = lignes.reduce((acc: number, l: { quantite: number; prixUnitaire: number; remise?: number; remiseFixe?: number }) => {
        return acc + Math.max(0, l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100) - (l.remiseFixe ?? 0))
      }, 0)
      const taxeAmount = taxe ?? Number(existing.taxe)
      const total = sousTotal + taxeAmount

      updateData = { ...updateData, sousTotal, taxe: taxeAmount, total }

      await prisma.devisLigne.deleteMany({ where: { devisId: id } })
      await prisma.devisLigne.createMany({
        data: lignes.map((l: { designation: string; produitId?: string; quantite: number; prixUnitaire: number; remise?: number; remiseFixe?: number; description?: string }, idx: number) => ({
          devisId: id,
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
      })
    } else if (taxe !== undefined) {
      const taxeAmount = taxe
      const total = Number(existing.sousTotal) + taxeAmount
      updateData = { ...updateData, taxe: taxeAmount, total }
    }

    const devis = await prisma.devis.update({
      where: { id: id },
      data: updateData,
      include: { lignes: { orderBy: { ordre: "asc" } } },
    })

    await logAudit({
      userId: session!.user.id,
      userEmail: session!.user.email,
      action: "UPDATE",
      entity: "DEVIS",
      entityId: id,
      entityRef: existing.numero,
    })

    return NextResponse.json(devis)
  } catch (err) {
    console.error("PATCH /api/devis/[id]", err)
    const message = err instanceof Error ? err.message : "Erreur interne"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requirePermission("devis:validate")
  const { id } = await params
  if (error) return error

  const existing = await prisma.devis.findUnique({ where: { id: id } })
  if (!existing) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })
  if (existing.status !== "BROUILLON") {
    return NextResponse.json({ error: "Seuls les devis en brouillon peuvent être supprimés" }, { status: 400 })
  }

  await logAudit({
    userId: session!.user.id,
    userEmail: session!.user.email,
    action: "DELETE",
    entity: "DEVIS",
    entityId: id,
    entityRef: existing.numero,
  })

  await prisma.devis.delete({ where: { id: id } })
  return NextResponse.json({ success: true })
}
