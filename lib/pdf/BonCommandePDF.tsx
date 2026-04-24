import { Document, Page, Text, View, Image } from "@react-pdf/renderer"
import { styles, colors } from "./styles"

type BonCommandeData = {
  numeroBCF: string
  dateEmission: string
  fournisseur: {
    nom: string
    pays: string
    contactNom?: string | null
    contactEmail?: string | null
    contactPhone?: string | null
  }
  commande: { numero: string }
  designation: string | null
  description: string | null
  quantite: number
  devise: string
  coutUnitaire?: number | null
  tauxChange?: number | null
  dateCommandeFournisseur?: string | null
  delaiProduction?: number | null
  dateFinProductionPrevue?: string | null
  notesFournisseur?: string | null
  createdBy: { name: string }
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
}

export function BonCommandePDF({
  data,
  logoDataUrl,
}: {
  data: BonCommandeData
  logoDataUrl?: string
}) {
  const hasPrix = data.coutUnitaire && data.coutUnitaire > 0
  const coutTotal = hasPrix ? data.coutUnitaire! * data.quantite : null

  return (
    <Document title={`BCF ${data.numeroBCF}`} author="Dolee Group">
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            {logoDataUrl && (
              <Image src={logoDataUrl} style={{ width: 44, height: 44 }} />
            )}
          </View>
          <View>
            <Text style={styles.docTitle}>BON DE COMMANDE</Text>
            <Text style={[styles.docSubtitle, { textAlign: "right" }]}>FOURNISSEUR</Text>
            <Text style={[styles.docSubtitle, { marginTop: 6, fontFamily: "Helvetica-Bold", fontSize: 12, color: colors.primary, textAlign: "right" }]}>
              {data.numeroBCF}
            </Text>
            <Text style={[styles.docSubtitle, { marginTop: 4 }]}>
              Émis le {fmtDate(data.dateEmission)}
            </Text>
            <Text style={[styles.docSubtitle, { marginTop: 2 }]}>
              Réf. commande : {data.commande.numero}
            </Text>
          </View>
        </View>

        {/* Fournisseur + Émetteur */}
        <View style={[styles.row, styles.section]}>
          <View style={[styles.col, { marginRight: 20 }]}>
            <Text style={styles.sectionTitle}>Fournisseur</Text>
            <Text style={styles.valueBold}>{data.fournisseur.nom}</Text>
            <Text style={styles.value}>{data.fournisseur.pays}</Text>
            {data.fournisseur.contactNom && (
              <Text style={styles.value}>{data.fournisseur.contactNom}</Text>
            )}
            {data.fournisseur.contactEmail && (
              <Text style={[styles.value, { color: colors.primary }]}>{data.fournisseur.contactEmail}</Text>
            )}
            {data.fournisseur.contactPhone && (
              <Text style={styles.value}>{data.fournisseur.contactPhone}</Text>
            )}
          </View>
          <View style={{ width: 200 }}>
            <Text style={styles.sectionTitle}>Émetteur</Text>
            <Text style={styles.valueBold}>Dolee Group</Text>
            <Text style={styles.value}>Préparé par : {data.createdBy.name}</Text>
            {data.dateCommandeFournisseur && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.label}>Date de commande</Text>
                <Text style={styles.value}>{fmtDate(data.dateCommandeFournisseur)}</Text>
              </View>
            )}
            {data.dateFinProductionPrevue && (
              <View style={{ marginTop: 6 }}>
                <Text style={styles.label}>Livraison souhaitée</Text>
                <Text style={[styles.value, { fontFamily: "Helvetica-Bold", color: colors.primary }]}>
                  {fmtDate(data.dateFinProductionPrevue)}
                </Text>
              </View>
            )}
            {data.delaiProduction && !data.dateFinProductionPrevue && (
              <View style={{ marginTop: 6 }}>
                <Text style={styles.label}>Délai de production</Text>
                <Text style={styles.value}>{data.delaiProduction} jours</Text>
              </View>
            )}
          </View>
        </View>

        {/* Produits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détail de la commande</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 5 }]}>Désignation / Produits</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "center" }]}>Qté</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: "right" }]}>Devise</Text>
              {hasPrix && (
                <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: "right" }]}>P.U.</Text>
              )}
              {hasPrix && (
                <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: "right" }]}>Total</Text>
              )}
            </View>
            <View style={styles.tableRow}>
              <View style={{ flex: 5 }}>
                <Text style={[styles.tableCell, { fontFamily: "Helvetica-Bold" }]}>
                  {data.designation ?? `Commande ${data.commande.numero}`}
                </Text>
                {data.description && (
                  <Text style={[styles.tableCell, { color: colors.muted, fontSize: 8, marginTop: 1 }]}>
                    {data.description}
                  </Text>
                )}
              </View>
              <Text style={[styles.tableCell, { flex: 1, textAlign: "center" }]}>{data.quantite}</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: "right" }]}>{data.devise}</Text>
              {hasPrix && (
                <Text style={[styles.tableCell, { flex: 2, textAlign: "right" }]}>
                  {Number(data.coutUnitaire).toLocaleString("fr-FR")}
                </Text>
              )}
              {hasPrix && (
                <Text style={[styles.tableCell, { flex: 2, textAlign: "right", fontFamily: "Helvetica-Bold" }]}>
                  {coutTotal!.toLocaleString("fr-FR")}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Prix non connu */}
        {!hasPrix && (
          <View style={styles.alertBox}>
            <Text style={styles.alertText}>
              ⚠  Prix non défini — ce bon de commande est envoyé au fournisseur pour confirmation du prix et du délai.
            </Text>
          </View>
        )}

        {/* Taux de change si applicable */}
        {hasPrix && data.tauxChange && data.tauxChange > 0 && (
          <View style={[styles.totalsBox, { marginTop: 12 }]}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Total ({data.devise})</Text>
              <Text style={styles.totalsValue}>{coutTotal!.toLocaleString("fr-FR")} {data.devise}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Taux de change</Text>
              <Text style={styles.totalsValue}>1 {data.devise} = {Number(data.tauxChange).toLocaleString("fr-FR")} FCFA</Text>
            </View>
            <View style={styles.totalsRowTotal}>
              <Text style={styles.totalsLabelTotal}>TOTAL CFA</Text>
              <Text style={styles.totalsValueTotal}>
                {(coutTotal! * Number(data.tauxChange)).toLocaleString("fr-FR")} FCFA
              </Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {data.notesFournisseur && (
          <View style={[styles.section, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>Instructions / Notes</Text>
            <Text style={styles.value}>{data.notesFournisseur}</Text>
          </View>
        )}

        {/* Signature */}
        <View style={{ marginTop: 40, flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ width: 200 }}>
            <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
              <Text style={styles.label}>Signature Dolee Group</Text>
              <Text style={[styles.value, { marginTop: 4 }]}>{data.createdBy.name}</Text>
            </View>
          </View>
          <View style={{ width: 200 }}>
            <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
              <Text style={styles.label}>Cachet & Signature Fournisseur</Text>
              <Text style={[styles.value, { marginTop: 4, color: colors.muted }]}> </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Dolee Group — Bon de Commande Fournisseur</Text>
          <Text style={styles.footerText}>{data.numeroBCF}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
