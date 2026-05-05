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
  contact: {
    nom: string
    prenom: string | null
    poste: string | null
    email: string | null
    phone: string
  } | null
  lignes: DevisLigne[]
  createdBy: { name: string }
}

type ConditionsStructurees = { commande: number; livraison: number }

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
  const parts = Number(n).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  return `${parts} ${devise}`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
}

function parseConditions(raw: string | null): ConditionsStructurees | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed.commande === "number" && typeof parsed.livraison === "number") {
      return parsed as ConditionsStructurees
    }
  } catch { /* plain text */ }
  return null
}

export function DevisPDF({ devis, logoDataUrl }: { devis: DevisData; logoDataUrl?: string }) {
  const statusColor = STATUS_COLORS[devis.status] ?? colors.muted
  const hasRemise = devis.lignes.some((l) => Number(l.remise) > 0)
  const hasRemiseFixe = devis.lignes.some((l) => Number(l.remiseFixe) > 0)
  const conditions = parseConditions(devis.conditionsPaiement)
  const totalNum = Number(devis.total)

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
            {(() => {
              const c = devis.contact ?? {
                nom: devis.client.contactNom,
                prenom: devis.client.contactPrenom,
                poste: devis.client.contactPoste,
                email: devis.client.contactEmail,
                phone: devis.client.contactPhone,
              }
              return (
                <>
                  <Text style={styles.value}>
                    {c.nom}{c.prenom ? ` ${c.prenom}` : ""}
                    {c.poste ? ` — ${c.poste}` : ""}
                  </Text>
                  {c.email && (
                    <Text style={[styles.value, { color: colors.primary }]}>{c.email}</Text>
                  )}
                  <Text style={styles.value}>{c.phone}</Text>
                </>
              )
            })()}
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

        {/* Lignes — wrap={true} pour que le tableau commence page 1 et s'étende */}
        <View style={styles.section}>
          <View style={styles.table}>
            <View style={styles.tableHeader} fixed>
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
              <View key={i} wrap={false} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
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

          {/* Échéancier structuré */}
          {conditions ? (
            <View style={{ marginBottom: 10 }}>
              <View style={{
                borderWidth: 1, borderColor: colors.border, borderRadius: 6, overflow: "hidden",
                marginBottom: 8, width: 320,
              }}>
                <View style={{ backgroundColor: colors.primary + "11", flexDirection: "row", padding: "5 10" }}>
                  <Text style={[styles.label, { width: 140, marginBottom: 0 }]}>Échéance</Text>
                  <Text style={[styles.label, { width: 40, textAlign: "right", marginBottom: 0 }]}>%</Text>
                  <Text style={[styles.label, { flex: 1, textAlign: "right", marginBottom: 0 }]}>Montant</Text>
                </View>
                <View style={{ flexDirection: "row", padding: "6 10", borderTopWidth: 1, borderTopColor: colors.border }}>
                  <Text style={[styles.value, { width: 140, fontFamily: "Helvetica-Bold" }]}>À la commande</Text>
                  <Text style={[styles.value, { width: 40, textAlign: "right", color: colors.primary }]}>
                    {conditions.commande}%
                  </Text>
                  <Text style={[styles.value, { flex: 1, textAlign: "right", fontFamily: "Helvetica-Bold" }]}>
                    {fmt(totalNum * conditions.commande / 100, devis.devise)}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", padding: "6 10", borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg }}>
                  <Text style={[styles.value, { width: 140, fontFamily: "Helvetica-Bold" }]}>À la livraison</Text>
                  <Text style={[styles.value, { width: 40, textAlign: "right", color: colors.primary }]}>
                    {conditions.livraison}%
                  </Text>
                  <Text style={[styles.value, { flex: 1, textAlign: "right", fontFamily: "Helvetica-Bold" }]}>
                    {fmt(totalNum * conditions.livraison / 100, devis.devise)}
                  </Text>
                </View>
              </View>
            </View>
          ) : devis.conditionsPaiement ? (
            <Text style={[styles.value, { marginBottom: 8, fontFamily: "Helvetica-Bold" }]}>
              {devis.conditionsPaiement}
            </Text>
          ) : null}

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
