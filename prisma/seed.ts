import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import { config } from "dotenv"

config({ path: ".env.local" })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

/**
 * Crée ou retrouve un utilisateur dans Supabase Auth.
 * Retourne l'UID Supabase du compte.
 */
async function upsertSupabaseUser(
  email: string,
  password: string,
  name: string,
  role: string
): Promise<string> {
  // Chercher si l'utilisateur existe déjà dans Supabase Auth par email
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  const existing = listData?.users?.find((u) => u.email === email)

  if (existing) {
    console.log(`    Supabase Auth: user trouvé (${email}) — UID: ${existing.id}`)
    // Mettre à jour le mot de passe au cas où il aurait changé
    await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: { name, role },
    })
    return existing.id
  }

  // Créer le compte Supabase Auth
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  })

  if (error) throw new Error(`Supabase Auth createUser failed for ${email}: ${error.message}`)
  console.log(`    Supabase Auth: user créé (${email}) — UID: ${data.user.id}`)
  return data.user.id
}

async function main() {
  console.log("Seeding database...\n")

  // ============================================================
  // USERS
  // ============================================================
  const users = [
    { name: "Directeur 1",  email: "directeur1@dolee-group.ci", password: "dolee2025!", role: "MANAGER" as const },
    { name: "Directeur 2",  email: "directeur2@dolee-group.ci", password: "dolee2025!", role: "MANAGER" as const },
    { name: "Marie Koné",   email: "marie@dolee-group.ci",      password: "dolee2025!", role: "SECRETAIRE" as const },
    { name: "Kouassi Yao",  email: "kouassi@dolee-group.ci",    password: "dolee2025!", role: "CHARGE_OPERATIONS" as const },
  ]

  for (const u of users) {
    console.log(`  → ${u.email}`)

    // 1. Créer / retrouver dans Supabase Auth
    let supabaseUid: string | undefined
    try {
      supabaseUid = await upsertSupabaseUser(u.email, u.password, u.name, u.role)
    } catch (err) {
      console.warn(`  ⚠ Supabase Auth ignoré (${u.email}):`, err instanceof Error ? err.message : err)
    }

    // 2. Upsert dans Prisma
    const passwordHash = await hashPassword(u.password)
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        isActive: true,
        ...(supabaseUid ? { supabaseUid } : {}),
      },
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        isActive: true,
        supabaseUid,
      },
    })
    console.log(`    Prisma: upserted (supabaseUid: ${supabaseUid ?? "non disponible"})`)
  }

  // ============================================================
  // FOURNISSEURS
  // ============================================================
  console.log("\n  Fournisseurs...")
  const fournisseurs = [
    {
      nom: "Guangzhou Promo Co.",
      pays: "Chine",
      contactNom: "Li Wei",
      contactEmail: "li.wei@gzpromo.cn",
      contactPhone: "+86-20-8888-0001",
      devisePreferee: "EUR" as const,
      delaiProduction: 25,
      notes: "Fournisseur principal pour stylos, mugs et clés USB. Paiement en EUR.",
    },
    {
      nom: "Istanbul Gift Trade",
      pays: "Turquie",
      contactNom: "Mehmet Yilmaz",
      contactEmail: "m.yilmaz@istanbul-gift.tr",
      contactPhone: "+90-212-555-0099",
      devisePreferee: "USD" as const,
      delaiProduction: 20,
      notes: "Spécialisé tee-shirts et textiles personnalisés. Paiement en USD.",
    },
    {
      nom: "Abidjan Printing Services",
      pays: "Côte d'Ivoire",
      contactNom: "Kouamé Brou",
      contactEmail: "contact@abidjanprinting.ci",
      contactPhone: "+225-27-22-44-55-66",
      devisePreferee: "CFA" as const,
      delaiProduction: 7,
      notes: "Imprimeur local pour carnets et supports papier. Paiement en FCFA.",
    },
  ]

  for (const f of fournisseurs) {
    const existing = await prisma.fournisseur.findFirst({ where: { nom: f.nom } })
    if (existing) {
      await prisma.fournisseur.update({ where: { id: existing.id }, data: f })
      console.log(`    Fournisseur updated: ${f.nom}`)
    } else {
      await prisma.fournisseur.create({ data: f })
      console.log(`    Fournisseur created: ${f.nom}`)
    }
  }

  // ============================================================
  // ARTICLES STOCK
  // ============================================================
  console.log("\n  Articles stock...")
  const articles = [
    { reference: "SAC-PLY-001", nom: "Sachets plastique transparents", description: "Sachets 20x30cm.", unite: "pièce", quantite: 2000, quantiteMin: 500 },
    { reference: "BOI-CAR-001", nom: "Boîtes cartonnées", description: "Boîtes 30x20x15cm.", unite: "pièce", quantite: 300, quantiteMin: 50 },
    { reference: "PAP-KRA-001", nom: "Papier kraft brun", description: "Rouleau pour calage.", unite: "rouleau", quantite: 50, quantiteMin: 10 },
    { reference: "RUB-ADH-001", nom: "Ruban adhésif transparent", description: "48mm x 50m.", unite: "rouleau", quantite: 100, quantiteMin: 20 },
    { reference: "ETI-IMP-001", nom: "Étiquettes autocollantes", description: "A4 (100 feuilles).", unite: "paquet", quantite: 30, quantiteMin: 5 },
  ]

  for (const a of articles) {
    await prisma.articleStock.upsert({
      where: { reference: a.reference },
      update: a,
      create: a,
    })
    console.log(`    ArticleStock: ${a.reference}`)
  }

  // ============================================================
  // CLIENTS (sample)
  // ============================================================
  console.log("\n  Clients...")
  const clients = [
    {
      raisonSociale: "Orange Côte d'Ivoire",
      status: "PROSPECT" as const,
      secteurActivite: "Télécommunications",
      contactNom: "Diallo",
      contactPrenom: "Mamadou",
      contactPoste: "Responsable Marketing",
      contactEmail: "m.diallo@orange.ci",
      contactPhone: "+225-27-20-39-00-00",
      adresse: "Boulevard Latrille, Cocody",
      ville: "Abidjan",
      pays: "Côte d'Ivoire",
      sourceProspect: "linkedin",
      priorite: 1,
    },
    {
      raisonSociale: "SGBCI",
      status: "PROSPECT" as const,
      secteurActivite: "Banque & Finance",
      contactNom: "Kouadio",
      contactPrenom: "Serge",
      contactPoste: "Directeur Commercial",
      contactEmail: "s.kouadio@sgbci.ci",
      contactPhone: "+225-27-20-21-92-00",
      adresse: "Avenue Joseph Anoma, Plateau",
      ville: "Abidjan",
      pays: "Côte d'Ivoire",
      sourceProspect: "referral",
      priorite: 1,
    },
    {
      raisonSociale: "MTN Côte d'Ivoire",
      status: "CLIENT" as const,
      secteurActivite: "Télécommunications",
      contactNom: "Traoré",
      contactPrenom: "Fatoumata",
      contactPoste: "Chargée Communication",
      contactEmail: "f.traore@mtn.ci",
      contactPhone: "+225-27-22-23-00-00",
      adresse: "Immeuble MTN, Marcory",
      ville: "Abidjan",
      pays: "Côte d'Ivoire",
      sourceProspect: "salon",
      priorite: 2,
      dateConversion: new Date("2024-11-15"),
    },
  ]

  for (const c of clients) {
    const existing = await prisma.client.findFirst({ where: { raisonSociale: c.raisonSociale } })
    if (existing) {
      await prisma.client.update({ where: { id: existing.id }, data: c })
    } else {
      await prisma.client.create({ data: c })
    }
    console.log(`    Client: ${c.raisonSociale}`)
  }

  console.log("\n✓ Seed terminé avec succès!")
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
