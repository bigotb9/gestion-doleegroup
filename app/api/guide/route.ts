import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { renderToBuffer } = await import("@react-pdf/renderer")
    const { createElement } = await import("react")
    const { GuidePDF } = await import("@/lib/pdf/GuidePDF")

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(createElement(GuidePDF) as any)

    const filename = `guide-utilisation-dolee-group-${new Date().getFullYear()}.pdf`

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (err) {
    console.error("[guide pdf]", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
