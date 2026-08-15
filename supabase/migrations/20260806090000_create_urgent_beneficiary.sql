-- Étape 1 "colis urgent" — fiches bénéficiaires en situation d'urgence.
--
-- Chaque MDS gère sa propre liste de bénéficiaires (créer/consulter/modifier/
-- supprimer), totalement étanche vis-à-vis des autres MDS et des comptes
-- bénéficiaires ordinaires (table User). L'étanchéité est imposée par RLS
-- (mdsId = auth.uid()), pas seulement par le front.
--
-- Un admin BA22 peut consulter toutes les fiches, toutes MDS confondues
-- (supervision), mais ne les modifie/supprime pas à la place du MDS.

CREATE TABLE "UrgentBeneficiary" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "mdsId" uuid NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "firstName" text NOT NULL,
  "lastName" text NOT NULL,
  phone text NOT NULL,
  email text,
  address text,
  "addAddress" text,
  city text,
  "postalCode" text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE "UrgentBeneficiary" IS
  'Fiches bénéficiaires "colis urgent" créées et gérées par un MDS (centre '
  'social), sans compte utilisateur ni authentification propre à ce stade '
  '(étape 1). Étanche par RLS : un MDS ne voit/gère que ses propres fiches.';
COMMENT ON COLUMN "UrgentBeneficiary"."mdsId" IS
  'Référence vers le compte MDS (User.accountType = ''mds'') propriétaire de '
  'cette fiche. Détermine l''étanchéité via RLS.';
COMMENT ON COLUMN "UrgentBeneficiary".email IS
  'Optionnel : DPD peut livrer avec le seul numéro de téléphone. Sera '
  'toutefois indispensable en étape 2 (magic link) pour qu''un bénéficiaire '
  'compose lui-même son panier.';
COMMENT ON COLUMN "UrgentBeneficiary".phone IS
  'Obligatoire : canal utilisé par DPD pour la notification de livraison.';

-- Maintien automatique de updated_at à chaque modification.
CREATE OR REPLACE FUNCTION set_urgent_beneficiary_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_urgent_beneficiary_updated_at
  BEFORE UPDATE ON "UrgentBeneficiary"
  FOR EACH ROW
  EXECUTE FUNCTION set_urgent_beneficiary_updated_at();

-- RLS : étanchéité stricte par MDS propriétaire.
ALTER TABLE "UrgentBeneficiary" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mds_manage_own_urgent_beneficiaries" ON "UrgentBeneficiary"
  FOR ALL
  USING ("mdsId" = auth.uid())
  WITH CHECK ("mdsId" = auth.uid());

-- Supervision admin : lecture seule, toutes fiches confondues.
CREATE POLICY "admin_view_all_urgent_beneficiaries" ON "UrgentBeneficiary"
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM "Admins" a WHERE a.id = auth.uid()));

-- Retrouver rapidement les fiches d'un MDS donné (liste principale de l'écran MDS).
CREATE INDEX idx_urgent_beneficiary_mds ON "UrgentBeneficiary" ("mdsId");
