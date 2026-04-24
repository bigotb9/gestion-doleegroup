# Guide d'utilisation — Dolee Group

**Plateforme SaaS de gestion commerciale**
Version 2026 · Dernière mise à jour : avril 2026

---

## Table des matières

1. [Introduction](#introduction)
2. [Rôles & Permissions](#rôles--permissions)
3. [Authentification & Utilisateurs](#authentification--utilisateurs)
4. [Tableau de bord](#tableau-de-bord)
5. [CRM / Prospects](#crm--prospects)
6. [Factures proforma (Devis)](#factures-proforma-devis)
7. [Commandes](#commandes)
8. [Production](#production)
9. [Stock & Réceptions](#stock--réceptions)
10. [Logistique](#logistique)
11. [Reconditionnement](#reconditionnement)
12. [Livraisons](#livraisons)
13. [Facturation](#facturation)
14. [Dépenses](#dépenses)
15. [Paramètres](#paramètres)
16. [Glossaire](#glossaire)

---

## Introduction

Dolee Group est une plateforme SaaS de gestion commerciale end-to-end, couvrant le cycle complet :

**Prospect → Devis → Commande → Production → Logistique → Stock → (Reconditionnement) → Livraison → Facturation**

### Technologies

- **Frontend** : Next.js 16 (App Router, Turbopack, React 19)
- **Base de données** : PostgreSQL via Supabase
- **Authentification** : Supabase Auth + NextAuth
- **Stockage fichiers** : Supabase Storage
- **Génération PDF** : @react-pdf/renderer

### Accès à la plateforme

URL : `localhost:3000` (développement) ou le domaine de production
Connexion via email + mot de passe sur `/login`.

---

## Rôles & Permissions

### Les 3 rôles

| Rôle | Description | Accès par défaut |
|------|-------------|------------------|
| **MANAGER** | Accès complet à toute la plateforme | Toutes les permissions |
| **SECRETAIRE** | Saisie commerciale et administrative | CRM, Devis, Commandes, Paiements (saisie), Facturation (lecture), Catalogue |
| **CHARGE_OPERATIONS** | Opérations terrain | Production (lecture), Stock, Logistique, Reconditionnement, Livraisons |

### Les 4 catégories de permissions

Les permissions sont organisées par domaine métier :

#### 1. Commercial (bleu)
- **CRM / Prospects** — Voir, Créer, Modifier, Supprimer
- **Factures proforma (Devis)** — Voir, Créer, Modifier, Valider, Envoyer
- **Commandes** — Voir, Créer, Confirmer, Annuler

#### 2. Opérations (violet)
- **Production** — Voir, Gérer
- **Stock & Réceptions** — Voir, Gérer
- **Logistique** — Voir, Gérer
- **Reconditionnement** — Voir, Gérer
- **Livraisons** — Voir, Gérer, Signer

#### 3. Finance (vert)
- **Paiements clients** — Enregistrer, Confirmer
- **Facturation** — Voir, Gérer
- **Dépenses** — Voir, Gérer

#### 4. Administration (jaune)
- **Utilisateurs** — Gérer
- **Catalogue produits** — Gérer
- **Journal d'audit** — Consulter

### Permissions personnalisées

Un Manager peut surcharger les permissions par défaut d'un rôle pour un utilisateur spécifique.
Accessible via **Paramètres → Utilisateurs → Modifier → onglet Permissions**.

---

## Authentification & Utilisateurs

### Création d'un utilisateur

1. Accéder à **Paramètres → Utilisateurs**
2. Cliquer sur **Nouvel utilisateur**
3. Remplir : nom complet, email, mot de passe (8 caractères min.), rôle
4. Valider → le compte est créé **simultanément dans Supabase Auth et dans la base Dolee**

> **Important** : l'utilisateur utilisera cet email/mot de passe pour se connecter. Supabase Auth est la source de vérité pour l'identité.

### Modification d'un utilisateur

Cliquer sur **Modifier** sur la carte utilisateur :

- **Onglet Infos** : nom, email, rôle, nouveau mot de passe (optionnel)
- **Onglet Permissions** : surcharger les permissions par défaut du rôle

Toute modification (email, mot de passe, activation/désactivation) est synchronisée avec Supabase Auth.

### Désactivation

- Cliquer sur **Désactiver** → l'utilisateur ne peut plus se connecter (ban Supabase Auth de 10 ans)
- Cliquer sur **Activer** → rétablit l'accès

### Suppression définitive

Cliquer sur l'icône corbeille. L'utilisateur est supprimé de Supabase Auth et de la base Dolee. **Action irréversible.**

---

## Tableau de bord

Le tableau de bord offre une vue d'ensemble de l'activité avec :

### KPI héros (3 cartes 3D avec compteurs animés)
- **Commandes actives** — toutes sauf livrées et annulées
- **Revenus du mois** — somme des paiements confirmés du mois courant
- **Commandes en attente** — commandes à confirmer

### KPI Finance (4 cartes)
- **Total FNE** — factures normalisées électroniques
- **Total Caisse** — reçus de caisse
- **Dépenses** — total cumulé
- **Impôts estimés** — 7% du FNE

### Sections
- **Commandes récentes** (5 dernières)
- **Pipeline** (donut des statuts commandes)
- **Alertes & Actions** (stock surplus, commandes en attente)
- **Livraisons de la semaine**

### Analyse financière (graphiques)
- CA sur 12 mois (area chart)
- Marges par commande (bar chart)
- Dépenses par type (pie chart)
- Taux de recouvrement

---

## CRM / Prospects

### Stats KPI
Clients actifs · Prospects · CA total · Solde dû

### Pipeline prospect
`PROSPECT → CONTACTE → NEGOCIATION → CLIENT` (ou `PERDU`)

### Créer un prospect
**CRM / Prospects → Nouveau prospect**

Champs obligatoires : raison sociale, contact nom, téléphone, pays.
Champs optionnels : email, poste, adresse, ville, secteur, source, notes.

### Fiche client
Clic sur une ligne → fiche détaillée :
- Informations complètes
- Historique des devis
- Historique des commandes
- Solde en cours (ce qui reste à payer)
- Notes et relances

### Relances
**CRM → Relances CRM** — programmer un rappel à une date donnée.

---

## Factures proforma (Devis)

### Stats KPI
Brouillons · Envoyés · Acceptés · Valeur pipeline

### Cycle de vie
`BROUILLON → EN_ATTENTE_VALIDATION → VALIDE → ENVOYE → ACCEPTE / REFUSE / EXPIRE`

### Créer un devis
**Factures proforma → Nouveau devis**

1. **Section Client** — sélectionner ou créer un client
2. **Section Informations** — date de validité, devise (CFA/EUR/USD)
3. **Section Lignes** — produits à proposer :
   - Désignation, description, quantité
   - Prix unitaire (majoré = coût réel + bénéfice Dolee)
   - Remise % ou fixe
4. **Section Paiement** — taxe éventuelle
5. **Notes, conditions de paiement, délai de livraison**

### Actions sur un devis
- **Modifier** (uniquement en BROUILLON)
- **Valider** → statut VALIDE
- **Envoyer** au client → ENVOYE
- **Télécharger le PDF** — facture proforma avec logo Dolee
- **Accepter / Refuser** → ACCEPTE (déclenche la création de la commande) / REFUSE

### PDF
- Prévisualisation inline dans une modal (pas de téléchargement auto)
- Logo Dolee Group avec fond blanc (pas de fond noir)
- Régime fiscal : Taxe d'État de l'Entreprenant (TEE)

---

## Commandes

### Stats KPI
En cours · En attente de confirmation · Livrées · CA total

### Cycle de vie
```
EN_ATTENTE_CONFIRMATION → CONFIRMEE → EN_PRODUCTION → EN_LOGISTIQUE → 
  [EN_RECONDITIONNEMENT] → PRETE_LIVRAISON → LIVREE
```
Possibilité d'ANNULEE à toute étape avant livraison.

### Création
Une commande est créée automatiquement à l'acceptation d'un devis, OU manuellement via **Commandes → Nouvelle commande**.

### Détail commande
6 onglets :
1. **Détails** — infos générales, lignes, paiements
2. **Production** — multi-fournisseurs (voir section Production)
3. **Logistique** — suivi transitaire
4. **Reconditionnement** — personnalisation
5. **Livraison** — multi-livraisons partielles
6. **Photos** — galerie de la commande

### Paiements clients
Dans l'onglet Détails, bouton **+ Ajouter** :

- **Type** : AVANCE, SOLDE ou COMPLET
- **Montant** (dans la devise de la commande)
- **Date de réception**
- **Mode** : espèces, virement, chèque, mobile money
- **Référence** : numéro de transaction
- **Justificatif PDF** (upload) — sauvegardé dans Supabase Storage

Un paiement doit être **confirmé** par un Manager pour être pris en compte dans les totaux.

### Kanban
**Kanban commandes** — vue tableau avec colonnes par statut, drag-and-drop visuel.

---

## Production

### Règle métier importante

> Une même commande peut être gérée par **un ou plusieurs fournisseurs différents** selon les produits.
> Exemple : Sacs et stylos chez Fournisseur A, casquettes chez Fournisseur B.

### Workflow complet

1. **Création de la production** pour un fournisseur
   - Sélection du fournisseur, désignation des produits concernés
   - Devise, coût unitaire prévisionnel, quantité
   - Taux de change, date de commande, délai de production
2. **Génération automatique du BCF** (Bon de Commande Fournisseur)
   - Numéro unique `26BCF...`
   - PDF téléchargeable avec logo, détails, signatures
3. **Envoi du BCF au fournisseur** (manuellement, hors plateforme)
4. **Réception de la proforma fournisseur** (sa facture)
   - Upload du PDF proforma
   - Saisie du **Montant proforma CFA**
5. **Paiement du fournisseur** (partiel ou total)
   - Chaque paiement crée une dépense automatiquement
   - Preuve de paiement uploadable
6. **Solde atteint** → transition automatique :
   - `Commande.status = EN_PRODUCTION`
   - `Production.dateDebutProduction = aujourd'hui`
   - `Production.dateFinProductionPrevue = aujourd'hui + délai`
   - **Le compte à rebours du délai de production démarre**

### Indicateur 4 étapes
La page de détail production affiche un stepper clair :
1. **BCF créé** ✓
2. **Envoyer au fournisseur** (proforma reçue ou en attente)
3. **Solder le fournisseur** (% payé ou soldé ✓)
4. **Production démarrée** (date de début ou en attente)

### Ajout de plusieurs fournisseurs
Depuis la page Production d'une commande, bouton **+ Ajouter un fournisseur**. Chaque production a son propre workflow indépendant.

### Fin de production
Une fois la production terminée, saisir la **date de fin réelle**. Le statut passe à TERMINE.

---

## Stock & Réceptions

### Concept clé

Le stock Dolee Group n'est **pas un inventaire générique** — c'est un suivi de réception **par commande**.

Pour chaque produit d'une commande :
- `quantité commandée` (par le client)
- `quantité reçue` (du fournisseur)
- `quantité livrée` (au client)
- **surplus** = reçu − commandé (si positif)
- **reste à recevoir** = commandé − reçu (si positif)

### Initialiser les réceptions
**Stock → Nouvelle réception**

Sélectionner la commande : toutes ses lignes sont créées avec `quantiteCommandee` depuis les lignes de la commande et `quantiteRecue = 0`.

### Enregistrer une réception
Cliquer sur **Modifier** sur une ligne produit :
- Saisir la quantité reçue
- Date de réception
- Notes (état des produits, remarques)

### Indicateurs visuels
- 🟢 **Reçu** (complet) — reçu ≥ commandé
- 🟡 **Partiel** — reçu > 0 mais < commandé
- ⚪ **En attente** — reçu = 0
- 🔵 **Surplus** — reçu > commandé

### Stats KPI
Total articles · Entièrement reçus · En attente · Avec surplus

### Pas de gestion d'inventaire traditionnelle
Dolee Group ne fait pas de gestion de stock avec seuil minimum — uniquement le suivi commande-par-commande.

---

## Logistique

### 4 étapes simplifiées

1. **Chez le fournisseur** (auto-complété à la création) ✓
2. **Expédition** — fournisseur a expédié la marchandise
3. **Chez le transitaire** — le transitaire gère transit + dédouanement
4. **Livraison bureau** — marchandise reçue chez Dolee

> **Note** : le transitaire gère directement la douane, donc pas d'étape dédouanement séparée.

### Création du suivi logistique
**Commande → onglet Logistique → Créer le suivi logistique**

1. Sélectionner le transitaire
2. Numéro de traçage
3. Poids (kg) et prix transport + dédouanement (FCFA/kg)
   - Les frais sont calculés automatiquement : `poids × prix/kg`
   - Une dépense est enregistrée automatiquement
4. Valider

### Mise à jour des étapes
Chaque étape a :
- Date prévue
- Date réelle
- Notes
- Case "Marquer comme complété"

Le statut global de la logistique s'ajuste automatiquement à la dernière étape complétée.

### Stepper visuel premium
Barre de progression horizontale avec icônes, badges "En cours" et dates réelles par étape.

---

## Reconditionnement

### Règle métier

> C'est ce qu'on **reçoit** (stock) qu'on peut reconditionner.
> Le reconditionnement est **optionnel**.

### Flux

1. Produits reçus visibles depuis la page reconditionnement
2. Pour chaque produit : saisir la **quantité reconditionnée** (≤ quantité reçue)
3. Créer un dossier de personnalisation :
   - Type (gravure, broderie, sérigraphie, impression, emballage, étiquetage)
   - Instructions
   - Fichier BAT (URL)
   - Notes

### Statuts du dossier
`EN_ATTENTE → EN_COURS → TERMINE`

### Skip reconditionnement
Si pas de reconditionnement nécessaire, cliquer sur **Prête à livrer** :
- Disponible uniquement quand la commande est en `EN_LOGISTIQUE`
- Passe directement à `PRETE_LIVRAISON`

---

## Livraisons

### Concept : livraisons multiples et partielles

> Une commande peut avoir **plusieurs livraisons** (certains produits ou quantités partielles).
> La commande passe à `LIVREE` uniquement quand **tout est livré**.

### Règle de disponibilité

```
quantité disponible à livrer = 
  min(
    quantité reconditionnée > 0 ? quantité reconditionnée : quantité reçue,
    quantité commandée  // ← jamais plus que ce que le client a commandé
  )
  − quantité déjà livrée
```

**Le surplus stock ne se livre jamais** — il reste chez Dolee Group.

### Récapitulatif stock
En haut de la page livraison, tableau :

| Produit | Commandé | Livré | Reste à livrer | Surplus stock |
|---------|----------|-------|----------------|---------------|
| Sacs | 250 | 150 | 100 | +25 |

### Créer une livraison
Bouton **+ Planifier la livraison** (ou **+ Ajouter une livraison partielle** si déjà des livraisons existantes) :

1. Saisir la quantité à livrer pour chaque produit (pré-rempli avec le restant)
2. Adresse de livraison
3. Contact sur place
4. Date prévue
5. Chargé des opérations assigné
6. Nombre de signatures client (1 ou 2)
7. Notes

### Workflow livraison
`PLANIFIEE → EN_COURS → LIVREE` (ou `ECHEC`)

### Signatures électroniques
Sur le terrain, le chargé de livraison recueille :
- **Signature(s) client** (1 ou 2 selon la commande)
- **Sa propre signature** (chargé de livraison)

Chaque signature a un nom de signataire. À la validation :
- `quantité livrée` est incrémentée dans les réceptions
- Si toute la commande est livrée → `Commande.status = LIVREE` automatiquement

### Bon de livraison PDF
Généré automatiquement à la signature :
- Détails par produit (commandé / livré / reste)
- 3 zones de signature (client 1, client 2, chargé)
- Alerte livraison partielle si applicable
- Tient sur une seule page A4

---

## Facturation

Deux types de factures :

### 1. Reçu de caisse (RECU_CAISSE)
Pour les paiements directs (espèces, virement simple).
- PDF avec en-tête, lignes, totaux
- Si **avance déjà versée** :
  - **Total TTC** (montant commande)
  - **Avance versée** (en vert, en soustraction)
  - **Solde restant** (orange si > 0, vert "Réglé" si = 0)

### 2. Facture normalisée électronique (FNE)
Facture officielle DGI (Côte d'Ivoire).
- Upload du PDF FNE généré via le portail DGI
- Lien direct vers le portail FNE depuis le dialog de création

### Créer une facture
**Facturation → + Créer une facture**

1. Choisir le type (RECU_CAISSE ou FNE)
2. Sélectionner la commande livrée
3. Saisir montant HT, TVA
4. Date d'échéance
5. (FNE uniquement) upload du PDF FNE

### Statuts
- **Facture** : EN_ATTENTE, ENVOYEE, PAYEE, PARTIELLEMENT_PAYEE, EN_RETARD, ANNULEE
- **Règlement** : PARTIEL (orange) ou COMPLET (vert) — calculé automatiquement depuis les paiements confirmés

### Stats KPI
Total FNE · Total Caisse · Soldées · En retard

### Prévisualisation PDF
- Modal inline (plus de téléchargement automatique)
- Bouton **Télécharger** pour sauvegarde locale
- Montants toujours depuis `commande.montantTotal` (source de vérité) — évite les doubles soustractions

---

## Dépenses

### Catégories
- Commandes
- Frais du personnel
- Frais généraux
- Charge des locaux
- Marketing et Communication
- Transport et déplacement
- Frais financiers, bancaires et fiscaux
- Divers

### Créer une dépense
**Dépenses → Nouvelle dépense**

Champs : titre, catégorie, description, montant (CFA), date, justificatif PDF (upload Supabase).

### Dépenses automatiques
- Paiement fournisseur → dépense "Fournisseurs"
- Frais logistique → dépense "Transport et dédouanement"

### Filtre par catégorie
Sélecteur en haut de la liste.

### Catégorie dominante
Carte affichée automatiquement avec la catégorie la plus chargée.

---

## Paramètres

### Section Administration (Manager)
3 cartes premium :
1. **Utilisateurs** — comptes, rôles, permissions
2. **Catalogue produits** — références, prix, catégories
3. **Journal d'audit** — traçabilité des actions

### Section Configuration
1. **Taux de change** — EUR/CFA et USD/CFA (actualisés automatiquement si clé API configurée)
2. **Modules métiers** — vue récapitulative des 4 domaines

### Catalogue produits
**Paramètres → Catalogue produits**

- Référence (unique, majuscule)
- Nom, description, catégorie
- Prix unitaire CFA
- Image URL
- Statut actif / inactif

### Journal d'audit
Toutes les actions tracées :
- Date, utilisateur, action (CREATE, UPDATE, DELETE, CONFIRM, VALIDATE, SIGN, ACCEPT, REFUSE, SEND, EXPORT)
- Module concerné
- Référence
- Détails

Filtrage par module, pagination.

---

## Glossaire

| Terme | Définition |
|-------|-----------|
| **BCF** | Bon de Commande Fournisseur — document envoyé au fournisseur |
| **FNE** | Facture Normalisée Électronique — facture officielle DGI Côte d'Ivoire |
| **TEE** | Taxe d'État de l'Entreprenant — régime fiscal ivoirien |
| **Proforma** | Facture provisionnelle du fournisseur avant production |
| **Solde** | Montant restant à payer |
| **Avance** | Acompte versé avant livraison |
| **Surplus** | Quantité reçue au-delà de ce qui est commandé par le client |
| **Transitaire** | Prestataire gérant transport international + dédouanement |
| **BAT** | Bon à Tirer — maquette finale approuvée avant production |
| **Reconditionnement** | Personnalisation (gravure, broderie, sérigraphie, etc.) |

---

## Support

Pour toute question ou problème :
- Consulter ce guide
- Contacter l'administrateur système Dolee Group
- Signaler un bug via l'équipe technique

---

*© 2026 Dolee Group — Tous droits réservés*
