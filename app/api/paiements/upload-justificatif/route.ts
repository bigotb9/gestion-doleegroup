import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { supabaseAdmin, JUSTIFICATIFS_PAIEMENTS_BUCKET } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 })

  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  if (ext !== "pdf") {
    return NextResponse.json({ error: "Seuls les fichiers PDF sont acceptés" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  if (!buckets?.some((b) => b.name === JUSTIFICATIFS_PAIEMENTS_BUCKET)) {
    await supabaseAdmin.storage.createBucket(JUSTIFICATIFS_PAIEMENTS_BUCKET, { public: true })
  }

  const filename = `justificatif-paiement-${Date.now()}.pdf`
  const { error: uploadError } = await supabaseAdmin.storage
    .from(JUSTIFICATIFS_PAIEMENTS_BUCKET)
    .upload(filename, buffer, { contentType: "application/pdf", upsert: false })

  if (uploadError) {
    console.error("[upload-justificatif-paiement]", uploadError)
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 })
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(JUSTIFICATIFS_PAIEMENTS_BUCKET)
    .getPublicUrl(filename)

  return NextResponse.json({ url: publicUrl })
}
