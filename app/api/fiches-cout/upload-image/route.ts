import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { supabaseAdmin, FICHES_COUT_BUCKET } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE"])
  if (error) return error

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 })

  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  const allowed = ["jpg", "jpeg", "png", "webp"]
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: "Format non supporté (JPG, PNG, WEBP)" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  if (!buckets?.some((b) => b.name === FICHES_COUT_BUCKET)) {
    await supabaseAdmin.storage.createBucket(FICHES_COUT_BUCKET, { public: true })
  }

  const filename = `produit-${Date.now()}.${ext}`
  const { error: uploadError } = await supabaseAdmin.storage
    .from(FICHES_COUT_BUCKET)
    .upload(filename, buffer, { contentType: file.type || "image/jpeg", upsert: false })

  if (uploadError) {
    console.error("[upload-image-fiche]", uploadError)
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 })
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(FICHES_COUT_BUCKET)
    .getPublicUrl(filename)

  return NextResponse.json({ url: publicUrl })
}
