import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; contactId: string }> }) {
  const { error } = await requireAuth()
  const { id, contactId } = await params
  if (error) return error

  const existing = await prisma.contact.findFirst({ where: { id: contactId, clientId: id } })
  if (!existing) return NextResponse.json({ error: "Contact introuvable" }, { status: 404 })

  const { nom, prenom, poste, email, phone, phone2 } = await req.json()

  if (nom !== undefined && !nom?.trim()) return NextResponse.json({ error: "Le nom est obligatoire" }, { status: 400 })
  if (phone !== undefined && !phone?.trim()) return NextResponse.json({ error: "Le téléphone est obligatoire" }, { status: 400 })

  const contact = await prisma.contact.update({
    where: { id: contactId },
    data: {
      ...(nom !== undefined && { nom: nom.trim() }),
      ...(prenom !== undefined && { prenom: prenom?.trim() || null }),
      ...(poste !== undefined && { poste: poste?.trim() || null }),
      ...(email !== undefined && { email: email?.trim() || null }),
      ...(phone !== undefined && { phone: phone.trim() }),
      ...(phone2 !== undefined && { phone2: phone2?.trim() || null }),
    },
  })

  return NextResponse.json(contact)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; contactId: string }> }) {
  const { error } = await requireAuth()
  const { id, contactId } = await params
  if (error) return error

  const existing = await prisma.contact.findFirst({ where: { id: contactId, clientId: id } })
  if (!existing) return NextResponse.json({ error: "Contact introuvable" }, { status: 404 })

  await prisma.contact.delete({ where: { id: contactId } })
  return NextResponse.json({ success: true })
}
