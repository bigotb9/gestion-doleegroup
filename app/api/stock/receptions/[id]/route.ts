import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

// PATCH — met à jour quantiteRecue (et optionnellement notes/dateReception)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE", "CHARGE_OPERATIONS"])
  const { id } = await params
  if (error) return error

  const { quantiteRecue, quantiteReconditionnee, notes, dateReception } = await req.json()

  const reception = await prisma.receptionStock.findUnique({ where: { id } })
  if (!reception) return NextResponse.json({ error: "Réception introuvable" }, { status: 404 })

  if (quantiteRecue !== undefined && quantiteRecue < 0) {
    return NextResponse.json({ error: "La quantité reçue ne peut pas être négative" }, { status: 400 })
  }
  if (quantiteReconditionnee !== undefined && quantiteReconditionnee < 0) {
    return NextResponse.json({ error: "La quantité reconditionnée ne peut pas être négative" }, { status: 400 })
  }

  const updated = await prisma.receptionStock.update({
    where: { id },
    data: {
      ...(quantiteRecue !== undefined ? { quantiteRecue } : {}),
      ...(quantiteReconditionnee !== undefined ? { quantiteReconditionnee } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(dateReception !== undefined ? { dateReception: dateReception ? new Date(dateReception) : null } : {}),
    },
  })

  return NextResponse.json(updated)
}
