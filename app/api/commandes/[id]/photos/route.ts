import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin, COMMANDES_PHOTOS_BUCKET } from "@/lib/supabase"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  const { id } = await params
  if (error) return error

  const photos = await prisma.commandePhoto.findMany({
    where: { commandeId: id },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(photos)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE", "CHARGE_OPERATIONS"])
  const { id } = await params
  if (error) return error

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const caption = formData.get("caption") as string | null
  const categorie = formData.get("categorie") as string | null

  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 })

  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  const allowed = ["jpg", "jpeg", "png", "webp"]
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: "Format non supporté (JPG, PNG, WEBP)" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  if (!buckets?.some((b) => b.name === COMMANDES_PHOTOS_BUCKET)) {
    await supabaseAdmin.storage.createBucket(COMMANDES_PHOTOS_BUCKET, { public: true })
  }

  const filename = `cmd-${id}-${Date.now()}.${ext}`
  const { error: uploadError } = await supabaseAdmin.storage
    .from(COMMANDES_PHOTOS_BUCKET)
    .upload(filename, buffer, { contentType: file.type || "image/jpeg", upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 })
  }

  const { data: { publicUrl } } = supabaseAdmin.storage.from(COMMANDES_PHOTOS_BUCKET).getPublicUrl(filename)

  const photo = await prisma.commandePhoto.create({
    data: {
      commandeId: id,
      url: publicUrl,
      caption: caption || null,
      categorie: categorie || "AUTRE",
    },
  })

  return NextResponse.json(photo, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE"])
  const { id } = await params
  if (error) return error

  const { searchParams } = new URL(req.url)
  const photoId = searchParams.get("photoId")
  if (!photoId) return NextResponse.json({ error: "photoId requis" }, { status: 400 })

  await prisma.commandePhoto.delete({ where: { id: photoId, commandeId: id } })
  return NextResponse.json({ success: true })
}
