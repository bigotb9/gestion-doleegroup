import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  const { id } = await params
  if (error) return error

  const commande = await prisma.commande.findUnique({
    where: { id },
    include: {
      client: true,
      lignes: { orderBy: { ordre: "asc" } },
      paiements: { include: { confirmedBy: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
      productions: { include: { fournisseur: { select: { nom: true, pays: true } } }, orderBy: { createdAt: "asc" } },
      logistiques: { orderBy: { createdAt: "asc" as const } },
      reconditionnements: { orderBy: { createdAt: "asc" as const } },
      livraisons: { include: { lignes: true, assignedTo: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
      confirmedBy: { select: { name: true } },
      devis: { select: { numero: true } },
    },
  })

  if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

  try {
    const { renderToBuffer } = await import("@react-pdf/renderer")
    const { createElement } = await import("react")
    const { RapportCommandePDF } = await import("@/lib/pdf/RapportCommandePDF")

    const d = (v: Date | null | undefined) => (v ? v.toISOString() : null)

    const serialized = {
      ...commande,
      montantTotal: Number(commande.montantTotal),
      montantAvance: commande.montantAvance != null ? Number(commande.montantAvance) : null,
      dateCommande: commande.dateCommande.toISOString(),
      dateLivraisonSouhaitee: d(commande.dateLivraisonSouhaitee),
      dateLivraisonPrevue: d(commande.dateLivraisonPrevue),
      lignes: commande.lignes.map((l) => ({
        ...l,
        prixUnitaire: Number(l.prixUnitaire),
        total: Number(l.total),
      })),
      paiements: commande.paiements.map((p) => ({
        ...p,
        montant: Number(p.montant),
        dateReception: p.dateReception.toISOString(),
        dateConfirmation: d(p.dateConfirmation),
      })),
      productions: commande.productions.map((p) => ({
        ...p,
        coutTotal: Number(p.coutTotal),
        dateCommandeFournisseur: d(p.dateCommandeFournisseur),
        dateFinProductionPrevue: d(p.dateFinProductionPrevue),
        dateFinProductionReelle: d(p.dateFinProductionReelle),
      })),
      logistiques: commande.logistiques.map((log) => ({
        ...log,
        dateExpeditionFournisseur: d(log.dateExpeditionFournisseur),
        dateArriveeEntrepot: d(log.dateArriveeEntrepot),
      })),
      reconditionnements: commande.reconditionnements.map((rec) => ({
        ...rec,
        dateDebut: d(rec.dateDebut),
        dateFin: d(rec.dateFin),
      })),
      livraisons: commande.livraisons.map((liv) => ({
        ...liv,
        datePrevue: liv.datePrevue.toISOString(),
        dateReelle: d(liv.dateReelle),
        signatureDate: d(liv.signatureDate),
        quantiteTotaleLivree: liv.lignes.reduce((s, l) => s + l.quantite, 0),
      })),
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(createElement(RapportCommandePDF, { commande: serialized }) as any)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="rapport-${commande.numero}.pdf"`,
      },
    })
  } catch (err) {
    console.error("[rapport pdf]", err)
    return NextResponse.json({ error: "Erreur génération PDF" }, { status: 500 })
  }
}
