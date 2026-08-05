-- Étape 1 "colis urgent" — fondation :
-- Distinction structurelle entre compte bénéficiaire (comportement actuel,
-- inchangé) et compte MDS (centre social), qui ne doit PAS entrer dans le
-- cycle de droits (has_right / end_right / J-15 / suspension) ni être
-- soumis aux quotas individuels.
--
-- NB : le nettoyage de notified/should_notify (ancien cron
-- prepare_notifications) a déjà été effectué manuellement sur
-- test.esl22.fr, il n'est donc plus inclus ici.

ALTER TABLE "User"
  ADD COLUMN "accountType" text NOT NULL DEFAULT 'beneficiary';

ALTER TABLE "User"
  ADD CONSTRAINT user_account_type_valid
  CHECK ("accountType" IN ('beneficiary', 'mds'));

COMMENT ON COLUMN "User"."accountType" IS
  'beneficiary (défaut) = compte bénéficiaire standard, soumis au cycle de '
  'droits et aux quotas. mds = compte centre social, exclu du cycle de '
  'droits (has_right/end_right ignorés par handle_rights_lifecycle) et sans '
  'quotas individuels (weight_limit/price_limit/order_limit doivent être '
  'laissés à NULL = illimité, déjà géré comme tel côté front).';
