import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const categorie = searchParams.get("categorie")

  const where: Record<string, unknown> = {}
  if (categorie) where.categorie = categorie

  const fiches = await prisma.ficheCoutProduit.findMany({
    where,
    orderBy: [{ categorie: "asc" }, { nom: "asc" }],
  })

  return NextResponse.json(fiches)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE"])
  if (error) return error

  const body = await req.json()
  const { categorie, nom, fournisseur, contactFournisseur, coutUnitaire, fraisDedouanement, prixVente, imageUrl } = body

  if (!categorie?.trim()) return NextResponse.json({ error: "La catégorie est requise" }, { status: 400 })
  if (!nom?.trim()) return NextResponse.json({ error: "Le nom du produit est requis" }, { status: 400 })
  if (!fournisseur?.trim()) return NextResponse.json({ error: "Le fournisseur est requis" }, { status: 400 })
  if (coutUnitaire === undefined || isNaN(Number(coutUnitaire))) {
    return NextResponse.json({ error: "Le coût unitaire est invalide" }, { status: 400 })
  }

  const cout = Number(coutUnitaire)
  const frais = Number(fraisDedouanement ?? 0)

  const fiche = await prisma.ficheCoutProduit.create({
    data: {
      categorie: categorie.trim(),
      nom: nom.trim(),
      fournisseur: fournisseur.trim(),
      contactFournisseur: contactFournisseur?.trim() || null,
      coutUnitaire: cout,
      fraisDedouanement: frais,
      coutTotal: cout + frais,
      prixVente: prixVente != null && !isNaN(Number(prixVente)) ? Number(prixVente) : null,
      imageUrl: imageUrl || null,
    },
  })

  return NextResponse.json(fiche, { status: 201 })
}
