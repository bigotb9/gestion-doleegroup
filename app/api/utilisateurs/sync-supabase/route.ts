import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"

/**
 * POST /api/utilisateurs/sync-supabase
 *
 * Synchronise tous les utilisateurs Prisma vers Supabase Auth.
 * - Si l'utilisateur existe déjà dans Supabase (même email) → récupère l'UID et le stocke
 * - Si l'utilisateur n'existe pas dans Supabase → crée le compte avec un mot de passe temporaire
 *   et envoie un email de réinitialisation
 *
 * Réservé aux MANAGER.
 */
export async function POST() {
  const { error } = await requireAuth(["MANAGER"])
  if (error) return error

  const prismaUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true, supabaseUid: true },
  })

  // Récupère tous les users Supabase Auth pour comparaison
  const { data: supabaseList } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  const supabaseByEmail = new Map(
    (supabaseList?.users ?? []).map((u) => [u.email ?? "", u])
  )

  const results: {
    email: string
    action: "already_synced" | "linked" | "created" | "error"
    supabaseUid?: string
    error?: string
  }[] = []

  for (const user of prismaUsers) {
    // Déjà synchronisé
    if (user.supabaseUid) {
      results.push({ email: user.email, action: "already_synced", supabaseUid: user.supabaseUid })
      continue
    }

    const supabaseUser = supabaseByEmail.get(user.email)

    if (supabaseUser) {
      // L'utilisateur existe dans Supabase — on récupère son UID
      await prisma.user.update({
        where: { id: user.id },
        data: { supabaseUid: supabaseUser.id },
      })
      results.push({ email: user.email, action: "linked", supabaseUid: supabaseUser.id })
      continue
    }

    // L'utilisateur n'existe pas dans Supabase — on le crée
    // Mot de passe temporaire sécurisé (l'utilisateur devra réinitialiser)
    const tempPassword = `Temp-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}!`

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: user.name, role: user.role },
      ...(user.isActive === false ? { ban_duration: "87600h" } : {}),
    })

    if (createErr) {
      results.push({ email: user.email, action: "error", error: createErr.message })
      continue
    }

    // Enregistrer le supabaseUid dans Prisma
    await prisma.user.update({
      where: { id: user.id },
      data: { supabaseUid: created.user.id },
    })

    // Envoyer un email de réinitialisation de mot de passe
    await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: user.email,
    })

    results.push({ email: user.email, action: "created", supabaseUid: created.user.id })
  }

  const synced    = results.filter((r) => r.action !== "error").length
  const errors    = results.filter((r) => r.action === "error").length
  const created   = results.filter((r) => r.action === "created").length
  const linked    = results.filter((r) => r.action === "linked").length
  const alreadyOk = results.filter((r) => r.action === "already_synced").length

  return NextResponse.json({
    summary: { total: prismaUsers.length, synced, errors, created, linked, alreadyOk },
    results,
  })
}
