import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  const { id } = await params
  if (error) return error

  const fiche = await prisma.ficheCoutProduit.findUnique({ where: { id } })
  if (!fiche) return NextResponse.json({ error: "Fiche introuvable" }, { status: 404 })
  return NextResponse.json(fiche)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE"])
  const { id } = await params
  if (error) return error

  const body = await req.json()
  const { categorie, nom, fournisseur, contactFournisseur, coutUnitaire, fraisDedouanement, prixVente, imageUrl } = body

  const cout = coutUnitaire !== undefined ? Number(coutUnitaire) : undefined
  const frais = fraisDedouanement !== undefined ? Number(fraisDedouanement) : undefined

  // Recompute total if either cost changes
  let coutTotal: number | undefined
  if (cout !== undefined || frais !== undefined) {
    const existing = await prisma.ficheCoutProduit.findUnique({
      where: { id },
      select: { coutUnitaire: true, fraisDedouanement: true },
    })
    if (existing) {
      const c = cout ?? Number(existing.coutUnitaire)
      const f = frais ?? Number(existing.fraisDedouanement)
      coutTotal = c + f
    }
  }

  const data: Record<string, unknown> = {}
  if (categorie !== undefined) data.categorie = categorie.trim()
  if (nom !== undefined) data.nom = nom.trim()
  if (fournisseur !== undefined) data.fournisseur = fournisseur.trim()
  if (contactFournisseur !== undefined) data.contactFournisseur = contactFournisseur?.trim() || null
  if (cout !== undefined) data.coutUnitaire = cout
  if (frais !== undefined) data.fraisDedouanement = frais
  if (coutTotal !== undefined) data.coutTotal = coutTotal
  if (prixVente !== undefined) data.prixVente = prixVente != null && !isNaN(Number(prixVente)) ? Number(prixVente) : null
  if (imageUrl !== undefined) data.imageUrl = imageUrl || null

  const fiche = await prisma.ficheCoutProduit.update({ where: { id }, data })
  return NextResponse.json(fiche)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER"])
  const { id } = await params
  if (error) return error

  await prisma.ficheCoutProduit.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
