import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ""
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(";"),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = r[h]
          const s = v == null ? "" : String(v).replace(/"/g, '""')
          return `"${s}"`
        })
        .join(";")
    ),
  ]
  return lines.join("\n")
}

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(["MANAGER", "SECRETAIRE"])
  if (error) return error

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") ?? "commandes"

  let csv = ""
  let filename = "export.csv"

  if (type === "commandes") {
    filename = `commandes-${new Date().toISOString().slice(0, 10)}.csv`
    const rows = await prisma.commande.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        numero: true,
        status: true,
        statusPaiement: true,
        modePaiement: true,
        montantTotal: true,
        montantAvance: true,
        devise: true,
        dateCommande: true,
        dateLivraisonSouhaitee: true,
        createdAt: true,
        client: { select: { raisonSociale: true, contactPhone: true } },
        paiements: { where: { isConfirmed: true }, select: { montant: true } },
      },
    })
    csv = toCsv(
      rows.map((c) => ({
        Numéro: c.numero,
        Client: c.client.raisonSociale,
        Téléphone: c.client.contactPhone,
        Statut: c.status,
        "Statut paiement": c.statusPaiement,
        "Mode paiement": c.modePaiement,
        "Montant total": Number(c.montantTotal),
        "Avance demandée": c.montantAvance ? Number(c.montantAvance) : "",
        Devise: c.devise,
        "Total encaissé": c.paiements.reduce((s, p) => s + Number(p.montant), 0),
        "Date commande": c.dateCommande.toISOString().slice(0, 10),
        "Date livraison souhaitée": c.dateLivraisonSouhaitee?.toISOString().slice(0, 10) ?? "",
        "Créée le": c.createdAt.toISOString().slice(0, 10),
      }))
    )
  } else if (type === "depenses") {
    filename = `depenses-${new Date().toISOString().slice(0, 10)}.csv`
    const rows = await prisma.depense.findMany({
      orderBy: { date: "desc" },
    })
    csv = toCsv(
      rows.map((d) => ({
        Date: d.date.toISOString().slice(0, 10),
        Titre: d.titre,
        Type: d.categorie ?? "",
        "Montant (FCFA)": Number(d.montant),
        Description: d.description ?? "",
      }))
    )
  } else if (type === "stock") {
    filename = `stock-${new Date().toISOString().slice(0, 10)}.csv`
    const rows = await prisma.articleStock.findMany({
      orderBy: { nom: "asc" },
    })
    csv = toCsv(
      rows.map((a) => ({
        Référence: a.reference,
        Nom: a.nom,
        Description: a.description ?? "",
        Unité: a.unite,
        "Quantité en stock": a.quantite,
        "Quantité minimum": a.quantiteMin,
        "Surplus stock": a.surplusStock,
        "Mis à jour le": a.updatedAt.toISOString().slice(0, 10),
      }))
    )
  } else if (type === "factures") {
    filename = `factures-${new Date().toISOString().slice(0, 10)}.csv`
    const rows = await prisma.facture.findMany({
      orderBy: { createdAt: "desc" },
      include: { commande: { select: { numero: true, client: { select: { raisonSociale: true } } } } },
    })
    csv = toCsv(
      rows.map((f) => ({
        Numéro: f.numero,
        Type: f.type,
        Client: f.commande.client.raisonSociale,
        "Commande liée": f.commande.numero,
        "Montant HT": Number(f.montantHT),
        "TVA": Number(f.montantTVA),
        "Montant TTC": Number(f.montantTTC),
        Statut: f.statut,
        Règlement: f.statutReglement ?? "",
        "Date émission": f.dateEmission.toISOString().slice(0, 10),
      }))
    )
  } else {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 })
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
