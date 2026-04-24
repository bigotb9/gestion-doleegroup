import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE", "CHARGE_OPERATIONS"])
  const { id } = await params
  if (error) return error

  const body = await req.json()
  const { status, quantiteLivree, signatureUrl, signatureDate, nomSignataire, notes, assignedToId, datePrevue } = body

  const data: Record<string, unknown> = {}
  if (status !== undefined) data.status = status
  if (quantiteLivree !== undefined) data.quantiteLivree = quantiteLivree
  if (signatureUrl !== undefined) data.signatureUrl = signatureUrl
  if (signatureDate !== undefined) data.signatureDate = signatureDate ? new Date(signatureDate) : null
  if (nomSignataire !== undefined) data.nomSignataire = nomSignataire
  if (notes !== undefined) data.notes = notes
  if (assignedToId !== undefined) data.assignedToId = assignedToId
  if (datePrevue !== undefined) data.datePrevue = datePrevue ? new Date(datePrevue) : null

  try {
    const livraison = await prisma.livraison.update({
      where: { id },
      data,
      include: {
        client: { select: { id: true, raisonSociale: true } },
        assignedTo: { select: { id: true, name: true } },
        commande: { select: { id: true, numero: true, lignes: true } },
      },
    })
    return NextResponse.json(livraison)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
