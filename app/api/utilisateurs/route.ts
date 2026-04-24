import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function GET() {
  const { error } = await requireAuth(["MANAGER"])
  if (error) return error

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      avatarUrl: true,
      permissions: true,
      supabaseUid: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["MANAGER"])
  if (error) return error

  const { name, email, password, role, avatarUrl } = await req.json()

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 })

  // 1. Créer dans Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  })

  if (authError) {
    console.error("[Supabase auth createUser]", authError)
    return NextResponse.json(
      { error: `Échec Supabase Auth: ${authError.message}` },
      { status: 500 }
    )
  }

  // 2. Créer dans Prisma
  const passwordHash = await bcrypt.hash(password, 12)

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        avatarUrl,
        supabaseUid: authData.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        supabaseUid: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    // Rollback Supabase Auth si Prisma échoue
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id).catch(() => null)
    const msg = err instanceof Error ? err.message : "Erreur création Prisma"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
