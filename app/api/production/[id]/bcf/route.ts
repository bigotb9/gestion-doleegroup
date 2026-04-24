import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth()
  const { id } = await params
  if (error) return error

  const production = await prisma.production.findUnique({
    where: { id },
    include: {
      fournisseur: true,
      commande: { select: { id: true, numero: true, lignes: { orderBy: { ordre: "asc" } } } },
    },
  })

  if (!production) return NextResponse.json({ error: "Production introuvable" }, { status: 404 })
  if (!production.numeroBCF) return NextResponse.json({ error: "Numéro BCF manquant" }, { status: 400 })

  try {
    const { renderToBuffer } = await import("@react-pdf/renderer")
    const { createElement } = await import("react")
    const { BonCommandePDF } = await import("@/lib/pdf/BonCommandePDF")

    const data = {
      numeroBCF: production.numeroBCF,
      dateEmission: production.createdAt.toISOString(),
      fournisseur: {
        nom: production.fournisseur.nom,
        pays: production.fournisseur.pays,
        contactNom: production.fournisseur.contactNom,
        contactEmail: production.fournisseur.contactEmail,
        contactPhone: production.fournisseur.contactPhone,
      },
      commande: { numero: production.commande.numero },
      designation: production.designation,
      description: production.commande.lignes
        .map((l) => l.description)
        .filter(Boolean)
        .join(" | ") || null,
      quantite: production.quantite,
      devise: production.devise,
      coutUnitaire: production.coutUnitaire ? Number(production.coutUnitaire) : null,
      tauxChange: production.tauxChange ? Number(production.tauxChange) : null,
      dateCommandeFournisseur: production.dateCommandeFournisseur?.toISOString() ?? null,
      delaiProduction: production.delaiProduction,
      dateFinProductionPrevue: production.dateFinProductionPrevue?.toISOString() ?? null,
      notesFournisseur: production.notesFournisseur,
      createdBy: { name: session?.user?.name ?? "Dolee Group" },
    }

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(createElement(BonCommandePDF, { data, logoDataUrl }) as any)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="BCF-${production.numeroBCF}.pdf"`,
      },
    })
  } catch (err) {
    console.error("[bcf pdf]", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
