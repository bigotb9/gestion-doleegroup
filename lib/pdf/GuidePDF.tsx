import {
  Document, Page, Text, View, Image, StyleSheet, Font,
} from "@react-pdf/renderer"
import path from "path"

const LOGO_PATH = path.join(process.cwd(), "public", "logo.png")

// ── Couleurs ──────────────────────────────────────────────────────────────
const C = {
  navy:      "#16166B",
  navyLight: "#1e1e8a",
  gold:      "#D4AF37",
  goldLight: "#F5E88A",
  white:     "#FFFFFF",
  bg:        "#F8FAFC",
  text:      "#1E293B",
  muted:     "#64748B",
  border:    "#E2E8F0",
  green:     "#059669",
  amber:     "#D97706",
  red:       "#DC2626",
  blue:      "#2563EB",
  purple:    "#7C3AED",
  teal:      "#0D9488",
}

// ── Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.text,
    backgroundColor: C.white,
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 50,
  },
  cover: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.white,
    backgroundColor: C.navy,
    padding: 0,
    margin: 0,
  },

  // Cover elements
  coverInner: {
    flex: 1,
    padding: 56,
    position: "relative",
  },
  coverTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 36,
    color: C.white,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  coverSubtitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 20,
    color: C.gold,
    marginBottom: 24,
  },
  coverDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 1.7,
    maxWidth: 380,
  },
  coverMeta: {
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
    marginTop: 8,
  },
  coverBottom: {
    position: "absolute",
    bottom: 56,
    left: 56,
    right: 56,
  },
  coverLine: {
    height: 1,
    backgroundColor: "rgba(212,175,55,0.35)",
    marginBottom: 16,
  },
  coverFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coverFooterText: {
    fontSize: 9,
    color: "rgba(255,255,255,0.3)",
  },

  // TOC
  tocTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    color: C.navy,
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: C.gold,
  },
  tocItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tocChapter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tocDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.gold,
  },
  tocLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: C.navy,
  },
  tocSub: {
    fontSize: 9,
    color: C.muted,
    marginLeft: 14,
  },
  tocPage: {
    fontSize: 10,
    color: C.muted,
  },

  // Chapter header
  chapterBanner: {
    borderRadius: 8,
    padding: "14 20",
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  chapterNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  chapterNumText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    color: C.white,
  },
  chapterTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 20,
    color: C.white,
    flex: 1,
  },
  chapterIcon: {
    fontSize: 22,
    color: "rgba(255,255,255,0.5)",
  },

  // Section
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    color: C.navy,
    marginTop: 18,
    marginBottom: 8,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: C.gold,
  },
  body: {
    fontSize: 10,
    color: C.text,
    lineHeight: 1.75,
    marginBottom: 8,
  },

  // Step box
  stepBox: {
    backgroundColor: C.bg,
    borderRadius: 8,
    padding: "12 14",
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: C.navy,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.navy,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: C.white,
  },
  stepTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: C.navy,
  },
  stepBody: {
    fontSize: 9.5,
    color: C.text,
    lineHeight: 1.65,
    paddingLeft: 30,
  },

  // Tip / Warning
  tipBox: {
    backgroundColor: "#FEF9C3",
    borderRadius: 6,
    padding: "10 12",
    marginBottom: 10,
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  tipEmoji: { fontSize: 14, lineHeight: 1.3 },
  tipText: { fontSize: 9.5, color: "#92400E", lineHeight: 1.6, flex: 1 },

  warnBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 6,
    padding: "10 12",
    marginBottom: 10,
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  warnText: { fontSize: 9.5, color: "#991B1B", lineHeight: 1.6, flex: 1 },

  infoBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: 6,
    padding: "10 12",
    marginBottom: 10,
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  infoText: { fontSize: 9.5, color: "#1E3A8A", lineHeight: 1.6, flex: 1 },

  // Table
  table: { marginBottom: 14 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.navy,
    padding: "6 0",
    borderRadius: 6,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: C.white,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: "row",
    padding: "6 0",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: "6 0",
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableCell: {
    fontSize: 9.5,
    color: C.text,
    paddingHorizontal: 10,
    flex: 1,
  },
  tableCellBold: {
    fontSize: 9.5,
    color: C.navy,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 10,
    flex: 1,
  },

  // Badge
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  badgeText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },

  // Key shortcut
  keyBox: {
    backgroundColor: C.bg,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: C.border,
    alignSelf: "flex-start",
  },
  keyText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: C.navy,
  },

  // Section divider
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 16,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 28,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: C.muted,
  },
  footerGold: {
    fontSize: 8,
    color: C.gold,
    fontFamily: "Helvetica-Bold",
  },

  // Two columns
  twoCol: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 10,
  },
  col: { flex: 1 },

  // Role badges
  roleManager: { backgroundColor: "#EDE9FE", color: "#5B21B6" },
  roleSecretaire: { backgroundColor: "#DBEAFE", color: "#1E40AF" },
  roleOps: { backgroundColor: "#D1FAE5", color: "#065F46" },
})

// ── Components ────────────────────────────────────────────────────────────

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerGold}>Dolee Group</Text>
      <Text style={s.footerText}>Guide d&apos;utilisation — Confidentiel</Text>
      <Text style={s.footerText} render={({ pageNumber, totalPages }) =>
        `Page ${pageNumber} / ${totalPages}`
      } />
    </View>
  )
}

function ChapterBanner({ num, title, color = C.navy }: { num: string; title: string; color?: string }) {
  return (
    <View style={[s.chapterBanner, { backgroundColor: color }]}>
      <View style={s.chapterNum}>
        <Text style={s.chapterNumText}>{num}</Text>
      </View>
      <Text style={s.chapterTitle}>{title}</Text>
    </View>
  )
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <View style={s.stepBox}>
      <View style={s.stepHeader}>
        <View style={s.stepNum}><Text style={s.stepNumText}>{n}</Text></View>
        <Text style={s.stepTitle}>{title}</Text>
      </View>
      <Text style={s.stepBody}>{body}</Text>
    </View>
  )
}

function Tip({ text }: { text: string }) {
  return (
    <View style={s.tipBox}>
      <Text style={s.tipEmoji}>💡</Text>
      <Text style={s.tipText}>{text}</Text>
    </View>
  )
}

function Warn({ text }: { text: string }) {
  return (
    <View style={s.warnBox}>
      <Text style={s.tipEmoji}>⚠️</Text>
      <Text style={s.warnText}>{text}</Text>
    </View>
  )
}

function Info({ text }: { text: string }) {
  return (
    <View style={s.infoBox}>
      <Text style={s.tipEmoji}>ℹ️</Text>
      <Text style={s.infoText}>{text}</Text>
    </View>
  )
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={s.sectionTitle}>{children}</Text>
}

function Body({ children }: { children: string }) {
  return <Text style={s.body}>{children}</Text>
}

function Divider() {
  return <View style={s.divider} />
}

// ── Guide PDF principal ───────────────────────────────────────────────────

export function GuidePDF() {
  const year = new Date().getFullYear()

  return (
    <Document
      title="Guide d'utilisation — Dolee Group"
      author="Dolee Group"
      subject="Manuel utilisateur de la plateforme de gestion commerciale"
      keywords="guide, utilisation, dolee, gestion, commandes, crm"
    >

      {/* ═══════════════════════════════════════════════════════════════
          PAGE DE COUVERTURE
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.cover}>
        {/* Grille décorative */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.04 }}>
          <View style={{ flex: 1, backgroundColor: "transparent" }} />
        </View>

        {/* Bande or en haut */}
        <View style={{ height: 6, backgroundColor: C.gold }} />

        <View style={s.coverInner}>
          {/* Logo */}
          <Image src={LOGO_PATH} style={{ width: 72, height: 72, marginBottom: 40 }} />

          {/* Titre */}
          <Text style={s.coverTitle}>Guide d&apos;utilisation</Text>
          <Text style={s.coverSubtitle}>Plateforme Dolee Group</Text>
          <Text style={s.coverDesc}>
            Ce guide couvre l&apos;ensemble des fonctionnalités de la plateforme de gestion commerciale :
            CRM, devis, commandes, logistique, stock, reconditionnement, livraisons et facturation.
          </Text>
          <Text style={[s.coverMeta, { marginTop: 16 }]}>Version {year} · Accès réservé aux membres de l&apos;équipe</Text>

          {/* Bottom */}
          <View style={s.coverBottom}>
            <View style={s.coverLine} />
            <View style={s.coverFooter}>
              <Text style={s.coverFooterText}>© {year} Dolee Group — Confidentiel</Text>
              <Text style={[s.coverFooterText, { color: C.gold }]}>gestion-commerciale.dolee-group.ci</Text>
            </View>
          </View>
        </View>

        {/* Bande or en bas */}
        <View style={{ height: 3, backgroundColor: C.gold, opacity: 0.5 }} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════
          TABLE DES MATIÈRES
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Text style={s.tocTitle}>Table des matières</Text>

        {[
          { num: "01", label: "Connexion & Prise en main", sub: "Accès, rôles, navigation", color: C.navy },
          { num: "02", label: "Tableau de bord", sub: "KPIs, graphiques, alertes", color: "#1d4ed8" },
          { num: "03", label: "CRM — Prospects & Clients", sub: "Fiche client, relances, devis", color: "#7c3aed" },
          { num: "04", label: "Factures proforma (Devis)", sub: "Création, validation, envoi, PDF", color: "#0d9488" },
          { num: "05", label: "Commandes", sub: "Pipeline, paiements, kanban", color: "#0369a1" },
          { num: "06", label: "Fournisseurs & Production", sub: "BCF, coûts, suivi fabrication", color: "#92400e" },
          { num: "07", label: "Logistique", sub: "6 étapes, transitaire, douane", color: "#065f46" },
          { num: "08", label: "Stock", sub: "Articles, mouvements, alertes", color: "#7c3aed" },
          { num: "09", label: "Reconditionnement", sub: "BAT, personnalisation, articles", color: "#9f1239" },
          { num: "10", label: "Livraisons", sub: "Planification, signatures, PDF", color: "#0f766e" },
          { num: "11", label: "Facturation", sub: "FNE, reçus de caisse, règlement", color: "#1e40af" },
          { num: "12", label: "Dépenses", sub: "Saisie, types, justificatifs", color: "#b91c1c" },
          { num: "13", label: "Fiches de coût produit", sub: "Catalogue interne, fournisseurs", color: "#0369a1" },
          { num: "14", label: "Paramètres & Administration", sub: "Utilisateurs, catalogue, audit", color: "#374151" },
        ].map((item, i) => (
          <View key={i} style={s.tocItem}>
            <View style={s.tocChapter}>
              <View style={[s.tocDot, { backgroundColor: item.color }]} />
              <View>
                <Text style={[s.tocLabel, { color: item.color }]}>
                  {item.num} — {item.label}
                </Text>
                <Text style={s.tocSub}>{item.sub}</Text>
              </View>
            </View>
          </View>
        ))}

        <Footer />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════
          CHAPITRE 01 — CONNEXION & PRISE EN MAIN
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <ChapterBanner num="01" title="Connexion & Prise en main" color={C.navy} />

        <SectionTitle>Accès à la plateforme</SectionTitle>
        <Body>La plateforme est accessible via votre navigateur web (Chrome, Firefox, Edge). Aucune installation n&apos;est requise.</Body>

        <Step n={1} title="Ouvrir le navigateur" body="Saisissez l&apos;adresse de la plateforme dans la barre d&apos;adresse de votre navigateur." />
        <Step n={2} title="Saisir vos identifiants" body="Entrez votre adresse email professionnelle (format: prenom@dolee-group.ci) et votre mot de passe." />
        <Step n={3} title="Cliquer sur « Se connecter »" body="Après validation, vous êtes automatiquement redirigé vers le tableau de bord." />

        <Warn text="Ne partagez jamais votre mot de passe. Chaque membre de l&apos;équipe dispose de son propre compte." />

        <SectionTitle>Rôles et permissions</SectionTitle>
        <Body>La plateforme distingue 3 niveaux d&apos;accès :</Body>

        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { flex: 1.2 }]}>Rôle</Text>
            <Text style={[s.tableHeaderCell, { flex: 2.8 }]}>Accès & Permissions</Text>
          </View>
          {[
            ["Manager", "Accès complet : validation devis, confirmation commandes, gestion paiements, facturation, utilisateurs, audit"],
            ["Secrétaire", "CRM, devis, commandes, catalogue produits, dépenses, facturation (lecture)"],
            ["Chargé des Opérations", "Logistique, stock, reconditionnement, livraisons (signature)"],
          ].map(([role, access], i) => (
            <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={[s.tableCellBold, { flex: 1.2 }]}>{role}</Text>
              <Text style={[s.tableCell, { flex: 2.8 }]}>{access}</Text>
            </View>
          ))}
        </View>

        <SectionTitle>Navigation</SectionTitle>
        <Body>Le menu latéral à gauche (sidebar) donne accès à tous les modules. Sur mobile, le menu s&apos;ouvre via l&apos;icône ☰ en haut à gauche, ou via la barre de navigation en bas de l&apos;écran.</Body>

        <Tip text="Les modules auxquels vous n&apos;avez pas accès n&apos;apparaissent pas dans le menu. Contactez un Manager pour ajuster vos permissions." />

        <Footer />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════
          CHAPITRE 02 — TABLEAU DE BORD
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <ChapterBanner num="02" title="Tableau de bord" color="#1d4ed8" />

        <Body>Le tableau de bord est votre point d&apos;entrée quotidien. Il affiche en temps réel l&apos;état de votre activité commerciale.</Body>

        <SectionTitle>KPIs principaux (3 grandes cartes)</SectionTitle>
        <View style={s.twoCol}>
          <View style={s.col}>
            <View style={[s.stepBox, { borderLeftColor: C.navy }]}>
              <Text style={[s.stepTitle, { color: C.navy, marginBottom: 4 }]}>Commandes actives</Text>
              <Text style={s.stepBody}>Nombre de commandes en cours (hors livrées et annulées). Cliquer → liste filtrée.</Text>
            </View>
          </View>
          <View style={s.col}>
            <View style={[s.stepBox, { borderLeftColor: C.green }]}>
              <Text style={[s.stepTitle, { color: C.green, marginBottom: 4 }]}>Revenu du mois</Text>
              <Text style={s.stepBody}>Total des paiements confirmés sur le mois en cours. Se met à jour à chaque confirmation.</Text>
            </View>
          </View>
        </View>
        <View style={[s.stepBox, { borderLeftColor: C.amber }]}>
          <Text style={[s.stepTitle, { color: C.amber, marginBottom: 4 }]}>En attente de confirmation</Text>
          <Text style={s.stepBody}>Commandes créées mais non encore confirmées par un Manager. Carte rouge si &gt; 0.</Text>
        </View>

        <SectionTitle>KPIs financiers</SectionTitle>
        <Body>La deuxième ligne affiche 5 indicateurs : devis à valider, total FNE, reçus de caisse, dépenses totales et impôts estimés (7% du CA FNE). Chaque carte inclut un mini-graphique de tendance.</Body>

        <SectionTitle>Pipeline de commandes (donut)</SectionTitle>
        <Body>Le graphique circulaire montre la répartition des commandes par statut en temps réel. Passez la souris dessus pour voir le détail.</Body>

        <SectionTitle>Tableau des échéances</SectionTitle>
        <Body>Accédez à /echéances depuis le menu pour voir toutes les dates importantes (devis expirants, livraisons planifiées, fin de production) groupées par urgence : En retard · Aujourd&apos;hui · Cette semaine · Prochainement.</Body>

        <Tip text="Consultez le tableau de bord chaque matin pour identifier rapidement les actions prioritaires du jour." />

        <Footer />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════
          CHAPITRE 03 — CRM
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <ChapterBanner num="03" title="CRM — Prospects & Clients" color="#7c3aed" />

        <SectionTitle>Ajouter un nouveau prospect</SectionTitle>
        <Step n={1} title="Ouvrir le CRM" body="Cliquer sur « CRM / Prospects » dans le menu latéral." />
        <Step n={2} title="Cliquer sur « Nouveau client »" body="Le bouton se trouve en haut à droite de la page." />
        <Step n={3} title="Remplir la fiche" body="Raison sociale (obligatoire), nom du contact, email, téléphone, secteur d&apos;activité, ville, pays. Enregistrer." />
        <Step n={4} title="Qualifier le prospect" body="Choisir le statut : Prospect → Contacté → Devis envoyé → Négociation → Client / Perdu." />

        <SectionTitle>Gestion d&apos;une fiche client</SectionTitle>
        <Body>Cliquez sur un client pour ouvrir sa fiche. Vous y trouverez :</Body>
        <View style={s.twoCol}>
          <View style={s.col}>
            <View style={[s.infoBox, { marginBottom: 6 }]}><Text style={s.infoText}>📋 Onglet Activité : notes internes et historique des relances</Text></View>
            <View style={[s.infoBox, { marginBottom: 6 }]}><Text style={s.infoText}>📄 Onglet Devis : tous les devis liés à ce client</Text></View>
          </View>
          <View style={s.col}>
            <View style={[s.infoBox, { marginBottom: 6 }]}><Text style={s.infoText}>🛒 Onglet Commandes : historique des commandes</Text></View>
            <View style={[s.infoBox, { marginBottom: 6 }]}><Text style={s.infoText}>💰 Situation financière : CA total, encaissé, solde dû</Text></View>
          </View>
        </View>

        <SectionTitle>Relances (CRM → Relances à effectuer)</SectionTitle>
        <Body>La page /crm/relances liste automatiquement 4 catégories d&apos;actions à entreprendre :</Body>
        {[
          ["Devis sans réponse +7 jours", "Devis envoyés au client sans retour depuis plus d&apos;une semaine"],
          ["Commandes sans paiement +7 j", "Commandes confirmées sans paiement reçu"],
          ["Commandes livrées sans facture", "À facturer immédiatement"],
          ["Prospects sans contact +30 j", "Prospects à relancer pour maintenir la relation"],
        ].map(([title, desc], i) => (
          <View key={i} style={[s.tableRow, i % 2 === 0 ? {} : { backgroundColor: C.bg }]}>
            <Text style={[s.tableCellBold, { flex: 1.5 }]}>{title}</Text>
            <Text style={[s.tableCell, { flex: 2.5 }]}>{desc}</Text>
          </View>
        ))}

        <Footer />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════
          CHAPITRE 04 — DEVIS (FACTURE PROFORMA)
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <ChapterBanner num="04" title="Factures proforma (Devis)" color="#0d9488" />

        <SectionTitle>Créer une facture proforma</SectionTitle>
        <Step n={1} title="Accéder à « Factures proforma »" body="Menu latéral → Factures proforma." />
        <Step n={2} title="Cliquer sur « Nouveau devis »" body="Bouton en haut à droite." />
        <Step n={3} title="Sélectionner le client" body="Recherchez par nom ou raison sociale dans le champ de recherche." />
        <Step n={4} title="Configurer la devise et la date de validité" body="Choisir CFA, EUR ou USD. La date de validité détermine jusqu&apos;à quand le devis est accepté." />
        <Step n={5} title="Ajouter les lignes" body="Pour chaque produit : désignation (ou choisir depuis le catalogue), quantité, prix unitaire, remise %. Le total se calcule automatiquement." />
        <Step n={6} title="Enregistrer en Brouillon" body="Le devis est sauvegardé. Vous pouvez le modifier avant de le soumettre à validation." />

        <SectionTitle>Workflow de validation</SectionTitle>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { flex: 1 }]}>Statut</Text>
            <Text style={[s.tableHeaderCell, { flex: 1.5 }]}>Action requise</Text>
            <Text style={[s.tableHeaderCell, { flex: 1 }]}>Qui ?</Text>
          </View>
          {[
            ["Brouillon", "Soumettre pour validation", "Secrétaire"],
            ["En attente validation", "Valider ou refuser", "Manager"],
            ["Validé", "Envoyer au client", "Secrétaire / Manager"],
            ["Envoyé", "Attente réponse client", "—"],
            ["Accepté", "Commande créée automatiquement", "Automatique"],
            ["Refusé / Expiré", "Clôturer ou relancer", "Secrétaire"],
          ].map(([st, act, who], i) => (
            <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={[s.tableCellBold, { flex: 1 }]}>{st}</Text>
              <Text style={[s.tableCell, { flex: 1.5 }]}>{act}</Text>
              <Text style={[s.tableCell, { flex: 1 }]}>{who}</Text>
            </View>
          ))}
        </View>

        <Tip text="Le numéro de facture proforma est généré automatiquement au format 26FP04001 (année + FP + mois + séquence)." />

        <SectionTitle>Télécharger le PDF</SectionTitle>
        <Body>Sur la page détail du devis, cliquez sur « Voir le PDF » pour prévisualiser directement dans le navigateur, puis télécharger. Le PDF inclut le logo, les lignes détaillées, les totaux et le régime fiscal.</Body>

        <Footer />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════
          CHAPITRE 05 — COMMANDES
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <ChapterBanner num="05" title="Commandes" color="#0369a1" />

        <SectionTitle>Créer une commande</SectionTitle>
        <Body>Une commande peut être créée de deux façons :</Body>
        <View style={[s.infoBox, { marginBottom: 8 }]}><Text style={s.infoText}>🔗 Automatiquement depuis un devis accepté (recommandé)</Text></View>
        <View style={[s.infoBox, { marginBottom: 12 }]}><Text style={s.infoText}>➕ Manuellement via Menu → Commandes → « Nouvelle commande »</Text></View>

        <Step n={1} title="Choisir le client et lier un devis (optionnel)" body="Si un devis accepté existe, le lier pré-remplit les lignes et le montant." />
        <Step n={2} title="Mode de paiement" body="Avance + Solde : le client paie une avance puis solde à la livraison. Bon de commande : paiement différé sur bon de commande officiel." />
        <Step n={3} title="Renseigner les lignes produit" body="Pour chaque produit, vous pouvez saisir les coûts internes (coût d&apos;achat, frais de dédouanement, frais de transport) pour calculer la marge." />
        <Step n={4} title="Confirmer la commande" body="Après création, un Manager doit confirmer la commande pour lancer le pipeline." />

        <SectionTitle>Pipeline de suivi</SectionTitle>
        <Body>Une commande confirmée passe par les étapes suivantes :</Body>
        {[
          ["En production", "Commande transmise au fournisseur, bon de commande généré (BCF)"],
          ["En logistique", "Produit expédié, suivi des 6 étapes : fournisseur → transitaire → douane → bureau"],
          ["En reconditionnement", "Personnalisation (BAT, gravure, impression), articles de packaging consommés"],
          ["Prête à livrer", "Stock réceptionné et prêt pour la livraison"],
          ["Livrée", "Livraison effectuée, signatures recueillies"],
        ].map(([step, desc], i) => (
          <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
            <Text style={[s.tableCellBold, { flex: 1.2 }]}>{step}</Text>
            <Text style={[s.tableCell, { flex: 2.8 }]}>{desc}</Text>
          </View>
        ))}

        <SectionTitle>Vue Kanban</SectionTitle>
        <Body>Accédez à Menu → Kanban commandes pour visualiser vos commandes en colonnes par statut. Chaque carte affiche le numéro, le client et le montant. Cliquez sur une carte pour ouvrir le détail.</Body>

        <SectionTitle>Enregistrer un paiement</SectionTitle>
        <Step n={1} title="Ouvrir la commande" body="Menu Commandes → cliquer sur la commande." />
        <Step n={2} title="Section Paiements" body="Cliquer sur « Enregistrer un paiement ». Saisir le type (avance/solde), le montant, la date de réception et le mode (virement, espèces, Wave, Orange Money…)." />
        <Step n={3} title="Confirmation Manager" body="Un Manager doit confirmer le paiement. Le statut de règlement passe automatiquement à Partiel ou Complet." />

        <Tip text="Le numéro de commande est au format 26CMD04002. Chaque document (proforma, commande, facture) partage un compteur annuel global." />

        <Footer />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════
          CHAPITRE 06 — FOURNISSEURS & PRODUCTION
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <ChapterBanner num="06" title="Fournisseurs & Production" color="#92400e" />

        <SectionTitle>Gérer les fournisseurs</SectionTitle>
        <Body>Menu → Fournisseurs. Chaque fournisseur a : nom, pays, contact, devise préférée, délai de production par défaut.</Body>
        <Tip text="Renseignez le délai de production du fournisseur pour que la plateforme calcule automatiquement la date de fin de production estimée." />

        <SectionTitle>Lancer la production d&apos;une commande</SectionTitle>
        <Step n={1} title="Accéder à l&apos;onglet Production" body="Commande → onglet Production." />
        <Step n={2} title="Créer la production" body="Sélectionner le fournisseur, la devise, le coût unitaire et la quantité. Le bon de commande fournisseur (BCF) est généré automatiquement (ex: 26BCF04001)." />
        <Step n={3} title="Uploader la proforma fournisseur" body="Quand le fournisseur envoie sa proforma, uploadez le PDF dans le champ prévu." />
        <Step n={4} title="Enregistrer les paiements fournisseur" body="Enregistrez les paiements effectués au fournisseur avec leurs justificatifs." />
        <Step n={5} title="Suivre l&apos;avancement" body="Mettez à jour les dates (début, fin prévue, fin réelle) et le statut (En attente → En cours → Terminé)." />

        <SectionTitle>Taux de change</SectionTitle>
        <Body>Si le fournisseur facture en EUR ou USD, saisissez le taux de change pour convertir automatiquement le coût total en FCFA.</Body>

        <SectionTitle>Fiches de coût produit</SectionTitle>
        <Body>Menu → Fiche de coût produit. Créez une fiche par article pour documenter : catégorie, fournisseur, contact, coût unitaire, frais de dédouanement, photo. Ces fiches sont un catalogue interne de référence.</Body>

        <Footer />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════
          CHAPITRE 07 — LOGISTIQUE
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <ChapterBanner num="07" title="Logistique" color="#065f46" />

        <Body>Le module logistique suit le parcours des marchandises du fournisseur jusqu&apos;au bureau Dolee Group en 6 étapes.</Body>

        <SectionTitle>Les 6 étapes logistiques</SectionTitle>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { flex: 0.5 }]}>Étape</Text>
            <Text style={[s.tableHeaderCell, { flex: 1.5 }]}>Statut</Text>
            <Text style={[s.tableHeaderCell, { flex: 2 }]}>Description</Text>
          </View>
          {[
            ["1", "Chez le fournisseur", "Production terminée, marchandise prête à l&apos;expédition"],
            ["2", "Expédié au transitaire", "Marchandise en transit vers le transitaire/freight forwarder"],
            ["3", "En dédouanement", "Procédures douanières en cours (DPI, fiche technique, taxes)"],
            ["4", "Chez le transitaire", "En attente de dédouanement complet ou de camion"],
            ["5", "En transit vers bureau", "Transport terrestre Abidjan / destination"],
            ["6", "Au bureau", "Réceptionné chez Dolee Group — prêt pour reconditionnement"],
          ].map(([num, status, desc], i) => (
            <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={[s.tableCellBold, { flex: 0.5 }]}>{num}</Text>
              <Text style={[s.tableCellBold, { flex: 1.5 }]}>{status}</Text>
              <Text style={[s.tableCell, { flex: 2 }]}>{desc}</Text>
            </View>
          ))}
        </View>

        <SectionTitle>Comment utiliser le suivi logistique</SectionTitle>
        <Step n={1} title="Accéder à la logistique de la commande" body="Commande → onglet Logistique." />
        <Step n={2} title="Saisir les dates prévues" body="Pour chaque étape, entrez la date prévue d&apos;arrivée." />
        <Step n={3} title="Cocher « Fait » à chaque étape" body="Quand une étape est franchie, cochez-la et saisissez la date réelle." />
        <Step n={4} title="Renseigner le transitaire" body="Nommez le transitaire utilisé (depuis Menu → Transitaires). Cela permet de tracker les frais de transit." />

        <Warn text="Ne passez pas à l&apos;étape suivante sans avoir coché l&apos;étape actuelle. Le statut de la commande avance automatiquement." />

        <Footer />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════
          CHAPITRE 08 — STOCK
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <ChapterBanner num="08" title="Stock" color="#7c3aed" />

        <Body>Le stock suit les articles de packaging et consommables utilisés lors du reconditionnement (boîtes, rubans, étiquettes, mousses, etc.).</Body>

        <SectionTitle>Ajouter un article au stock</SectionTitle>
        <Step n={1} title="Menu → Stock → « Nouvel article »" body="Saisir la référence (ex: BOX-A4-BLANC), le nom, l&apos;unité (pièce, rouleau, carton), la quantité initiale, le seuil minimum et le surplus de stock." />
        <Step n={2} title="Seuil minimum" body="Si la quantité tombe en dessous du seuil minimum, une alerte apparaît sur le tableau de bord. Paramétrez selon votre consommation moyenne mensuelle." />

        <SectionTitle>Enregistrer un mouvement</SectionTitle>
        <Step n={1} title="Ouvrir la fiche article" body="Menu Stock → cliquer sur l&apos;article." />
        <Step n={2} title="Cliquer sur « Enregistrer mouvement »" body="Choisir le type : Entrée (réception livraison) ou Sortie (consommation reconditionnement)." />
        <Step n={3} title="Saisir la quantité et le motif" body="Le stock est mis à jour automatiquement et l&apos;historique des mouvements est conservé." />

        <SectionTitle>Exports</SectionTitle>
        <Body>Menu → Exports CSV → « Stock » pour télécharger l&apos;état complet du stock avec références, quantités et seuils. Compatible Excel et LibreOffice.</Body>

        <Tip text="Faites un inventaire physique mensuel et mettez à jour les quantités via des mouvements de correction si des écarts sont constatés." />

        <Footer />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════
          CHAPITRE 09 — RECONDITIONNEMENT
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <ChapterBanner num="09" title="Reconditionnement" color="#9f1239" />

        <Body>Le reconditionnement couvre toutes les opérations de personnalisation des gadgets : gravure, impression, mise en boîte, badging, etc.</Body>

        <SectionTitle>Workflow de reconditionnement</SectionTitle>
        <Step n={1} title="Accéder à l&apos;onglet Reconditionnement" body="Depuis une commande au statut EN_RECONDITIONNEMENT." />
        <Step n={2} title="Renseigner le type de personnalisation" body="Ex : Sérigraphie, Gravure laser, Broderie, Impression numérique." />
        <Step n={3} title="Uploader le BAT" body="Fichier de Bon À Tirer validé par le client. Formats acceptés : PDF, JPG, PNG." />
        <Step n={4} title="Saisir les instructions" body="Notes détaillées pour l&apos;opérateur : couleurs Pantone, emplacement du logo, quantités par variante." />
        <Step n={5} title="Enregistrer les articles consommés" body="Sélectionnez les articles du stock utilisés (boîtes, papier de soie, ruban…) et les quantités. Le stock est débité automatiquement." />
        <Step n={6} title="Marquer comme terminé" body="Changer le statut en « Terminé ». La commande passe automatiquement en « Prête à livrer »." />

        <SectionTitle>Galerie photos</SectionTitle>
        <Body>Dans l&apos;onglet « Photos » d&apos;une commande, uploadez les photos du produit à chaque étape : BAT, produit reçu, produit reconditionné, livraison. Les photos sont classées par catégorie et consultables par toute l&apos;équipe.</Body>

        <Warn text="Ne marquez pas le reconditionnement comme terminé sans avoir vérifié physiquement la qualité de la personnalisation." />

        <Footer />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════
          CHAPITRE 10 — LIVRAISONS
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <ChapterBanner num="10" title="Livraisons" color="#0f766e" />

        <SectionTitle>Planifier une livraison</SectionTitle>
        <Step n={1} title="Menu → Livraisons → « Planifier une livraison »" body="Ou depuis une commande → onglet Livraison." />
        <Step n={2} title="Sélectionner la commande livrée" body="Seules les commandes au statut « Prête à livrer » apparaissent dans la liste." />
        <Step n={3} title="Renseigner les détails" body="Adresse de livraison, contact sur place, date prévue, chargé des opérations assigné, nombre de signatures client requis (1 ou 2)." />
        <Step n={4} title="Démarrer la livraison" body="Le jour J, le chargé des opérations passe le statut en « En cours »." />

        <SectionTitle>Signatures électroniques</SectionTitle>
        <Body>Sur la page de livraison, trois zones de signature sont disponibles :</Body>
        {[
          ["Signature client 1", "Obligatoire dans tous les cas"],
          ["Signature client 2", "Si « 2 signatures client » a été configuré"],
          ["Signature chargé de livraison", "Toujours obligatoire"],
        ].map(([label, desc], i) => (
          <View key={i} style={[s.stepBox, { marginBottom: 6 }]}>
            <Text style={s.stepTitle}>{label}</Text>
            <Text style={[s.stepBody, { paddingLeft: 0 }]}>{desc}</Text>
          </View>
        ))}

        <Step n={5} title="Valider les signatures" body="Cliquer sur « Valider les signatures ». La commande passe automatiquement en « Livrée » et la facture est mise à jour." />

        <SectionTitle>Bon de livraison PDF</SectionTitle>
        <Body>Après livraison, téléchargez le bon de livraison PDF depuis la page livraison. Il inclut les articles livrés, les quantités, les signatures capturées et les informations client.</Body>

        <Tip text="Prévisualisez le bon de livraison avant de partir en livraison pour vérifier les informations. Le PDF peut être imprimé ou envoyé par email." />

        <Footer />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════
          CHAPITRE 11 — FACTURATION
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <ChapterBanner num="11" title="Facturation" color="#1e40af" />

        <Body>La plateforme gère deux types de documents fiscaux : la Facture Normalisée Électronique (FNE) et le Reçu de caisse.</Body>

        <SectionTitle>Créer une facture</SectionTitle>
        <Step n={1} title="Menu → Facturation → « Créer une facture »" body="Seulement disponible pour les Managers." />
        <Step n={2} title="Choisir le type" body="FNE : pour les clients avec bon de commande officiel (7% d&apos;impôt). Reçu de caisse : pour les paiements comptants." />
        <Step n={3} title="Sélectionner la commande livrée" body="Seules les commandes LIVREE apparaissent." />
        <Step n={4} title="Saisir les montants" body="Montant HT, TVA (si applicable) → le TTC se calcule automatiquement." />
        <Step n={5} title="Pour FNE uniquement" body="Accédez au portail FNE (lien fourni), générez la facture normalisée, puis uploadez le PDF sur la plateforme." />

        <SectionTitle>Statuts des documents</SectionTitle>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { flex: 1 }]}>Type</Text>
            <Text style={[s.tableHeaderCell, { flex: 1 }]}>Statut document</Text>
            <Text style={[s.tableHeaderCell, { flex: 1.5 }]}>Statut règlement</Text>
          </View>
          {[
            ["FNE", "Envoyée (auto)", "Partiel / Complet (auto)"],
            ["Reçu de caisse", "En attente → Envoyée", "Partiel / Complet (auto)"],
          ].map(([type, doc, reg], i) => (
            <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={[s.tableCellBold, { flex: 1 }]}>{type}</Text>
              <Text style={[s.tableCell, { flex: 1 }]}>{doc}</Text>
              <Text style={[s.tableCell, { flex: 1.5 }]}>{reg}</Text>
            </View>
          ))}
        </View>

        <Info text="Le statut de règlement (Partiel / Complet) est mis à jour automatiquement quand un Manager confirme un paiement client." />

        <SectionTitle>Numérotation automatique</SectionTitle>
        <Body>Les numéros sont générés automatiquement selon le format : AA + TYPE + MM + Séquence</Body>
        {[
          ["26FP04001", "Facture proforma n°1 de l&apos;année, créée en avril 2026"],
          ["26CMD04002", "Commande n°2 de l&apos;année, créée en avril 2026"],
          ["26RC04006", "Reçu de caisse n°6 de l&apos;année, créée en avril 2026"],
          ["26BCF04003", "Bon de commande fournisseur n°3, avril 2026"],
        ].map(([num, desc], i) => (
          <View key={i} style={[s.tableRow, i % 2 === 0 ? {} : { backgroundColor: C.bg }]}>
            <Text style={[s.tableCellBold, { flex: 1, fontFamily: "Helvetica-Bold", color: C.navy }]}>{num}</Text>
            <Text style={[s.tableCell, { flex: 3 }]}>{desc}</Text>
          </View>
        ))}

        <Footer />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════
          CHAPITRE 12 — DÉPENSES
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <ChapterBanner num="12" title="Dépenses" color="#b91c1c" />

        <Body>Le module Dépenses permet d&apos;enregistrer toutes les charges de l&apos;entreprise pour un suivi financier complet.</Body>

        <SectionTitle>Saisir une dépense</SectionTitle>
        <Step n={1} title="Menu → Dépenses → « Nouvelle dépense »" body="Bouton en haut à droite." />
        <Step n={2} title="Remplir le formulaire" body="Titre (obligatoire), Type de dépense (obligatoire), Description (détails), Montant en FCFA, Date." />
        <Step n={3} title="Uploader le justificatif" body="Optionnel : cliquer sur la zone d&apos;upload pour joindre le reçu ou la facture en PDF." />
        <Step n={4} title="Enregistrer" body="La dépense est ajoutée au registre et intégrée dans le tableau de bord financier." />

        <SectionTitle>Types de dépenses disponibles</SectionTitle>
        <View style={s.twoCol}>
          <View style={s.col}>
            {["Commandes", "Frais du personnel", "Frais généraux", "Charge des locaux"].map((t, i) => (
              <View key={i} style={[s.stepBox, { marginBottom: 4, padding: "6 10" }]}>
                <Text style={{ fontSize: 9.5, color: C.text }}>• {t}</Text>
              </View>
            ))}
          </View>
          <View style={s.col}>
            {["Marketing et Communication", "Transport et déplacement", "Frais financiers, bancaires et fiscaux", "Divers"].map((t, i) => (
              <View key={i} style={[s.stepBox, { marginBottom: 4, padding: "6 10" }]}>
                <Text style={{ fontSize: 9.5, color: C.text }}>• {t}</Text>
              </View>
            ))}
          </View>
        </View>

        <SectionTitle>Filtrer et exporter</SectionTitle>
        <Body>Utilisez le filtre par type en haut à droite de la liste pour n&apos;afficher qu&apos;une catégorie. Pour l&apos;export comptable, Menu → Exports CSV → Dépenses.</Body>

        <Footer />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════
          CHAPITRE 13 — FICHES DE COÛT
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <ChapterBanner num="13" title="Fiches de coût produit" color="#0369a1" />

        <Body>Les fiches de coût constituent le catalogue interne de Dolee Group. Elles documentent le coût d&apos;acquisition réel de chaque type de produit, fournisseur par fournisseur.</Body>

        <SectionTitle>Créer une fiche de coût</SectionTitle>
        <Step n={1} title="Menu → Fiche de coût produit → « Ajouter une fiche »" body="Bouton vert en haut à droite." />
        <Step n={2} title="Uploader une photo du produit" body="Cliquer sur la zone d&apos;upload pour ajouter une image (JPG, PNG, WEBP). La photo apparaîtra dans la grille de fiches." />
        <Step n={3} title="Renseigner les informations" body="Catégorie (ex: Stylos & Écriture), Nom du produit, Fournisseur, Contact fournisseur." />
        <Step n={4} title="Saisir les coûts" body="Coût unitaire (prix d&apos;achat) + Frais de dédouanement unitaires. Le coût total est calculé automatiquement." />
        <Step n={5} title="Enregistrer et accéder à la fiche" body="Après création, vous êtes redirigé vers la fiche détail." />

        <SectionTitle>Consulter les fiches</SectionTitle>
        <Body>La page principale affiche une grille de cartes avec photos, catégories, coûts. Filtrez par catégorie via les boutons en haut. Cliquez sur une carte pour voir le détail complet.</Body>

        <Tip text="Mettez à jour les fiches après chaque import pour refléter les variations de coût dues aux taux de change et aux frais de dédouanement." />

        <Footer />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════
          CHAPITRE 14 — PARAMÈTRES & ADMINISTRATION
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <ChapterBanner num="14" title="Paramètres & Administration" color="#374151" />

        <SectionTitle>Gestion des utilisateurs (Manager uniquement)</SectionTitle>
        <Step n={1} title="Menu → Paramètres → Utilisateurs" body="Liste de tous les membres de l&apos;équipe avec leurs rôles." />
        <Step n={2} title="Créer un compte" body="Cliquer sur « Nouvel utilisateur ». Saisir nom, email, mot de passe et rôle (Manager / Secrétaire / Chargé des opérations)." />
        <Step n={3} title="Modifier les permissions" body="Cliquez sur un utilisateur pour personnaliser ses droits module par module (ex : donner accès à la facturation à un Chargé des Opérations)." />
        <Step n={4} title="Désactiver un compte" body="Utilisez le bouton « Désactiver » pour retirer l&apos;accès sans supprimer l&apos;historique." />

        <SectionTitle>Catalogue produits</SectionTitle>
        <Body>Menu → Paramètres → Catalogue produits. C&apos;est ici que vous gérez les produits standards proposés dans les devis (avec référence, catégorie, prix unitaire CFA et image).</Body>

        <SectionTitle>Journal d&apos;audit</SectionTitle>
        <Body>Menu → Paramètres → Journal d&apos;audit (Manager uniquement). Historique de toutes les actions importantes : créations, confirmations, validations. Filtrable par module. Utile en cas de litige ou de contrôle.</Body>

        <SectionTitle>Exports CSV</SectionTitle>
        <Body>Menu → Exports CSV. Téléchargez vos données en format CSV :</Body>
        {[
          ["Commandes", "Toutes les commandes avec statuts, montants et paiements"],
          ["Factures", "FNE et reçus de caisse avec statuts de règlement"],
          ["Dépenses", "Toutes les charges par type et date"],
          ["Stock", "État du stock avec quantités et seuils"],
        ].map(([type, desc], i) => (
          <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
            <Text style={[s.tableCellBold, { flex: 1 }]}>{type}</Text>
            <Text style={[s.tableCell, { flex: 2.5 }]}>{desc}</Text>
          </View>
        ))}

        <Divider />

        <SectionTitle>Support & Assistance</SectionTitle>
        <Body>Pour toute question technique ou demande de formation complémentaire, contactez l&apos;administrateur système. Pour les problèmes urgents, utilisez le canal WhatsApp dédié à l&apos;équipe.</Body>

        <View style={[s.tipBox, { marginTop: 16 }]}>
          <Text style={s.tipEmoji}>📞</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.tipText, { fontFamily: "Helvetica-Bold", marginBottom: 2 }]}>Ressources utiles</Text>
            <Text style={s.tipText}>• Tableau de bord → vue d&apos;ensemble de l&apos;activité</Text>
            <Text style={s.tipText}>• Relances CRM → actions commerciales prioritaires</Text>
            <Text style={s.tipText}>• Échéances → calendrier des dates importantes</Text>
            <Text style={s.tipText}>• Journal d&apos;audit → traçabilité complète des actions</Text>
          </View>
        </View>

        <Footer />
      </Page>

    </Document>
  )
}
