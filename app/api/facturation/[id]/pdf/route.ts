import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import path from "path"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  const { id } = await params
  if (error) return error

  const facture = await prisma.facture.findUnique({
    where: { id },
    include: {
      commande: {
        select: {
          numero: true,
          devise: true,
          montantTotal: true,
          lignes: { orderBy: { ordre: "asc" } },
          montantAvance: true,
          paiements: {
            where: { isConfirmed: true },
            select: { type: true, montant: true, modePaiement: true, dateReception: true },
            orderBy: { dateReception: "asc" },
          },
          client: {
            select: {
              raisonSociale: true,
              contactNom: true,
              contactPrenom: true,
              contactPoste: true,
              contactEmail: true,
              contactPhone: true,
              adresse: true,
              ville: true,
              pays: true,
            },
          },
        },
      },
    },
  })

  if (!facture) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })
  if (facture.type !== "RECU_CAISSE") {
    return NextResponse.json({ error: "PDF disponible uniquement pour les recus de caisse" }, { status: 400 })
  }

  try {
    // Logo avec sharp (évite le problème de path Windows)
    let logoDataUrl: string | undefined
    try {
      const sharp = (await import("sharp")).default
      const logoPath = path.join(process.cwd(), "public", "logo.png")
      const { data: imgData, info } = await sharp(logoPath).raw().toBuffer({ resolveWithObject: true })
      for (let i = 0; i < imgData.length; i += info.channels) {
        if (imgData[i] < 40 && imgData[i + 1] < 40 && imgData[i + 2] < 40) {
          imgData[i] = 255; imgData[i + 1] = 255; imgData[i + 2] = 255
        }
      }
      const pngBuffer = await sharp(imgData, {
        raw: { width: info.width, height: info.height, channels: info.channels },
      }).png().toBuffer()
      logoDataUrl = `data:image/png;base64,${pngBuffer.toString("base64")}`
    } catch { /* logo absent */ }

    // Montants de référence = la commande réelle (pas ce qui a été saisi dans la facture)
    // Cela évite les erreurs de double soustraction si l'avance a été déduite à la saisie
    const montantTTC = Number(facture.commande.montantTotal)
    const montantTVA = Number(facture.montantTVA)   // TVA saisie sur la facture
    const montantHT = montantTTC - montantTVA

    // Calcul avance versée (paiements confirmés de type AVANCE)
    const paiements = facture.commande.paiements
    const montantAvanceVerse = paiements
      .filter((p) => p.type === "AVANCE")
      .reduce((s, p) => s + Number(p.montant), 0)

    const soldeRestant = montantTTC - montantAvanceVerse

    const { renderToBuffer } = await import("@react-pdf/renderer")
    const { createElement } = await import("react")
    const { RecuCaissePDF } = await import("@/lib/pdf/RecuCaissePDF")

    const recuData = {
      numero: facture.numero,
      statut: facture.statut,
      statutReglement: facture.statutReglement,
      dateEmission: facture.dateEmission.toISOString(),
      montantHT,
      montantTVA,
      montantTTC,
      montantAvanceVerse: montantAvanceVerse > 0 ? montantAvanceVerse : null,
      soldeRestant: montantAvanceVerse > 0 ? soldeRestant : null,
      notes: null,
      client: facture.commande.client,
      commande: {
        numero: facture.commande.numero,
        devise: facture.commande.devise,
        lignes: facture.commande.lignes.map((l) => ({
          designation: l.designation,
          description: l.description ?? null,
          quantite: l.quantite,
          prixUnitaire: Number(l.prixUnitaire),
          total: Number(l.total),
        })),
      },
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const buffer = await renderToBuffer(
      createElement(RecuCaissePDF, { recu: recuData, logoDataUrl }) as any
    )
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="recu-caisse-${facture.numero}.pdf"`,
      },
    })
  } catch (err) {
    console.error("[facturation pdf]", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
