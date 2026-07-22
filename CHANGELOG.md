 
# Changelog — ESL22 Banque Alimentaire des Côtes d'Armor

## v-next — en cours
### À venir
- ...

## v8 — 2026-07-22
### Corrigé
- feat: affichage des 4 statuts de livraison (correction JES - delivery.jsx) 

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
