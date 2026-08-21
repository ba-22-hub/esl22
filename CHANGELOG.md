## v14 - 2026-08-21 (esl22.fr)
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

