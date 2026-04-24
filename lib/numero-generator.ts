import { prisma } from "./prisma"

// ── Helpers ──────────────────────────────────────────────────────────────────

function currentYearMonth(): { yy: string; mm: string } {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)          // "26"
  const mm = String(now.getMonth() + 1).padStart(2, "0") // "04"
  return { yy, mm }
}

/**
 * Compteur global annuel partagé entre devis, commandes et factures.
 * Cherche dans les 3 tables tous les numéros commençant par l'année courante
 * (ex: "26"), extrait les 3 derniers chiffres (le séquence), et retourne
 * le prochain numéro disponible.
 *
 * Formats attendus :
 *   Devis     → 26FP04001
 *   Commande  → 26CMD04002
 *   Facture   → 26RC04006
 */
async function nextGlobalSeq(yy: string): Promise<number> {
  const [devisRows, commandeRows, factureRows] = await Promise.all([
    prisma.devis.findMany({
      where: { numero: { startsWith: yy } },
      select: { numero: true },
    }),
    prisma.commande.findMany({
      where: { numero: { startsWith: yy } },
      select: { numero: true },
    }),
    prisma.facture.findMany({
      where: { numero: { startsWith: yy } },
      select: { numero: true },
    }),
  ])

  const seqs = [...devisRows, ...commandeRows, ...factureRows]
    .map((r) => parseInt(r.numero.slice(-3), 10))
    .filter((n) => !isNaN(n) && n > 0)

  return seqs.length > 0 ? Math.max(...seqs) + 1 : 1
}

// ── Générateurs ───────────────────────────────────────────────────────────────

/**
 * Facture proforma  →  26FP04001
 * Format : AA + FP + MM + 3 chiffres (séquence globale de l'année)
 */
export async function generateNumeroDevis(): Promise<string> {
  const { yy, mm } = currentYearMonth()
  const seq = await nextGlobalSeq(yy)
  return `${yy}FP${mm}${String(seq).padStart(3, "0")}`
}

/**
 * Commande  →  26CMD04002
 * Format : AA + CMD + MM + 3 chiffres (séquence globale de l'année)
 */
export async function generateNumeroCommande(): Promise<string> {
  const { yy, mm } = currentYearMonth()
  const seq = await nextGlobalSeq(yy)
  return `${yy}CMD${mm}${String(seq).padStart(3, "0")}`
}

/**
 * Reçu de caisse  →  26RC04006
 * Format : AA + RC + MM + 3 chiffres (séquence globale de l'année)
 */
export async function generateNumeroFacture(): Promise<string> {
  const { yy, mm } = currentYearMonth()
  const seq = await nextGlobalSeq(yy)
  return `${yy}RC${mm}${String(seq).padStart(3, "0")}`
}

/**
 * Bon de commande fournisseur  →  26BCF04001
 * Format : AA + BCF + MM + 3 chiffres (séquence indépendante des BCF)
 */
export async function generateNumeroBCF(): Promise<string> {
  const { yy, mm } = currentYearMonth()
  const yearPrefix = `${yy}BCF`

  const allBCF = await prisma.production.findMany({
    where: { numeroBCF: { startsWith: yearPrefix } },
    select: { numeroBCF: true },
  })

  const seqs = allBCF
    .map((p) => parseInt((p.numeroBCF ?? "").slice(-3), 10))
    .filter((n) => !isNaN(n) && n > 0)

  const seq = seqs.length > 0 ? Math.max(...seqs) + 1 : 1
  return `${yy}BCF${mm}${String(seq).padStart(3, "0")}`
}
