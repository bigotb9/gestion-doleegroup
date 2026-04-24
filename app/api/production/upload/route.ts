import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { supabaseAdmin } from "@/lib/supabase"

const BUCKET = "fournisseurs-documents"

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE"])
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
  const filename = `doc-${Date.now()}.${ext}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filename, buffer, { contentType: file.type || "application/pdf", upsert: false })

  if (uploadError) {
    console.error("[upload-fournisseur]", uploadError)
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 })
  }

  const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename)
  return NextResponse.json({ url: publicUrl })
}
