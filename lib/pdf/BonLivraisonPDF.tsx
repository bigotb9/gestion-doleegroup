import { Document, Page, Text, View, Image } from "@react-pdf/renderer"
import { styles, colors } from "./styles"

type LivraisonLignePDF = {
  designation: string
  description: string | null
  quantiteCommandee: number
  quantiteDejaLivree: number  // livraisons précédentes confirmées
  quantiteCetteLivraison: number // cette livraison
  resteApres: number
}

type LivraisonData = {
  status: string
  adresseLivraison: string
  contactLivraison: string | null
  datePrevue: string
  dateReelle: string | null
  nombreSignaturesClient: number
  nomSignataire: string | null
  signatureDate: string | null
  signatureUrl: string | null
  nomSignataire2: string | null
  signatureUrl2: string | null
  signatureChargeUrl: string | null
  signatureChargeDate: string | null
  nomSignataireCharge: string | null
  notes: string | null
  assignedTo: { name: string } | null
  lignesLivraison: LivraisonLignePDF[]
  client: {
    raisonSociale: string
    contactNom: string
    contactPhone: string
    adresse: string | null
    ville: string | null
    pays: string
  }
  commande: { numero: string }
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
}

const STATUS_LABELS: Record<string, string> = {
  PLANIFIEE: "Planifiee",
  EN_COURS: "En cours",
  LIVREE: "Livree",
  ECHEC: "Echec",
}
const STATUS_COLORS: Record<string, string> = {
  LIVREE: colors.green,
  EN_COURS: colors.primary,
  PLANIFIEE: colors.amber,
  ECHEC: colors.red,
}

export function BonLivraisonPDF({
  livraison,
  totalCommande,
  totalDejaLivre,
  totalCetteLivraison,
  totalResteApres,
  logoDataUrl,
}: {
  livraison: LivraisonData
  totalCommande: number
  totalDejaLivre: number
  totalCetteLivraison: number
  totalResteApres: number
  logoDataUrl?: string
}) {
  const isPartial = totalResteApres > 0
  const statusColor = STATUS_COLORS[livraison.status] ?? colors.muted
  const nbSig = livraison.nombreSignaturesClient ?? 1

  return (
    <Document title={`Bon de livraison — ${livraison.commande.numero}`} author="Dolee Group">
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            {logoDataUrl && <Image src={logoDataUrl} style={{ width: 44, height: 44 }} />}
          </View>
          <View>
            <Text style={styles.docTitle}>BON DE LIVRAISON</Text>
            <Text style={styles.docSubtitle}>Commande {livraison.commande.numero}</Text>
            <View style={{ marginTop: 6, alignItems: "flex-end" }}>
              <View style={[styles.badge, { backgroundColor: statusColor + "22" }]}>
                <Text style={[styles.badgeText, { color: statusColor }]}>
                  {STATUS_LABELS[livraison.status] ?? livraison.status}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Client + Infos livraison */}
        <View style={[styles.row, styles.section]}>
          <View style={[styles.col, { marginRight: 20 }]}>
            <Text style={styles.sectionTitle}>Destinataire</Text>
            <Text style={styles.valueBold}>{livraison.client.raisonSociale}</Text>
            <Text style={styles.value}>{livraison.client.contactNom} — {livraison.client.contactPhone}</Text>
            {livraison.client.adresse && <Text style={styles.value}>{livraison.client.adresse}</Text>}
            <Text style={styles.value}>
              {livraison.client.ville ? `${livraison.client.ville}, ` : ""}{livraison.client.pays}
            </Text>
          </View>
          <View style={{ width: 180 }}>
            <Text style={styles.sectionTitle}>Informations livraison</Text>
            <View style={{ marginBottom: 5 }}>
              <Text style={styles.label}>Adresse de livraison</Text>
              <Text style={styles.value}>{livraison.adresseLivraison}</Text>
            </View>
            {livraison.contactLivraison && (
              <View style={{ marginBottom: 5 }}>
                <Text style={styles.label}>Contact sur place</Text>
                <Text style={styles.value}>{livraison.contactLivraison}</Text>
              </View>
            )}
            <View style={{ marginBottom: 5 }}>
              <Text style={styles.label}>Date prevue</Text>
              <Text style={styles.value}>{fmtDate(livraison.datePrevue)}</Text>
            </View>
            {livraison.dateReelle && (
              <View style={{ marginBottom: 5 }}>
                <Text style={styles.label}>Date reelle</Text>
                <Text style={styles.value}>{fmtDate(livraison.dateReelle)}</Text>
              </View>
            )}
            {livraison.assignedTo && (
              <View>
                <Text style={styles.label}>Livreur</Text>
                <Text style={styles.value}>{livraison.assignedTo.name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Lignes livrées */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detail par produit</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 4 }]}>Produit</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: "center" }]}>Commande</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: "center" }]}>Livre avant</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.4, textAlign: "center" }]}>Cette livraison</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: "center" }]}>Reste</Text>
            </View>
            {livraison.lignesLivraison.map((l, i) => (
              <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <View style={{ flex: 4 }}>
                  <Text style={[styles.tableCell, { fontFamily: "Helvetica-Bold" }]}>{l.designation}</Text>
                  {l.description && (
                    <Text style={[styles.tableCell, { color: colors.muted, fontSize: 8, marginTop: 1 }]}>{l.description}</Text>
                  )}
                </View>
                <Text style={[styles.tableCell, { flex: 1.2, textAlign: "center" }]}>{l.quantiteCommandee}</Text>
                <Text style={[styles.tableCell, { flex: 1.2, textAlign: "center", color: colors.muted }]}>
                  {l.quantiteDejaLivree > 0 ? l.quantiteDejaLivree : "—"}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.4, textAlign: "center", fontFamily: "Helvetica-Bold", color: colors.primary }]}>
                  {l.quantiteCetteLivraison}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.2, textAlign: "center", color: l.resteApres > 0 ? colors.red : colors.green, fontFamily: "Helvetica-Bold" }]}>
                  {l.resteApres > 0 ? l.resteApres : "OK"}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recap totaux */}
        <View style={[styles.totalsBox, { width: 280 }]}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Total commande</Text>
            <Text style={styles.totalsValue}>{totalCommande}</Text>
          </View>
          {totalDejaLivre > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Livre lors de livraisons precedentes</Text>
              <Text style={[styles.totalsValue, { color: colors.muted }]}>{totalDejaLivre}</Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Livre cette livraison</Text>
            <Text style={[styles.totalsValue, { color: colors.green, fontFamily: "Helvetica-Bold" }]}>{totalCetteLivraison}</Text>
          </View>
          <View style={styles.totalsRowTotal}>
            <Text style={styles.totalsLabelTotal}>{isPartial ? "RESTE A LIVRER" : "LIVRAISON COMPLETE"}</Text>
            <Text style={styles.totalsValueTotal}>{isPartial ? totalResteApres : "OK"}</Text>
          </View>
        </View>

        {isPartial && (
          <View style={[styles.alertBox, { marginTop: 8 }]}>
            <Text style={styles.alertText}>
              LIVRAISON PARTIELLE — {totalResteApres} article{totalResteApres > 1 ? "s" : ""} restant{totalResteApres > 1 ? "s" : ""} a livrer
            </Text>
          </View>
        )}

        {livraison.notes && (
          <View style={[styles.section, { marginTop: 10 }]}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.value}>{livraison.notes}</Text>
          </View>
        )}

        {/* Signatures — compactes pour tenir sur une page */}
        <View style={{ marginTop: 14 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Signatures</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>

            {/* Client 1 */}
            <View style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 4, padding: 8 }}>
              <Text style={[styles.label, { marginBottom: 4 }]}>
                Signature client{nbSig >= 2 ? " 1" : ""}
              </Text>
              {livraison.signatureUrl ? (
                <>
                  <Image src={livraison.signatureUrl} style={{ width: "100%", height: 55 }} />
                  <Text style={[styles.value, { marginTop: 3, fontFamily: "Helvetica-Bold", fontSize: 9 }]}>
                    {livraison.nomSignataire}
                  </Text>
                  {livraison.signatureDate && (
                    <Text style={[styles.value, { color: colors.muted, fontSize: 7 }]}>{fmtDate(livraison.signatureDate)}</Text>
                  )}
                </>
              ) : (
                <View style={{ height: 55, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed" }} />
              )}
              <View style={{ marginTop: 6, borderBottomWidth: 1, borderBottomColor: colors.text }} />
              <Text style={[styles.label, { marginTop: 2, fontSize: 7 }]}>Nom et signature</Text>
            </View>

            {/* Client 2 */}
            {nbSig >= 2 && (
              <View style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 4, padding: 8 }}>
                <Text style={[styles.label, { marginBottom: 4 }]}>Signature client 2</Text>
                {livraison.signatureUrl2 ? (
                  <>
                    <Image src={livraison.signatureUrl2} style={{ width: "100%", height: 55 }} />
                    <Text style={[styles.value, { marginTop: 3, fontFamily: "Helvetica-Bold", fontSize: 9 }]}>
                      {livraison.nomSignataire2}
                    </Text>
                  </>
                ) : (
                  <View style={{ height: 55, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed" }} />
                )}
                <View style={{ marginTop: 6, borderBottomWidth: 1, borderBottomColor: colors.text }} />
                <Text style={[styles.label, { marginTop: 2, fontSize: 7 }]}>Nom et signature</Text>
              </View>
            )}

            {/* Chargé livraison */}
            <View style={{ flex: 1, borderWidth: 1, borderColor: colors.primary + "55", borderRadius: 4, padding: 8, backgroundColor: colors.primary + "08" }}>
              <Text style={[styles.label, { marginBottom: 4, color: colors.primary }]}>Charge de livraison</Text>
              {livraison.signatureChargeUrl ? (
                <>
                  <Image src={livraison.signatureChargeUrl} style={{ width: "100%", height: 55 }} />
                  <Text style={[styles.value, { marginTop: 3, fontFamily: "Helvetica-Bold", fontSize: 9 }]}>
                    {livraison.nomSignataireCharge ?? livraison.assignedTo?.name}
                  </Text>
                  {livraison.signatureChargeDate && (
                    <Text style={[styles.value, { color: colors.muted, fontSize: 7 }]}>{fmtDate(livraison.signatureChargeDate)}</Text>
                  )}
                </>
              ) : (
                <View style={{ height: 55, borderWidth: 1, borderColor: colors.primary + "33", borderStyle: "dashed" }} />
              )}
              <View style={{ marginTop: 6, borderBottomWidth: 1, borderBottomColor: colors.text }} />
              <Text style={[styles.label, { marginTop: 2, fontSize: 7 }]}>Nom et signature</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Dolee Group — Gestion commerciale</Text>
          <Text style={styles.footerText}>Bon de livraison — {livraison.commande.numero}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
