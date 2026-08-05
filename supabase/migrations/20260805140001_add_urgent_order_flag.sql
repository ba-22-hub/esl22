-- Étape 1 "colis urgent" : traçabilité des commandes passées par le centre
-- social (MDS) au nom d'un bénéficiaire, sans création de compte séparé.
-- Convention alignée sur les colonnes existantes de cart (camelCase).

ALTER TABLE "cart"
  ADD COLUMN "isUrgent" boolean NOT NULL DEFAULT false,
  ADD COLUMN "urgentBeneficiaryName" text;

COMMENT ON COLUMN "cart"."isUrgent" IS
  'Commande "colis urgent" passée par un centre social au nom d''un bénéficiaire (étape 1, sans compte séparé)';
COMMENT ON COLUMN "cart"."urgentBeneficiaryName" IS
  'Nom du bénéficiaire réel, saisi par le centre social, à des fins de traçabilité uniquement';

-- Cohérence : le nom du bénéficiaire n'a de sens que si la commande est
-- marquée urgente.
ALTER TABLE "cart"
  ADD CONSTRAINT urgent_beneficiary_name_requires_flag
  CHECK (NOT "isUrgent" OR "urgentBeneficiaryName" IS NOT NULL);

-- Retrouver rapidement les commandes urgentes (admin, statistiques) sans
-- pénaliser les requêtes sur les commandes standard.
CREATE INDEX idx_cart_is_urgent ON "cart" ("created_at") WHERE "isUrgent";
