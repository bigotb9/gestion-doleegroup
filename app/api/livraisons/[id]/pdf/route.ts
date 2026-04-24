import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  const { id } = await params
  if (error) return error

  const livraison = await prisma.livraison.findUnique({
    where: { id },
    include: {
      client: true,
      assignedTo: { select: { name: true } },
      lignes: { include: { reception: true } },
      commande: {
        select: {
          id: true,
          numero: true,
          lignes: { orderBy: { ordre: "asc" } },
        },
      },
    },
  })

  if (!livraison) return NextResponse.json({ error: "Livraison introuvable" }, { status: 404 })

  try {
    // Calcul cumulatif par produit
    // reception.quantiteLivree inclut cette livraison si status=LIVREE, sinon non
    const isLivree = livraison.status === "LIVREE"
    const lignesLivraison = livraison.lignes.map((l) => {
      const cmdLigne = livraison.commande.lignes.find((cl) => cl.designation === l.designation)
      const quantiteCommandee = l.reception.quantiteCommandee
      const cumulatif = l.reception.quantiteLivree
      const quantiteDejaLivree = isLivree ? Math.max(0, cumulatif - l.quantite) : cumulatif
      const quantiteCetteLivraison = l.quantite
      const resteApres = Math.max(0, quantiteCommandee - quantiteDejaLivree - quantiteCetteLivraison)
      return {
        designation: l.designation,
        description: cmdLigne?.description ?? null,
        quantiteCommandee,
        quantiteDejaLivree,
        quantiteCetteLivraison,
        resteApres,
      }
    })

    const totalCommande = lignesLivraison.reduce((s, l) => s + l.quantiteCommandee, 0)
    const totalDejaLivre = lignesLivraison.reduce((s, l) => s + l.quantiteDejaLivree, 0)
    const totalCetteLivraison = lignesLivraison.reduce((s, l) => s + l.quantiteCetteLivraison, 0)
    const totalResteApres = lignesLivraison.reduce((s, l) => s + l.resteApres, 0)

    // Résoudre les URLs relatives pour react-pdf
    const host = req.headers.get("host") ?? "localhost:3000"
    const proto = req.headers.get("x-forwarded-proto") ?? "http"
    function resolveUrl(url: string | null): string | null {
      if (!url) return null
      return url.startsWith("/") ? `${proto}://${host}${url}` : url
    }

    // Logo
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

    const serialized = {
      ...livraison,
      signatureUrl: resolveUrl(livraison.signatureUrl),
      signatureUrl2: resolveUrl(livraison.signatureUrl2),
      signatureChargeUrl: resolveUrl(livraison.signatureChargeUrl),
      datePrevue: livraison.datePrevue.toISOString(),
      dateReelle: livraison.dateReelle?.toISOString() ?? null,
      signatureDate: livraison.signatureDate?.toISOString() ?? null,
      signatureChargeDate: livraison.signatureChargeDate?.toISOString() ?? null,
      lignesLivraison,
      commande: { numero: livraison.commande.numero },
    }

    const { renderToBuffer } = await import("@react-pdf/renderer")
    const { createElement } = await import("react")
    const { BonLivraisonPDF } = await import("@/lib/pdf/BonLivraisonPDF")

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const buffer = await renderToBuffer(
      createElement(BonLivraisonPDF, {
        livraison: serialized as any,
        totalCommande,
        totalDejaLivre,
        totalCetteLivraison,
        totalResteApres,
        logoDataUrl,
      }) as any
    )
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="bon-livraison-${livraison.commande.numero}.pdf"`,
      },
    })
  } catch (err) {
    console.error("[livraison pdf]", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
