## [test-4.5.0] - 2026-08-28
### Ajouté
- **Colis urgent, seconde étape** : un centre social peut autoriser une personne qu'il accompagne à composer elle-même son colis, plutôt que de commander à sa place.
  - Table `UrgentAuthorization` : autorisation accordée par un centre social, bornée par un plafond de dépense et une échéance. Deux dispositifs partagent le même mécanisme et ne diffèrent que par leurs paramètres — colis urgent (48 h, une commande) et chèque d'accompagnement (durée saisie, 30 jours par défaut, plusieurs commandes jusqu'à épuisement). Les frais de livraison s'imputent sur le montant accordé.
  - Fonction `consume_urgent_authorization()` : décompte du montant à l'enregistrement d'une commande, sous verrou de ligne — deux commandes simultanées ne peuvent pas dépasser le plafond ensemble.
  - Type de compte `urgent` sur `User` : créé automatiquement au premier octroi, sans mot de passe, l'accès se faisant uniquement par lien. Colonnes `UrgentBeneficiary.userId`, `cart.billingClientId` et `cart.urgentAuthorizationId`.
  - Edge Function `authorize-urgent-beneficiary` : crée le compte si nécessaire, enregistre l'autorisation, génère un lien de connexion (`auth.admin.generateLink`) et l'envoie via Brevo. Le SMTP intégré de Supabase, limité en volume et sans personnalisation possible, n'aurait pas convenu.
  - Edge Function `create-authorized-order` : enregistre la commande sans passer par Stripe, décompte le montant accordé, et rattache la facture au centre social via `billingClientId` figé sur la commande — une personne peut être aidée successivement par des centres différents, les factures déjà émises doivent rester justes.
  - Edge Function `request-urgent-link` : renvoie un lien à une personne dont l'autorisation court encore. Le lien reçu ne vaut que quelques heures, alors qu'un chèque peut courir plusieurs semaines.
  - Edge Function `sync-urgent-beneficiary` : reporte sur le compte les coordonnées modifiées sur la fiche, adresse de connexion comprise (`auth.users`). Sans cela, une adresse corrigée n'aurait pas atteint l'étiquette de transport, et les liens suivants seraient partis à l'ancienne adresse.
  - Pages `AccesUrgent.jsx` (atterrissage du lien, vérification de l'autorisation, marquage de la première ouverture) et `DemanderUnLien.jsx` (demande d'un nouveau lien, accessible sans connexion).
  - `Cart.jsx` : montant restant affiché en permanence, contrôle du plafond à la validation, et seuil de poids selon le dispositif — 8 kg pour un colis urgent, 4 kg pour un chèque, un envoi en urgence ne se justifiant qu'au-delà d'un certain volume.
  - `UrgentBeneficiaryTable.jsx` : octroi d'une autorisation, suivi du montant restant et de l'ouverture du lien, annulation avec fermeture immédiate de l'accès.
  - `Delivery.jsx` : le centre social voit les commandes qu'il finance, distinguées de celles qu'il a lui-même composées.
  - Templates Brevo 13 (invitation adressée au bénéficiaire) et 14 (commande passée par le bénéficiaire, avec le solde restant).
  - Constantes `urgentAuthHours` et `capDefaultHours`, modifiables depuis l'écran d'administration.

### Corrigé
- **`handle_rights_lifecycle()`** : les comptes `urgent` sont exclus du cycle de droits, au même titre que les comptes `mds`. Traités comme des bénéficiaires ordinaires, ils étaient suspendus dès que `end_right` était dépassé — y compris lorsqu'une autorisation plus longue courait encore. Un troisième cas ferme désormais leur accès lorsqu'ils n'ont plus d'autorisation en cours, ce qui remplace pour eux la notion de fin de droits.
- **`authorize-urgent-beneficiary`** : `end_right` est aligné sur la nouvelle échéance à chaque octroi. Il n'était écrit qu'à la création du compte : une personne ayant reçu un colis urgent puis un chèque restait bloquée sur l'échéance des 48 heures.
- **Annulation d'une autorisation** : l'accès est fermé dans le même mouvement, via `cancel_urgent_authorization()`. Le compte restait ouvert jusqu'au passage du traitement quotidien, laissant composer un panier pour rien.
- **Adresse déjà utilisée** : une adresse électronique correspondant à un compte de l'épicerie est refusée avec un message explicite, au lieu d'une erreur technique.

### Sécurité
- `request-urgent-link` répond invariablement la même chose, que l'adresse soit connue ou non : distinguer les deux cas permettrait de découvrir, par essais successifs, qui bénéficie de l'aide alimentaire. Le lien n'est délivré qu'aux comptes `urgent` disposant d'une autorisation active, et envoyé à l'adresse enregistrée sur la fiche plutôt qu'à celle saisie.
- Les fonctions de l'étape 2 restreignent les origines autorisées à une liste connue, au lieu de refléter celle de la requête ou d'utiliser un joker.
- Policy `mds_view_billed_carts` sur `cart` : le centre social consulte, en lecture seule, les commandes qui lui sont facturées.
- Les fonctions `mark_authorization_opened()` et `cancel_urgent_authorization()` retrouvent l'autorisation à partir de l'utilisateur connecté ou vérifient l'appartenance, sans jamais se fier à un identifiant fourni par l'appelant.

## [test-4.4.1] - 2026-08-19
### Corrigé
- **`create-invoice`** : ajout de la date sur les factures, mention obligatoire jusqu'ici absente. La date retenue est celle de la commande (`cart.created_at`) et non celle de la génération du document, afin qu'une facture regénérée porte la même date que l'originale.
- **`Delivery.jsx`** : les commandes urgentes n'étaient pas distinguables dans « Mes livraisons » côté centre social — le bénéficiaire destinataire est désormais indiqué.

## [test-4.4.0] - 2026-08-16
### Ajouté
- **Fonctionnalité « colis urgent » (étape 1)** : un centre social peut commander pour une personne accompagnée en urgence, sans paiement en ligne.
  - Colonne `accountType` (table `User`) distinguant `beneficiary` (défaut) et `mds` (centre social), avec contrainte `CHECK`. Un compte MDS est créé sans quotas (`weight_limit`/`price_limit`/`order_limit` à `NULL` = illimité) et actif immédiatement.
  - Table `UrgentBeneficiary` : fiches des bénéficiaires en urgence, gérées par le centre social, sans compte utilisateur ni authentification propre. `phone` obligatoire (notification DPD), `email` facultatif, adresse de livraison portée par la fiche.
  - Colonnes `isUrgent`, `urgentBeneficiaryId` (FK, `ON DELETE SET NULL`) et `urgentBeneficiaryName` sur la table `cart`. Le nom est conservé en instantané pour que l'historique et les factures restent lisibles après modification ou suppression de la fiche.
  - Nouvelle Edge Function `create-urgent-order` : enregistre la commande sans passer par Stripe (insertion `cart`, décrément des stocks en `allSettled`, mise à jour des compteurs, facture au centre social, notifications). Vérifie l'habilitation MDS de l'appelant et la propriété de la fiche, et **recalcule prix et poids depuis la table `products`** — aucun paiement ne venant attester des montants transmis par le client.
  - Nouveau composant `UrgentBeneficiaryTable.jsx` : CRUD complet pour le centre social, consultation seule pour un admin (avec identification du centre social propriétaire). Accessible via `/urgent-beneficiaries` (client) et `/admin/urgent-beneficiaries` (dashboard).
  - Contexte de commande urgente dans `CartContext` (`urgentBeneficiary`, `startUrgentOrder`, `clearUrgentOrder`), persisté en `sessionStorage` : survit à un rafraîchissement de page en pleine composition du panier, mais pas à la fermeture du navigateur. Bandeau de rappel permanent (`UrgentOrderBanner.jsx`).
  - Constante `urgentWeightMin` (8000 g) : poids minimal spécifique aux colis urgents, remplaçant `minCartWeight` (4000 g) pour ce parcours ; `maxCartWeight` inchangé. Éditable dans les paramètres admin (`ProductTable.jsx`).
  - Template Brevo 12 : confirmation adressée au centre social, mentionnant le bénéficiaire concerné. Le bénéficiaire reçoit le template 2 habituel, complété du point relais, si une adresse mail figure sur sa fiche.
  - `AuthorContext` expose `accountType` et `isMds` ; entrée de menu « Mes bénéficiaires » réservée aux comptes MDS.

### Corrigé
- **`handle_rights_lifecycle()`** : les comptes MDS sont exclus des deux boucles (rappel J-21 et suspension à échéance). Un centre social n'a pas de date de fin de droits pertinente et ne doit jamais être suspendu automatiquement.
- **`OrderTable.jsx`** : pour une commande urgente, l'étiquette DPD et les notifications de livraison utilisent les coordonnées du bénéficiaire (`UrgentBeneficiary`) et non celles du centre social émetteur — les colis partaient auparavant à l'adresse du centre social. Si la fiche a été supprimée depuis la commande, la génération s'interrompt avec un message explicite plutôt que de retomber silencieusement sur l'adresse du compte émetteur.
- **`ChosePickUpPoint.jsx`** : les points relais proposés pour un colis urgent sont recherchés autour du code postal du bénéficiaire, et non par géolocalisation du poste depuis lequel le centre social passe la commande.
- **`AuthorContext.jsx`** : les rôles et droits (`hasRights`, `isAdmin`, `accountType`) sont rechargés sur changement de session (`SIGNED_IN`, `SIGNED_OUT`, `USER_UPDATED`). Après une déconnexion suivie d'une reconnexion dans le même onglet, ils conservaient auparavant leur valeur précédente, `onAuthStateChange` ne mettant à jour que `user`.
- **`uploadImage.js`** : `normalizeFileName` ne retirait que les accents. Les noms de fichiers contenant des espaces ou des virgules étaient acceptés à l'upload mais devenaient impossibles à relire depuis le bucket. Les clés sont désormais normalisées (minuscules, caractères non alphanumériques remplacés par des tirets, extension préservée).
- **`AddUserModal.jsx`** : trois champs du formulaire (`address`, `addAddress`, `city`) étaient liés à des clés inexistantes de `formData` (`street`, `addr`, `region`) et restaient donc vides à l'enregistrement.
- **`createUser.js`** : les messages d'erreur affichaient `undefined` en lieu et place du nom de l'utilisateur (`user.name`, propriété inexistante).

### Sécurité
- Table `UrgentBeneficiary` : RLS active, policy `mdsId = auth.uid()` en `ALL`. L'étanchéité entre centres sociaux est imposée au niveau de la base et non par le filtrage applicatif — une requête sans filtre ne peut pas remonter les fiches d'un autre centre social. Policy distincte en `SELECT` seul pour la supervision par les admins.
- `create-urgent-order` : l'identité de l'appelant est établie via son JWT, et la propriété de la fiche bénéficiaire vérifiée par la RLS avant tout enregistrement.
- **`.gitignore`** : la ligne `supabase/` excluait l'intégralité du répertoire, laissant les migrations et les 12 Edge Functions déployées hors de tout suivi de version. Corrigée, et l'ensemble des fonctions rapatrié dans le dépôt.

### Supprimé
- Edge Function `swift-function` (fonction de test résiduelle, jamais utilisée).

