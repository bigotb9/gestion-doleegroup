import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 })

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
    return NextResponse.json({ error: "Format non supporté (jpg, png, webp)" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const dir = join(process.cwd(), "public", "uploads", "avatars")
  await mkdir(dir, { recursive: true })

  // Include timestamp to bust cache when avatar is replaced
  const filename = `${session!.user.id}-${Date.now()}.${ext}`
  await writeFile(join(dir, filename), buffer)

  const avatarUrl = `/uploads/avatars/${filename}`
  await prisma.user.update({
    where: { id: session!.user.id },
    data: { avatarUrl },
  })

  return NextResponse.json({ avatarUrl })
}
