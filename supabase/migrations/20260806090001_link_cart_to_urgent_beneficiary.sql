-- Étape 1 "colis urgent" — lien structurel entre une commande urgente et la
-- fiche bénéficiaire (UrgentBeneficiary), en plus du nom déjà stocké.
--
-- "urgentBeneficiaryName" est volontairement conservé : c'est un instantané
-- du nom au moment de la commande, pour que l'historique/la facture restent
-- lisibles même si la fiche est modifiée ou supprimée plus tard par le MDS.
-- ON DELETE SET NULL (pas CASCADE) : supprimer une fiche ne doit jamais
-- supprimer les commandes déjà passées pour elle.

ALTER TABLE "cart"
  ADD COLUMN "urgentBeneficiaryId" uuid REFERENCES "UrgentBeneficiary"(id) ON DELETE SET NULL;

COMMENT ON COLUMN "cart"."urgentBeneficiaryId" IS
  'Référence vers la fiche UrgentBeneficiary utilisée pour cette commande '
  '(NULL si la fiche a été supprimée depuis, ou si absente dès l''origine). '
  'urgentBeneficiaryName reste la source fiable pour l''affichage historique.';

CREATE INDEX idx_cart_urgent_beneficiary ON "cart" ("urgentBeneficiaryId") WHERE "urgentBeneficiaryId" IS NOT NULL;
