import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { supabaseAdmin, FACTURES_FNE_BUCKET } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["MANAGER"])
  if (error) return error

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 })

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf"
  const allowed = ["pdf", "jpg", "jpeg", "png"]
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: "Format non supporté (PDF, JPG, PNG)" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Ensure bucket exists
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  const bucketExists = buckets?.some((b) => b.name === FACTURES_FNE_BUCKET)
  if (!bucketExists) {
    await supabaseAdmin.storage.createBucket(FACTURES_FNE_BUCKET, { public: true })
  }

  const filename = `fne-${Date.now()}.${ext}`
  const { error: uploadError } = await supabaseAdmin.storage
    .from(FACTURES_FNE_BUCKET)
    .upload(filename, buffer, { contentType: file.type || "application/pdf", upsert: false })

  if (uploadError) {
    console.error("[upload-fne]", uploadError)
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 })
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(FACTURES_FNE_BUCKET)
    .getPublicUrl(filename)

  return NextResponse.json({ url: publicUrl })
}
