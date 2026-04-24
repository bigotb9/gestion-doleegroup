import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  const { id } = await params
  if (error) return error

  const contacts = await prisma.contact.findMany({
    where: { clientId: id },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(contacts)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  const { id } = await params
  if (error) return error

  const { nom, prenom, poste, email, phone, phone2 } = await req.json()

  if (!nom?.trim()) return NextResponse.json({ error: "Le nom est obligatoire" }, { status: 400 })
  if (!phone?.trim()) return NextResponse.json({ error: "Le téléphone est obligatoire" }, { status: 400 })

  const contact = await prisma.contact.create({
    data: {
      clientId: id,
      nom: nom.trim(),
      prenom: prenom?.trim() || null,
      poste: poste?.trim() || null,
      email: email?.trim() || null,
      phone: phone.trim(),
      phone2: phone2?.trim() || null,
    },
  })

  return NextResponse.json(contact, { status: 201 })
}
