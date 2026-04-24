import { Document, Page, Text, View, Image } from "@react-pdf/renderer"
import { styles, colors } from "./styles"

type DevisLigne = {
  designation: string
  description: string | null
  quantite: number
  prixUnitaire: string | number
  remise: string | number
  remiseFixe: string | number
  total: string | number
}

type DevisData = {
  numero: string
  status: string
  dateEmission: string
  dateValidite: string
  devise: string
  projet: string | null
  notes: string | null
  conditionsPaiement: string | null
  delaiLivraison: string | null
  sousTotal: string | number
  taxe: string | number
  total: string | number
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
  lignes: DevisLigne[]
  createdBy: { name: string }
}

const STATUS_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon",
  EN_ATTENTE_VALIDATION: "En attente",
  VALIDE: "Validé",
  ENVOYE: "Envoyé",
  ACCEPTE: "Accepté",
  REFUSE: "Refusé",
  EXPIRE: "Expiré",
}

const STATUS_COLORS: Record<string, string> = {
  ACCEPTE: colors.green,
  VALIDE: colors.green,
  REFUSE: colors.red,
  EXPIRE: colors.red,
  ENVOYE: colors.primary,
  BROUILLON: colors.muted,
  EN_ATTENTE_VALIDATION: colors.amber,
}

function fmt(n: string | number, devise: string) {
  const parts = Number(n).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0")
  return `${parts} ${devise}`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
}

export function DevisPDF({ devis, logoDataUrl }: { devis: DevisData; logoDataUrl?: string }) {
  const statusColor = STATUS_COLORS[devis.status] ?? colors.muted
  const hasRemise = devis.lignes.some((l) => Number(l.remise) > 0)
  const hasRemiseFixe = devis.lignes.some((l) => Number(l.remiseFixe) > 0)

  return (
    <Document title={`Facture proforma ${devis.numero}`} author="Dolee Group">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: "column", alignItems: "flex-start" }}>
            {logoDataUrl && <Image src={logoDataUrl} style={{ width: 90, height: 90 }} />}
            <View style={{ marginTop: 6 }}>
              <Text style={[styles.companyTagline, { marginTop: 2 }]}>info@doleegroup.com</Text>
              <Text style={styles.companyTagline}>Cocody Angré 8e Tranche</Text>
              <Text style={styles.companyTagline}>RCCM : CI-ABJ-2019-B-20941</Text>
              <Text style={styles.companyTagline}>N°CC : 1961890 X</Text>
            </View>
          </View>
          <View>
            <Text style={styles.docTitle}>FACTURE PROFORMA</Text>
            <Text style={styles.docSubtitle}>{devis.numero}</Text>
            <View style={{ marginTop: 6, alignItems: "flex-end" }}>
              <View style={[styles.badge, { backgroundColor: statusColor + "22" }]}>
                <Text style={[styles.badgeText, { color: statusColor }]}>
                  {STATUS_LABELS[devis.status] ?? devis.status}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Client + Dates */}
        <View style={[styles.row, styles.section]}>
          <View style={[styles.col, { marginRight: 20 }]}>
            <Text style={styles.sectionTitle}>Client</Text>
            <Text style={styles.valueBold}>{devis.client.raisonSociale}</Text>
            <Text style={styles.value}>
              {devis.client.contactNom}{devis.client.contactPrenom ? ` ${devis.client.contactPrenom}` : ""}
              {devis.client.contactPoste ? ` — ${devis.client.contactPoste}` : ""}
            </Text>
            {devis.client.contactEmail && (
              <Text style={[styles.value, { color: colors.primary }]}>{devis.client.contactEmail}</Text>
            )}
            <Text style={styles.value}>{devis.client.contactPhone}</Text>
            {devis.client.adresse && <Text style={styles.value}>{devis.client.adresse}</Text>}
            <Text style={styles.value}>
              {devis.client.ville ? `${devis.client.ville}, ` : ""}{devis.client.pays}
            </Text>
          </View>
          <View style={{ width: 180 }}>
            <Text style={styles.sectionTitle}>Informations</Text>
            {devis.projet && (
              <View style={{ marginBottom: 6 }}>
                <Text style={styles.label}>Projet</Text>
                <Text style={[styles.value, { fontFamily: "Helvetica-Bold" }]}>{devis.projet}</Text>
              </View>
            )}
            <View style={{ marginBottom: 6 }}>
              <Text style={styles.label}>Date d&apos;émission</Text>
              <Text style={styles.value}>{fmtDate(devis.dateEmission)}</Text>
            </View>
            <View style={{ marginBottom: 6 }}>
              <Text style={styles.label}>Date de validité</Text>
              <Text style={styles.value}>{fmtDate(devis.dateValidite)}</Text>
            </View>
            {devis.delaiLivraison && (
              <View style={{ marginBottom: 6 }}>
                <Text style={styles.label}>Délai de livraison</Text>
                <Text style={styles.value}>{devis.delaiLivraison}</Text>
              </View>
            )}
            <View>
              <Text style={styles.label}>Préparé par</Text>
              <Text style={styles.value}>{devis.createdBy.name}</Text>
            </View>
          </View>
        </View>

        {/* Lignes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lignes de la facture proforma</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 4 }]}>Désignation</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "center" }]}>Qté</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: "right" }]}>P.U.</Text>
              {hasRemise && (
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Remise %</Text>
              )}
              {hasRemiseFixe && (
                <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: "right" }]}>Remise fixe</Text>
              )}
              <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: "right" }]}>Total</Text>
            </View>
            {devis.lignes.map((l, i) => (
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
                  {fmt(l.prixUnitaire, devis.devise)}
                </Text>
                {hasRemise && (
                  <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>
                    {Number(l.remise) > 0 ? `${l.remise}%` : "—"}
                  </Text>
                )}
                {hasRemiseFixe && (
                  <Text style={[styles.tableCell, { flex: 1.5, textAlign: "right" }]}>
                    {Number(l.remiseFixe) > 0 ? fmt(l.remiseFixe, devis.devise) : "—"}
                  </Text>
                )}
                <Text style={[styles.tableCell, { flex: 2, textAlign: "right", fontFamily: "Helvetica-Bold" }]}>
                  {fmt(l.total, devis.devise)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totaux */}
        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Sous-total</Text>
            <Text style={styles.totalsValue}>{fmt(devis.sousTotal, devis.devise)}</Text>
          </View>
          {Number(devis.taxe) > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Taxe</Text>
              <Text style={styles.totalsValue}>{fmt(devis.taxe, devis.devise)}</Text>
            </View>
          )}
          <View style={styles.totalsRowTotal}>
            <Text style={styles.totalsLabelTotal}>TOTAL</Text>
            <Text style={styles.totalsValueTotal}>{fmt(devis.total, devis.devise)}</Text>
          </View>
        </View>

        {/* Conditions paiement */}
        <View style={[styles.section, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Conditions de paiement</Text>
          {devis.conditionsPaiement && (
            <Text style={[styles.value, { marginBottom: 8, fontFamily: "Helvetica-Bold" }]}>
              {devis.conditionsPaiement}
            </Text>
          )}
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 4 }}>
              <Text style={[styles.label, { marginBottom: 0, minWidth: 90 }]}>Par chèque</Text>
              <Text style={styles.value}>À l&apos;ordre de DOLEE GROUP SARL</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 4 }}>
              <Text style={[styles.label, { marginBottom: 0, minWidth: 90 }]}>Par virement</Text>
              <Text style={styles.value}>ORABANK CI — CI121 01306 032549400201 69</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {devis.notes && (
          <View style={[styles.section, { marginTop: 8 }]}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.value}>{devis.notes}</Text>
          </View>
        )}

        {/* Régime Fiscal */}
        <View style={[styles.section, { marginTop: 8, borderTop: "1pt solid #e2e8f0", paddingTop: 8 }]}>
          <Text style={[styles.value, { fontSize: 8, color: colors.muted }]}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Régime Fiscal : </Text>
            Taxe d&apos;État de l&apos;Entreprenant (TEE)
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>info@doleegroup.com</Text>
          <Text style={styles.footerText}>{devis.numero} — {fmtDate(devis.dateEmission)}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
