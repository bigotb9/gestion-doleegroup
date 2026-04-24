import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER"])
  const { id } = await params
  if (error) return error

  const user = await prisma.user.findUnique({
    where: { id },
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
  })

  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER"])
  const { id } = await params
  if (error) return error

  const { name, email, role, isActive, avatarUrl, password, permissions } = await req.json()

  // Récupère le supabaseUid du user pour sync
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { supabaseUid: true },
  })

  const prismaData: Record<string, unknown> = {}
  if (name !== undefined) prismaData.name = name
  if (email !== undefined) prismaData.email = email
  if (role !== undefined) prismaData.role = role
  if (isActive !== undefined) prismaData.isActive = isActive
  if (avatarUrl !== undefined) prismaData.avatarUrl = avatarUrl
  if (password) prismaData.passwordHash = await bcrypt.hash(password, 12)
  if (permissions !== undefined) {
    prismaData.permissions = permissions === null ? null : JSON.stringify(permissions)
  }

  try {
    // 1. Sync Supabase Auth si le user en a un
    const supabaseUid = existingUser?.supabaseUid
    if (supabaseUid) {
      const supabaseUpdate: {
        email?: string
        password?: string
        user_metadata?: Record<string, unknown>
        ban_duration?: string
      } = {}

      if (email !== undefined) supabaseUpdate.email = email
      if (password) supabaseUpdate.password = password
      if (name !== undefined || role !== undefined) {
        supabaseUpdate.user_metadata = {
          ...(name !== undefined ? { name } : {}),
          ...(role !== undefined ? { role } : {}),
        }
      }
      // Activer / désactiver = ban dans Supabase Auth
      if (isActive === false) supabaseUpdate.ban_duration = "87600h"
      if (isActive === true) supabaseUpdate.ban_duration = "none"

      if (Object.keys(supabaseUpdate).length > 0) {
        const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(
          supabaseUid,
          supabaseUpdate
        )
        if (authErr) console.warn("[Supabase auth update]", authErr.message)
      }
    }

    // 2. Update Prisma
    const user = await prisma.user.update({
      where: { id },
      data: prismaData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        supabaseUid: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER"])
  const { id } = await params
  if (error) return error

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { supabaseUid: true },
    })

    // Supprimer de Supabase Auth (si le user y existe)
    if (user?.supabaseUid) {
      const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(user.supabaseUid)
      if (authErr && authErr.message !== "User not found") {
        return NextResponse.json({ error: authErr.message }, { status: 500 })
      }
    }

    // Supprimer de Prisma
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
