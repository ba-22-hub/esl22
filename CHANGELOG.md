# Changelog — ESL22 Banque Alimentaire des Côtes d'Armor

## v-next — en cours
### À venir
- ...

## [test-4.3.3] - 2026-08-07
## v13 - 2026-08-07 (esl22.fr)
### Ajouté
- **Refonte complète du cycle de vie des droits usagers** : nouvelle fonction SQL unique `handle_rights_lifecycle()` remplaçant les deux anciens crons (`update_has_rights_daily`, `prepare_notifications`).
  - Rappel automatique par email à J-21 avant échéance (auparavant J-7, et dépendant d'une connexion admin pour être réellement envoyé — souvent resté sans effet).
  - Suspension automatique à l'échéance (`status = 'Suspendu'` en plus de `has_right = false`).
  - Alerte automatique à l'équipe BA22 (Brevo) à chaque suspension d'usager.
- Nouvelle Edge Function `notify-end-right`, centralisant l'envoi Brevo pour le rappel, la suspension usager et l'alerte admin.
- Colonne `reminder_sent_at` (table `User`) pour éviter les rappels en double après un renouvellement.
- Table privée `private.app_settings` (schéma `private`) pour stocker l'URL de l'edge function et la clé service, contournant l'impossibilité de configurer `app.settings.*` via `ALTER DATABASE` sur Supabase managé.

### Corrigé
- **UserTable.jsx** : repousser la date de fin de droits (`end_right`) vers une date future réactive désormais automatiquement le compte (`has_right = true`, `status = 'Actif'`), au lieu de nécessiter une modification manuelle du statut en plus de la date. Corrige aussi un bug latent (référence à une variable `updatedUser` non définie).
- **create-invoice** : gestion CORS dynamique (`Access-Control-Allow-Origin` reflète l'origine de la requête), corrigeant un blocage de génération de facture sur `test.esl22.fr` ; syntaxe `jspdf-autotable` mise à jour.

### Supprimé
- Ancien mécanisme de notification manuel dans `UserTable.jsx`, déclenché à l'ouverture du dashboard admin (`notifyUsers`), remplacé par l'automatisation ci-dessus.

### Sécurité
- `handle_rights_lifecycle()` : accès restreint au rôle `postgres` (cron) via `revoke`/`grant` explicites, `search_path` fixé.
- Versionnement dans Git de l'ensemble des Edge Functions Supabase (12 fonctions), jusqu'ici déployées uniquement via le dashboard, hors suivi de version (`chore/versionner-edge-functions`).

### Testé
- Validé sur `test.esl22.fr` : rappel J-21 (mail reçu, `reminder_sent_at` mis à jour), suspension (mails usager + admin reçus, `status`/`has_right` corrects, anti-doublon confirmé), sécurité (`anon`/`authenticated` refusés sur `handle_rights_lifecycle()`).
- Déployé et validé sur `esl22.fr` : cron `handle_rights_lifecycle_daily` exécuté avec succès (04:00 UTC).

## [test-4.3.2] - 2026-08-02
## V121 - 2026-08-02 (esl22.fr) 
### Fixed
### Corrigé
- fix#186 (traité par JES) 
- **Gestion des ruptures de stock au paiement** (`PaymentSuccess.jsx`) : la mise à jour des stocks (`decrement_stock`) s'effectue désormais via `Promise.allSettled`, garantissant que l'échec sur un produit (rupture de stock, race condition) n'empêche plus l'enregistrement de la commande ni la mise à jour des stocks des autres produits du panier.
- En cas d'échec de mise à jour d'un ou plusieurs stocks, une alerte automatique est envoyée à l'équipe admin via Brevo (template #8), incluant le détail des erreurs, l'ID de la commande, l'email du client et la date.
- Le client voit désormais un message clair ("incident de stock signalé à l'équipe") plutôt qu'un échec silencieux ou un blocage du flow de commande.

### Testé
- Validé sur `test.esl22.fr` : commande avec un produit passant en rupture entre l'ajout au panier et le paiement → commande bien enregistrée, alerte Brevo reçue et délivrée avec les bonnes variables.


## [test-4.3.1] - 2026-07-29
## V11 - 2026-08-01 (esl22.fr) 
### Fixed
- **Cart.jsx** : correction de la distorsion entre le poids du panier calculé côté user et le poids restant calculé après expédition. Le poids d'emballage (`packagingWeight`) n'était pris en compte que côté back (`PaymentSuccess.jsx`) et pas côté front, provoquant un reste mensuel négatif possible en cas de panier proche du quota. Le poids d'emballage est désormais ajouté une seule fois par panier, aligné sur le calcul post-expédition (poids réel colis DPD).

### Changed
- **Cart.jsx** : ajout d'un tooltip ℹ️ sur "Poids total" précisant que l'emballage est inclus dans le total affiché au user.
- **UserTable.jsx** : libellé admin précisé — `Poids maximum autorisé par mois (en grammes)`.
- **AddUserModal.jsx** : libellés et tooltips ajoutés sur les 3 champs de quotas à la création de compte (poids max/mois, limite de commandes, limite de prix), pour lever l'ambiguïté pour l'admin.



## v10 — 2026-07-262
## test-4.2.0 (version test)
- cosmétique : remplacement de rayon22 par esl22 dans FirstConnection.jsx 

## v9 — 2026-07-22
## test-4.1.0 (version test) 
### Corrigé
- correction de la géolocalisation erronée + Simplification du message d'erreur géoloc et mise à jour la FAQ
- fichier ChosePickUpPoint.jsx et FAQ.jsx 
- correspond  à l'image test test-4.1.0 (scaleway)

## v8 — 2026-07-22
### Corrigé
- feat: affichage des 4 statuts de livraison (correction JES - delivery.jsx) 
- fix#185 src/pages/Delivery.jsx 

## v7 — 2026-07-21
### Corrigé
- merge feature/invoice depuis branch develop dans main 
- la branch develop sert pour tester avant livraison sur main

## v6 — 2026-06-29
### Corrigé
- JWT périmé après `updateUser()` à la première connexion → `refreshSession()` + fallback `signOut()`
- Cosmétique : Rayon22 => ESL22 dans index.html

- ....

## v2 — 2026-05-xx
### Ajouté
- Intégration DPD complète : proxy Node.js SOAP (`server.js` port 3000), Edge Function `create-dpd-label`, gestion poids depuis `cart.content` JSONB
- Workflow 4 statuts : `paid → validated → shipped → delivered`
- Gestion erreur 503 DPD
- Stripe basculé en mode live (vérification session, sans webhook)
- Tagging Docker versionné (`v2`, `v3`, `latest`)
- `process_order()` RPC `SECURITY DEFINER` pour décréments stock

### Modifié
- `PROXY_URL` déplacé dans Supabase Edge Function Secrets
- Credentials DPD dans `.env`
- pm2 configuré pour gérer le proxy DPD
