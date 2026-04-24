import { Document, Page, Text, View, Image } from "@react-pdf/renderer"
import { styles, colors } from "./styles"
import path from "path"

const LOGO_PATH = path.join(process.cwd(), "public", "logo.png")

type CommandeData = {
  numero: string
  status: string
  statusPaiement: string
  modePaiement: string
  montantTotal: string | number
  montantAvance: string | number | null
  devise: string
  dateCommande: string
  dateLivraisonSouhaitee: string | null
  dateLivraisonPrevue: string | null
  notes: string | null
  bonDeCommande: string | null
  confirmedBy: { name: string } | null
  devis: { numero: string } | null
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
  lignes: {
    designation: string
    description: string | null
    quantite: number
    prixUnitaire: string | number
    total: string | number
  }[]
  paiements: {
    type: string
    montant: string | number
    dateReception: string
    modePaiement: string | null
    isConfirmed: boolean
    confirmedBy: { name: string } | null
    dateConfirmation: string | null
  }[]
  productions: {
    status: string
    quantite: number
    coutTotal: string | number
    devise: string
    dateCommandeFournisseur: string | null
    dateFinProductionPrevue: string | null
    dateFinProductionReelle: string | null
    fournisseur: { nom: string; pays: string }
  }[]
  logistiques: {
    label: string | null
    status: string
    transitaireNom: string | null
    dateExpeditionFournisseur: string | null
    dateArriveeEntrepot: string | null
  }[]
  reconditionnements: {
    label: string | null
    status: string
    typePersonalisation: string | null
    dateDebut: string | null
    dateFin: string | null
  }[]
  livraisons: {
    status: string
    adresseLivraison: string
    datePrevue: string
    dateReelle: string | null
    quantiteTotaleLivree: number
    nomSignataire: string | null
    signatureDate: string | null
    assignedTo: { name: string } | null
  }[]
}

function fmt(n: string | number, devise: string) {
  const parts = Number(n).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0")
  return `${parts} ${devise}`
}

function fmtDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
}

const COMMANDE_STATUS: Record<string, string> = {
  EN_ATTENTE_CONFIRMATION: "En attente",
  CONFIRMEE: "Confirmée",
  EN_PRODUCTION: "En production",
  EN_LOGISTIQUE: "En logistique",
  EN_RECONDITIONNEMENT: "En reconditionnement",
  PRETE_LIVRAISON: "Prête à livrer",
  LIVREE: "Livrée",
  ANNULEE: "Annulée",
}

const PAYMENT_STATUS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  AVANCE_RECUE: "Avance reçue",
  SOLDE_RECU: "Solde reçu",
  PAIEMENT_COMPLET: "Payé",
  EN_RETARD: "En retard",
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PAIEMENT_COMPLET: colors.green,
  AVANCE_RECUE: colors.primary,
  EN_RETARD: colors.red,
  EN_ATTENTE: colors.muted,
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 4 }}>
      <Text style={[styles.label, { width: 140, marginBottom: 0 }]}>{label}</Text>
      <Text style={[styles.value, { flex: 1 }]}>{value}</Text>
    </View>
  )
}

export function RapportCommandePDF({ commande }: { commande: CommandeData }) {
  const sousTotal = commande.lignes.reduce((s, l) => s + Number(l.total), 0)
  const totalPaye = commande.paiements
    .filter((p) => p.isConfirmed)
    .reduce((s, p) => s + Number(p.montant), 0)
  const statusColor = commande.status === "LIVREE" ? colors.green
    : commande.status === "ANNULEE" ? colors.red
    : colors.primary
  const paiementColor = PAYMENT_STATUS_COLORS[commande.statusPaiement] ?? colors.muted

  const quantiteTotale = commande.lignes.reduce((s, l) => s + l.quantite, 0)
  const quantiteLivreeTotale = commande.livraisons.reduce((s, liv) => s + (liv.quantiteTotaleLivree ?? 0), 0)
  const resteALivrer = Math.max(0, quantiteTotale - quantiteLivreeTotale)

  return (
    <Document title={`Rapport — ${commande.numero}`} author="Dolee Group">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Image src={LOGO_PATH} style={{ width: 44, height: 44 }} />
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.docTitle}>{commande.numero}</Text>
            <Text style={styles.docSubtitle}>{fmtDate(commande.dateCommande)}</Text>
            <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
              <View style={[styles.badge, { backgroundColor: statusColor + "22" }]}>
                <Text style={[styles.badgeText, { color: statusColor }]}>
                  {COMMANDE_STATUS[commande.status] ?? commande.status}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: paiementColor + "22" }]}>
                <Text style={[styles.badgeText, { color: paiementColor }]}>
                  {PAYMENT_STATUS[commande.statusPaiement] ?? commande.statusPaiement}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Client */}
        <View style={[styles.row, styles.section]}>
          <View style={[styles.col, { marginRight: 20 }]}>
            <Text style={styles.sectionTitle}>Client</Text>
            <Text style={styles.valueBold}>{commande.client.raisonSociale}</Text>
            <Text style={styles.value}>
              {commande.client.contactNom}{commande.client.contactPrenom ? ` ${commande.client.contactPrenom}` : ""}
            </Text>
            {commande.client.contactEmail && <Text style={styles.value}>{commande.client.contactEmail}</Text>}
            <Text style={styles.value}>{commande.client.contactPhone}</Text>
          </View>
          <View style={{ width: 200 }}>
            <Text style={styles.sectionTitle}>Détails</Text>
            <InfoRow label="Mode paiement" value={commande.modePaiement === "AVANCE_SOLDE" ? "Avance + Solde" : "Bon de commande"} />
            {commande.devis && <InfoRow label="Devis lié" value={commande.devis.numero} />}
            {commande.bonDeCommande && <InfoRow label="Bon de commande" value={commande.bonDeCommande} />}
            {commande.dateLivraisonSouhaitee && <InfoRow label="Livraison souhaitée" value={fmtDate(commande.dateLivraisonSouhaitee)} />}
            {commande.confirmedBy && <InfoRow label="Confirmée par" value={commande.confirmedBy.name} />}
          </View>
        </View>

        {/* Lignes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lignes de commande</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 4 }]}>Désignation</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "center" }]}>Qté</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: "right" }]}>P.U.</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: "right" }]}>Total</Text>
            </View>
            {commande.lignes.map((l, i) => (
              <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <View style={{ flex: 4 }}>
                  <Text style={[styles.tableCell, { fontFamily: "Helvetica-Bold" }]}>{l.designation}</Text>
                  {l.description && <Text style={[styles.tableCell, { color: colors.muted, fontSize: 8 }]}>{l.description}</Text>}
                </View>
                <Text style={[styles.tableCell, { flex: 1, textAlign: "center" }]}>{l.quantite}</Text>
                <Text style={[styles.tableCell, { flex: 2, textAlign: "right" }]}>{fmt(l.prixUnitaire, commande.devise)}</Text>
                <Text style={[styles.tableCell, { flex: 2, textAlign: "right", fontFamily: "Helvetica-Bold" }]}>{fmt(l.total, commande.devise)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Sous-total</Text>
              <Text style={styles.totalsValue}>{fmt(sousTotal, commande.devise)}</Text>
            </View>
            <View style={styles.totalsRowTotal}>
              <Text style={styles.totalsLabelTotal}>TOTAL</Text>
              <Text style={styles.totalsValueTotal}>{fmt(commande.montantTotal, commande.devise)}</Text>
            </View>
          </View>
        </View>

        {/* Paiements */}
        {commande.paiements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Paiements</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Type</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: "right" }]}>Montant</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Reçu le</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Statut</Text>
              </View>
              {commande.paiements.map((p, i) => (
                <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{p.type}</Text>
                  <Text style={[styles.tableCell, { flex: 2, textAlign: "right", fontFamily: "Helvetica-Bold" }]}>{fmt(p.montant, commande.devise)}</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{fmtDate(p.dateReception)}</Text>
                  <Text style={[styles.tableCell, { flex: 2, color: p.isConfirmed ? colors.green : colors.amber }]}>
                    {p.isConfirmed ? `Confirmé${p.confirmedBy ? ` par ${p.confirmedBy.name}` : ""}` : "En attente"}
                  </Text>
                </View>
              ))}
            </View>
            <View style={[styles.totalsBox, { width: 260 }]}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Total payé (confirmé)</Text>
                <Text style={[styles.totalsValue, { color: colors.green }]}>{fmt(totalPaye, commande.devise)}</Text>
              </View>
              <View style={styles.totalsRowTotal}>
                <Text style={styles.totalsLabelTotal}>SOLDE RESTANT</Text>
                <Text style={styles.totalsValueTotal}>{fmt(Number(commande.montantTotal) - totalPaye, commande.devise)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Productions (multi-fournisseurs) */}
        {commande.productions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Production{commande.productions.length > 1 ? "s" : ""}</Text>
            {commande.productions.map((p, i) => (
              <View key={i} style={{ marginBottom: 8 }}>
                {commande.productions.length > 1 && (
                  <Text style={[styles.label, { color: colors.primary, fontFamily: "Helvetica-Bold", marginBottom: 3 }]}>
                    {p.fournisseur.nom}
                  </Text>
                )}
                <InfoRow label="Fournisseur" value={`${p.fournisseur.nom} (${p.fournisseur.pays})`} />
                <InfoRow label="Statut" value={p.status} />
                <InfoRow label="Quantité" value={String(p.quantite)} />
                <InfoRow label="Coût total" value={fmt(p.coutTotal, p.devise)} />
                <InfoRow label="Commande fournisseur" value={fmtDate(p.dateCommandeFournisseur)} />
                <InfoRow label="Fin production prévue" value={fmtDate(p.dateFinProductionPrevue)} />
                <InfoRow label="Fin production réelle" value={fmtDate(p.dateFinProductionReelle)} />
              </View>
            ))}
          </View>
        )}

        {/* Logistique(s) */}
        {commande.logistiques.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Logistique{commande.logistiques.length > 1 ? "s" : ""}</Text>
            {commande.logistiques.map((log, i) => (
              <View key={i} style={i > 0 ? { marginTop: 6, paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.border } : {}}>
                {(commande.logistiques.length > 1 || log.label) && (
                  <Text style={[styles.label, { color: colors.primary, fontFamily: "Helvetica-Bold", marginBottom: 3 }]}>
                    {log.label ?? `Logistique ${i + 1}`}
                  </Text>
                )}
                <InfoRow label="Statut" value={log.status} />
                {log.transitaireNom && <InfoRow label="Transitaire" value={log.transitaireNom} />}
                <InfoRow label="Expédition fournisseur" value={fmtDate(log.dateExpeditionFournisseur)} />
                <InfoRow label="Arrivée entrepôt" value={fmtDate(log.dateArriveeEntrepot)} />
              </View>
            ))}
          </View>
        )}

        {/* Livraisons */}
        {commande.livraisons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Livraison{commande.livraisons.length > 1 ? "s" : ""}</Text>
            <InfoRow label="Qté totale commandée" value={String(quantiteTotale)} />
            <InfoRow label="Qté totale livrée" value={String(quantiteLivreeTotale)} />
            {resteALivrer > 0 && <InfoRow label="Reste à livrer" value={String(resteALivrer)} />}
            {commande.livraisons.map((liv, i) => (
              <View key={i} style={{ marginTop: 6, paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.border }}>
                {commande.livraisons.length > 1 && (
                  <Text style={[styles.label, { color: colors.primary, fontFamily: "Helvetica-Bold", marginBottom: 3 }]}>
                    Livraison #{i + 1} — {liv.quantiteTotaleLivree} unités
                  </Text>
                )}
                <InfoRow label="Statut" value={liv.status} />
                <InfoRow label="Adresse" value={liv.adresseLivraison} />
                <InfoRow label="Date prévue" value={fmtDate(liv.datePrevue)} />
                {liv.dateReelle && <InfoRow label="Date réelle" value={fmtDate(liv.dateReelle)} />}
                {liv.assignedTo && <InfoRow label="Livreur" value={liv.assignedTo.name} />}
                {liv.nomSignataire && <InfoRow label="Signé par" value={liv.nomSignataire} />}
                {liv.signatureDate && <InfoRow label="Date signature" value={fmtDate(liv.signatureDate)} />}
              </View>
            ))}
          </View>
        )}

        {/* Alerte partielle */}
        {resteALivrer > 0 && commande.livraisons.length > 0 && (
          <View style={styles.alertBox}>
            <Text style={styles.alertText}>
              LIVRAISON PARTIELLE — {resteALivrer} unite{resteALivrer > 1 ? "s" : ""} non encore livree{resteALivrer > 1 ? "s" : ""}
            </Text>
          </View>
        )}

        {/* Notes */}
        {commande.notes && (
          <View style={[styles.section, { marginTop: 12 }]}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.value}>{commande.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Dolee Group — Rapport de commande</Text>
          <Text style={styles.footerText}>{commande.numero}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
