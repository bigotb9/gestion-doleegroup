import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { LogistiqueStatus } from "@prisma/client"
// Map step ordre to logistique status value
const ETAPE_STATUS_MAP: Record<number, LogistiqueStatus> = {
  1: "CHEZ_FOURNISSEUR",
  2: "EXPEDIE_TRANSITAIRE",
  3: "CHEZ_TRANSITAIRE",
  4: "AU_BUREAU",
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["MANAGER", "CHARGE_OPERATIONS"])
  const { id } = await params
  if (error) return error

  const { etapeId, estFait, dateReelle, notes } = await req.json()

  const etape = await prisma.logistiqueEtape.update({
    where: { id: etapeId, logistiqueId: id },
    data: {
      estFait,
      dateReelle: dateReelle ? new Date(dateReelle) : estFait ? new Date() : null,
      notes,
    },
  })

  // Auto-advance logistique status to the highest completed step
  if (estFait) {
    const allEtapes = await prisma.logistiqueEtape.findMany({
      where: { logistiqueId: id },
      orderBy: { ordre: "asc" },
    })

    let highestCompletedOrdre = 0
    for (const e of allEtapes) {
      if (e.estFait && e.ordre > highestCompletedOrdre) {
        highestCompletedOrdre = e.ordre
      }
    }

    const newStatus = ETAPE_STATUS_MAP[highestCompletedOrdre]
    if (newStatus) {
      await prisma.logistique.update({
        where: { id: id },
        data: { status: newStatus },
      })
    }
  }

  return NextResponse.json(etape)
}
