import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  const { id } = await params
  if (error) return error

  const {
    signatureDataUrl,
    nomSignataire,
    signatureDataUrl2,
    nomSignataire2,
    signatureChargeDataUrl,
    nomSignataireCharge,
  } = await req.json()

  const livraison = await prisma.livraison.findUnique({
    where: { id },
    include: {
      lignes: { include: { reception: true } },
    },
  })
  if (!livraison) return NextResponse.json({ error: "Livraison introuvable" }, { status: 404 })

  if (!signatureDataUrl || !nomSignataire) {
    return NextResponse.json({ error: "Signature client 1 manquante" }, { status: 400 })
  }
  if (livraison.nombreSignaturesClient >= 2 && (!signatureDataUrl2 || !nomSignataire2)) {
    return NextResponse.json({ error: "Signature client 2 manquante" }, { status: 400 })
  }
  if (!signatureChargeDataUrl || !nomSignataireCharge) {
    return NextResponse.json({ error: "Signature du chargé de livraison manquante" }, { status: 400 })
  }

  const now = new Date()

  const updated = await prisma.livraison.update({
    where: { id },
    data: {
      signatureUrl: signatureDataUrl,
      signatureDate: now,
      nomSignataire,
      signatureUrl2: livraison.nombreSignaturesClient >= 2 ? signatureDataUrl2 : null,
      nomSignataire2: livraison.nombreSignaturesClient >= 2 ? nomSignataire2 : null,
      signatureChargeUrl: signatureChargeDataUrl,
      signatureChargeDate: now,
      nomSignataireCharge,
      status: "LIVREE",
      dateReelle: now,
    },
  })

  // Mettre à jour quantiteLivree dans ReceptionStock pour chaque ligne
  for (const ligne of livraison.lignes) {
    await prisma.receptionStock.update({
      where: { id: ligne.receptionId },
      data: {
        quantiteLivree: { increment: ligne.quantite },
      },
    })
  }

  // Vérifier si tout est livré → commande LIVREE
  const receptions = await prisma.receptionStock.findMany({
    where: { commandeId: livraison.commandeId },
  })

  const toutLivre = receptions.every((r) => {
    // On compare à quantiteCommandee : le surplus ne compte pas pour la livraison
    return r.quantiteLivree >= r.quantiteCommandee && r.quantiteCommandee > 0
  })

  if (toutLivre && receptions.length > 0) {
    await prisma.commande.update({
      where: { id: livraison.commandeId },
      data: { status: "LIVREE" },
    })
  }

  return NextResponse.json(updated)
}
