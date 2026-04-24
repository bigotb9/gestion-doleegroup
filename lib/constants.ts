import { Role, ProspectStatus, DevisStatus, CommandeStatus, LogistiqueStatus, LivraisonStatus, ReconditionnementStatus, PaymentStatus, Currency } from "@prisma/client"

export const ROLE_LABELS: Record<Role, string> = {
  MANAGER: "Manager",
  SECRETAIRE: "Secrétaire",
  CHARGE_OPERATIONS: "Chargé des Opérations",
}

export const PROSPECT_STATUS_LABELS: Record<ProspectStatus, string> = {
  PROSPECT: "Prospect",
  CONTACTE: "Contacté",
  DEVIS_ENVOYE: "Devis envoyé",
  NEGOCIATION: "Négociation",
  CLIENT: "Client",
  PERDU: "Perdu",
}

export const PROSPECT_STATUS_COLORS: Record<ProspectStatus, string> = {
  PROSPECT: "bg-slate-100 text-slate-700",
  CONTACTE: "bg-blue-100 text-blue-700",
  DEVIS_ENVOYE: "bg-yellow-100 text-yellow-700",
  NEGOCIATION: "bg-orange-100 text-orange-700",
  CLIENT: "bg-green-100 text-green-700",
  PERDU: "bg-red-100 text-red-700",
}

export const DEVIS_STATUS_LABELS: Record<DevisStatus, string> = {
  BROUILLON: "Brouillon",
  EN_ATTENTE_VALIDATION: "En attente validation",
  VALIDE: "Validé",
  ENVOYE: "Envoyé",
  ACCEPTE: "Accepté",
  REFUSE: "Refusé",
  EXPIRE: "Expiré",
}

export const DEVIS_STATUS_COLORS: Record<DevisStatus, string> = {
  BROUILLON: "bg-slate-100 text-slate-700",
  EN_ATTENTE_VALIDATION: "bg-amber-100 text-amber-700",
  VALIDE: "bg-blue-100 text-blue-700",
  ENVOYE: "bg-indigo-100 text-indigo-700",
  ACCEPTE: "bg-green-100 text-green-700",
  REFUSE: "bg-red-100 text-red-700",
  EXPIRE: "bg-gray-100 text-gray-500",
}

export const COMMANDE_STATUS_LABELS: Record<CommandeStatus, string> = {
  EN_ATTENTE_CONFIRMATION: "En attente confirmation",
  CONFIRMEE: "Confirmée",
  EN_PRODUCTION: "En production",
  EN_LOGISTIQUE: "En logistique",
  EN_RECONDITIONNEMENT: "En reconditionnement",
  PRETE_LIVRAISON: "Prête à livrer",
  LIVREE: "Livrée",
  ANNULEE: "Annulée",
}

export const COMMANDE_STATUS_COLORS: Record<CommandeStatus, string> = {
  EN_ATTENTE_CONFIRMATION: "bg-amber-100 text-amber-700",
  CONFIRMEE: "bg-blue-100 text-blue-700",
  EN_PRODUCTION: "bg-purple-100 text-purple-700",
  EN_LOGISTIQUE: "bg-cyan-100 text-cyan-700",
  EN_RECONDITIONNEMENT: "bg-orange-100 text-orange-700",
  PRETE_LIVRAISON: "bg-lime-100 text-lime-700",
  LIVREE: "bg-green-100 text-green-700",
  ANNULEE: "bg-red-100 text-red-700",
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  EN_ATTENTE: "En attente",
  AVANCE_RECUE: "Avance reçue",
  SOLDE_RECU: "Solde reçu",
  PAIEMENT_COMPLET: "Payé",
  EN_RETARD: "En retard",
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  EN_ATTENTE: "bg-slate-100 text-slate-700",
  AVANCE_RECUE: "bg-blue-100 text-blue-700",
  SOLDE_RECU: "bg-teal-100 text-teal-700",
  PAIEMENT_COMPLET: "bg-green-100 text-green-700",
  EN_RETARD: "bg-red-100 text-red-700",
}

export const LOGISTIQUE_STATUS_LABELS: Record<LogistiqueStatus, string> = {
  CHEZ_FOURNISSEUR: "Chez le fournisseur",
  EXPEDIE_TRANSITAIRE: "Expédition",
  CHEZ_TRANSITAIRE: "Chez le transitaire",
  EN_DEDOUANEMENT: "Dédouanement",
  EN_TRANSIT_BUREAU: "En transit",
  AU_BUREAU: "Livré au bureau",
}

export const LIVRAISON_STATUS_LABELS: Record<LivraisonStatus, string> = {
  PLANIFIEE: "Planifiée",
  EN_COURS: "En cours",
  LIVREE: "Livrée",
  ECHEC: "Échec",
}

export const LIVRAISON_STATUS_COLORS: Record<LivraisonStatus, string> = {
  PLANIFIEE: "bg-blue-100 text-blue-700",
  EN_COURS: "bg-orange-100 text-orange-700",
  LIVREE: "bg-green-100 text-green-700",
  ECHEC: "bg-red-100 text-red-700",
}

export const RECOND_STATUS_LABELS: Record<ReconditionnementStatus, string> = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
}

export const CURRENCY_LABELS: Record<Currency, string> = {
  EUR: "Euro (€)",
  USD: "Dollar ($)",
  CFA: "Franc CFA (FCFA)",
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: "€",
  USD: "$",
  CFA: "FCFA",
}

export const PAYMENT_MODES = [
  { value: "virement", label: "Virement bancaire" },
  { value: "especes", label: "Espèces" },
  { value: "cheque", label: "Chèque" },
  { value: "wave", label: "Wave" },
  { value: "orange_money", label: "Orange Money" },
  { value: "mtn_momo", label: "MTN MoMo" },
]

export const SOURCE_PROSPECTS = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "referral", label: "Recommandation" },
  { value: "cold_call", label: "Appel à froid" },
  { value: "salon", label: "Salon/Événement" },
  { value: "site_web", label: "Site web" },
  { value: "autre", label: "Autre" },
]

export const SECTEURS_ACTIVITE = [
  "Banque & Finance",
  "Assurance",
  "Télécommunications",
  "Immobilier",
  "Grande distribution",
  "Industrie",
  "Santé",
  "Éducation",
  "Transport & Logistique",
  "Hôtellerie & Restauration",
  "Administration publique",
  "ONG & Associations",
  "Autre",
]
