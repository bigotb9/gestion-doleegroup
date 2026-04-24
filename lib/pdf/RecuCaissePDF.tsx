import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer"

// Palette noire pour le reçu de caisse
const colors = {
  primary: "#1e293b",
  accent: "#334155",
  text: "#1e293b",
  muted: "#64748b",
  border: "#cbd5e1",
  bg: "#f8fafc",
  white: "#ffffff",
  green: "#16a34a",
  red: "#dc2626",
  amber: "#d97706",
  orange: "#ea580c",
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.text,
    padding: 40,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  companyName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    color: colors.primary,
    marginTop: 4,
  },
  companyTagline: {
    fontSize: 9,
    color: colors.muted,
  },
  docTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    textAlign: "right",
  },
  docSubtitle: {
    fontSize: 10,
    color: colors.muted,
    textAlign: "right",
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: colors.primary,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    color: colors.muted,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 10,
    color: colors.text,
  },
  valueBold: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.text,
  },
  table: {
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    padding: "6 8",
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderCell: {
    color: colors.white,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    padding: "5 8",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: "5 8",
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCell: {
    fontSize: 9,
    color: colors.text,
  },
  totalsBox: {
    marginTop: 16,
    marginLeft: "auto",
    width: 240,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    overflow: "hidden",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "5 10",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  totalsRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "7 10",
    backgroundColor: colors.primary,
  },
  totalsLabel: { fontSize: 9, color: colors.muted },
  totalsValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.text },
  totalsLabelTotal: { fontSize: 10, fontFamily: "Helvetica-Bold", color: colors.white },
  totalsValueTotal: { fontSize: 10, fontFamily: "Helvetica-Bold", color: colors.white },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: colors.muted,
  },
})

type LigneData = {
  designation: string
  description: string | null
  quantite: number
  prixUnitaire: string | number
  total: string | number
}

type RecuCaisseData = {
  numero: string
  statut: string
  statutReglement: string | null
  dateEmission: string
  montantHT: string | number
  montantTVA: string | number
  montantTTC: string | number
  montantAvanceVerse: number | null
  soldeRestant: number | null
  notes: string | null
  client: {
    raisonSociale: string
    contactNom: string
    contactPrenom: string | null
    contactPoste: string | null
    contactEmail: string | null
    contactPhone: string
    adresse: string | null
    ville: string | null
    pays: string
  }
  commande: {
    numero: string
    devise: string
    lignes: LigneData[]
  }
}

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  ENVOYEE: "Envoyée",
}

const STATUT_COLORS: Record<string, string> = {
  EN_ATTENTE: colors.amber,
  ENVOYEE: colors.green,
}

const REGLEMENT_LABELS: Record<string, string> = {
  PARTIEL: "Règlement partiel",
  COMPLET: "Règlement complet",
}

const REGLEMENT_COLORS: Record<string, string> = {
  PARTIEL: colors.orange,
  COMPLET: colors.green,
}

function fmt(n: string | number, devise: string) {
  const unit = devise === "EUR" ? "€" : devise === "USD" ? "$" : "FCFA"
  const parts = Number(n).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0")
  return `${parts} ${unit}`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
}

export function RecuCaissePDF({ recu, logoDataUrl }: { recu: RecuCaisseData; logoDataUrl?: string }) {
  const statutColor = STATUT_COLORS[recu.statut] ?? colors.muted
  const reglementColor = recu.statutReglement ? REGLEMENT_COLORS[recu.statutReglement] : null

  return (
    <Document title={`Reçu de caisse ${recu.numero}`} author="Dolee Group">
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            {logoDataUrl && <Image src={logoDataUrl} style={{ width: 44, height: 44, marginBottom: 6 }} />}
            <Text style={styles.companyName}>Dolee Group</Text>
            <Text style={styles.companyTagline}>Gestion commerciale</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.docTitle}>REÇU DE CAISSE</Text>
            <Text style={styles.docSubtitle}>{recu.numero}</Text>
            <View style={{ marginTop: 6, gap: 4, alignItems: "flex-end" }}>
              <View style={[styles.badge, { backgroundColor: statutColor + "22" }]}>
                <Text style={[styles.badgeText, { color: statutColor }]}>
                  {STATUT_LABELS[recu.statut] ?? recu.statut}
                </Text>
              </View>
              {recu.statutReglement && reglementColor && (
                <View style={[styles.badge, { backgroundColor: reglementColor + "22", marginTop: 3 }]}>
                  <Text style={[styles.badgeText, { color: reglementColor }]}>
                    {REGLEMENT_LABELS[recu.statutReglement] ?? recu.statutReglement}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Client + Informations */}
        <View style={[styles.row, styles.section]}>
          <View style={[styles.col, { marginRight: 20 }]}>
            <Text style={styles.sectionTitle}>Client</Text>
            <Text style={styles.valueBold}>{recu.client.raisonSociale}</Text>
            <Text style={styles.value}>
              {recu.client.contactNom}
              {recu.client.contactPrenom ? ` ${recu.client.contactPrenom}` : ""}
              {recu.client.contactPoste ? ` — ${recu.client.contactPoste}` : ""}
            </Text>
            {recu.client.contactEmail && (
              <Text style={[styles.value, { color: colors.primary }]}>{recu.client.contactEmail}</Text>
            )}
            <Text style={styles.value}>{recu.client.contactPhone}</Text>
            {recu.client.adresse && <Text style={styles.value}>{recu.client.adresse}</Text>}
            <Text style={styles.value}>
              {recu.client.ville ? `${recu.client.ville}, ` : ""}{recu.client.pays}
            </Text>
          </View>
          <View style={{ width: 180 }}>
            <Text style={styles.sectionTitle}>Informations</Text>
            <View style={{ marginBottom: 6 }}>
              <Text style={styles.label}>Date d&apos;émission</Text>
              <Text style={styles.value}>{fmtDate(recu.dateEmission)}</Text>
            </View>
            <View style={{ marginBottom: 6 }}>
              <Text style={styles.label}>Référence commande</Text>
              <Text style={[styles.value, { fontFamily: "Helvetica-Bold" }]}>{recu.commande.numero}</Text>
            </View>
            <View>
              <Text style={styles.label}>Référence reçu</Text>
              <Text style={[styles.value, { fontFamily: "Helvetica-Bold" }]}>{recu.numero}</Text>
            </View>
          </View>
        </View>

        {/* Lignes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Désignation des articles</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 4 }]}>Désignation</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "center" }]}>Qté</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: "right" }]}>P.U.</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: "right" }]}>Total</Text>
            </View>
            {recu.commande.lignes.map((l, i) => (
              <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <View style={{ flex: 4 }}>
                  <Text style={[styles.tableCell, { fontFamily: "Helvetica-Bold" }]}>{l.designation}</Text>
                  {l.description && (
                    <Text style={[styles.tableCell, { color: colors.muted, fontSize: 8, marginTop: 1 }]}>
                      {l.description}
                    </Text>
                  )}
                </View>
                <Text style={[styles.tableCell, { flex: 1, textAlign: "center" }]}>{l.quantite}</Text>
                <Text style={[styles.tableCell, { flex: 2, textAlign: "right" }]}>
                  {fmt(l.prixUnitaire, recu.commande.devise)}
                </Text>
                <Text style={[styles.tableCell, { flex: 2, textAlign: "right", fontFamily: "Helvetica-Bold" }]}>
                  {fmt(l.total, recu.commande.devise)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totaux */}
        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Montant HT</Text>
            <Text style={styles.totalsValue}>{fmt(recu.montantHT, recu.commande.devise)}</Text>
          </View>
          {Number(recu.montantTVA) > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>TVA</Text>
              <Text style={styles.totalsValue}>{fmt(recu.montantTVA, recu.commande.devise)}</Text>
            </View>
          )}
          <View style={styles.totalsRowTotal}>
            <Text style={styles.totalsLabelTotal}>TOTAL TTC</Text>
            <Text style={styles.totalsValueTotal}>{fmt(recu.montantTTC, recu.commande.devise)}</Text>
          </View>
          {recu.montantAvanceVerse != null && recu.montantAvanceVerse > 0 && (
            <>
              <View style={[styles.totalsRow, { backgroundColor: "#f0fdf4" }]}>
                <Text style={[styles.totalsLabel, { color: "#16a34a" }]}>Avance versee</Text>
                <Text style={[styles.totalsValue, { color: "#16a34a" }]}>
                  - {fmt(recu.montantAvanceVerse, recu.commande.devise)}
                </Text>
              </View>
              <View style={[styles.totalsRow, { backgroundColor: recu.soldeRestant === 0 ? "#f0fdf4" : "#fff7ed" }]}>
                <Text style={[styles.totalsLabel, { color: recu.soldeRestant === 0 ? "#16a34a" : "#ea580c", fontFamily: "Helvetica-Bold" }]}>
                  {recu.soldeRestant === 0 ? "SOLDE (regle)" : "SOLDE RESTANT"}
                </Text>
                <Text style={[styles.totalsValue, { color: recu.soldeRestant === 0 ? "#16a34a" : "#ea580c", fontFamily: "Helvetica-Bold" }]}>
                  {recu.soldeRestant === 0 ? "0" : fmt(recu.soldeRestant ?? 0, recu.commande.devise)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Notes */}
        {recu.notes && (
          <View style={[styles.section, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.value}>{recu.notes}</Text>
          </View>
        )}

        {/* Régime fiscal */}
        <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
          <Text style={[styles.value, { fontSize: 8, color: colors.muted }]}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Régime Fiscal : </Text>
            Taxe d&apos;État de l&apos;Entreprenant (TEE)
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Dolee Group — Gestion commerciale</Text>
          <Text style={styles.footerText}>{recu.numero} — {fmtDate(recu.dateEmission)}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
