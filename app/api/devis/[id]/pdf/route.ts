import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import path from "path"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  const { id } = await params
  if (error) return error

  const devis = await prisma.devis.findUnique({
    where: { id },
    include: {
      client: true,
      lignes: { orderBy: { ordre: "asc" } },
      createdBy: { select: { name: true } },
    },
  })

  if (!devis) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })

  try {
    const { renderToBuffer } = await import("@react-pdf/renderer")
    const { createElement } = await import("react")
    const { DevisPDF } = await import("@/lib/pdf/DevisPDF")

    const serialized = {
      ...devis,
      dateEmission: devis.dateEmission.toISOString(),
      dateValidite: devis.dateValidite.toISOString(),
      sousTotal: Number(devis.sousTotal),
      taxe: Number(devis.taxe),
      total: Number(devis.total),
      lignes: devis.lignes.map((l) => ({
        ...l,
        prixUnitaire: Number(l.prixUnitaire),
        remise: Number(l.remise),
        remiseFixe: Number(l.remiseFixe),
        total: Number(l.total),
      })),
    }

    let logoDataUrl: string | undefined
    try {
      const sharp = (await import("sharp")).default
      const logoPath = path.join(process.cwd(), "public", "logo.png")
      const { data, info } = await sharp(logoPath).raw().toBuffer({ resolveWithObject: true })
      // Remplace les pixels noirs/quasi-noirs par du blanc (fond noir → fond blanc)
      for (let i = 0; i < data.length; i += info.channels) {
        if (data[i] < 40 && data[i + 1] < 40 && data[i + 2] < 40) {
          data[i] = 255; data[i + 1] = 255; data[i + 2] = 255
        }
      }
      const pngBuffer = await sharp(data, {
        raw: { width: info.width, height: info.height, channels: info.channels },
      }).png().toBuffer()
      logoDataUrl = `data:image/png;base64,${pngBuffer.toString("base64")}`
    } catch {
      // logo absent ou sharp indisponible, on continue sans
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(createElement(DevisPDF, { devis: serialized, logoDataUrl }) as any)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="facture-proforma-${devis.numero}.pdf"`,
      },
    })
  } catch (err) {
    console.error("[devis pdf]", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
