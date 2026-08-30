-- Étape 2 « colis urgent » — autorisations de commande.
--
-- Un centre social (MDS) peut autoriser un bénéficiaire à composer lui-même
-- son panier. Cette autorisation est bornée par un plafond de dépense et une
-- durée, tous deux fixés à l'octroi. Deux dispositifs sont couverts par le
-- même mécanisme, seuls leurs paramètres diffèrent :
--
--   colis_urgent : plafond fixé par le MDS, validité 48 h
--   cap          : montant du chèque d'accompagnement personnalisé, 30 jours
--
-- Une table plutôt que des colonnes sur UrgentBeneficiary : une même personne
-- peut recevoir plusieurs autorisations successives, et l'historique des
-- aides accordées doit être conservé.

-- ---------------------------------------------------------------------------
-- 1. Type de compte « urgent »
-- ---------------------------------------------------------------------------
-- Les bénéficiaires autorisés disposent d'un compte User (indispensable pour
-- ouvrir une session et porter un panier), mais qui n'a rien d'un compte
-- ordinaire : créé automatiquement, sans mot de passe, hors cycle de droits.

ALTER TABLE "User" DROP CONSTRAINT IF EXISTS user_account_type_valid;

ALTER TABLE "User"
  ADD CONSTRAINT user_account_type_valid
  CHECK ("accountType" IN ('beneficiary', 'mds', 'urgent'));

COMMENT ON COLUMN "User"."accountType" IS
  'beneficiary (défaut) = compte bénéficiaire standard, soumis au cycle de '
  'droits et aux quotas. mds = compte centre social. urgent = compte créé '
  'automatiquement pour un bénéficiaire autorisé à composer son panier '
  '(étape 2) : sans mot de passe, hors cycle de droits, accès borné par une '
  'autorisation.';

-- ---------------------------------------------------------------------------
-- 2. Lien entre la fiche et le compte
-- ---------------------------------------------------------------------------
-- NULL tant que la personne n'a jamais été autorisée. Permet aussi de savoir
-- d'un coup d'œil qui dispose déjà d'un accès.

ALTER TABLE "UrgentBeneficiary"
  ADD COLUMN "userId" uuid UNIQUE REFERENCES "User"(id) ON DELETE SET NULL;

COMMENT ON COLUMN "UrgentBeneficiary"."userId" IS
  'Compte User associé à cette fiche, créé lors de la première autorisation. '
  'NULL si la personne n''a jamais été autorisée à commander elle-même.';

-- ---------------------------------------------------------------------------
-- 3. Table des autorisations
-- ---------------------------------------------------------------------------

CREATE TABLE "UrgentAuthorization" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "urgentBeneficiaryId" uuid NOT NULL REFERENCES "UrgentBeneficiary"(id) ON DELETE CASCADE,
  "mdsId" uuid NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,

  -- Dispositif au titre duquel l'aide est accordée.
  type text NOT NULL,

  -- Plafond de dépense, fixé par le centre social. Pour un CAP, il s'agit du
  -- montant du chèque. Les frais de livraison s'imputent sur ce plafond : le
  -- montant disponible pour les produits est donc inférieur, et diminue à
  -- chaque envoi lorsque la commande est fractionnée.
  "spendingLimit" real NOT NULL,

  -- Montant déjà consommé, frais de livraison compris. Un colis urgent est
  -- réglé en une commande ; un CAP peut être fractionné sur plusieurs,
  -- notamment parce que la limite de poids du transporteur (19 kg) empêche
  -- souvent de tout commander d'un coup. Seul le montant réellement dépensé
  -- est facturé : un éventuel reliquat n'est pas reporté, le centre social en
  -- dispose comme il l'entend.
  "spentAmount" real NOT NULL DEFAULT 0,

  -- Échéance de l'autorisation. Pour un colis urgent, elle découle de la durée
  -- système (constante urgentAuthHours). Pour un CAP, elle est saisie par le
  -- centre social, qui reprend la date figurant sur le chèque ; le formulaire
  -- propose 30 jours par défaut.
  -- Au-delà de cette date, plus aucun lien de connexion n'est délivré et
  -- l'accès est refusé, même si un lien antérieur est encore techniquement
  -- valide.
  "expiresAt" timestamptz NOT NULL,

  -- active : en cours de validité, solde disponible
  -- exhausted : plafond atteint
  -- expired : date dépassée sans que le plafond soit atteint
  -- cancelled : le centre social a repris la main (il commande lui-même)
  status text NOT NULL DEFAULT 'active',

  -- Suivi, pour que le centre social sache où en est sa démarche.
  "invitedAt" timestamptz NOT NULL DEFAULT now(),
  "openedAt" timestamptz,
  "lastOrderAt" timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT urgent_authorization_type_valid
    CHECK (type IN ('colis_urgent', 'cap')),
  CONSTRAINT urgent_authorization_status_valid
    CHECK (status IN ('active', 'exhausted', 'expired', 'cancelled')),
  CONSTRAINT urgent_authorization_limit_positive
    CHECK ("spendingLimit" > 0),
  CONSTRAINT urgent_authorization_spent_within_limit
    CHECK ("spentAmount" >= 0 AND "spentAmount" <= "spendingLimit")
);

COMMENT ON TABLE "UrgentAuthorization" IS
  'Autorisations accordées par un centre social à un bénéficiaire pour '
  'composer lui-même son panier. Bornées par un plafond de dépense et une '
  'date d''expiration. Conservées après usage : constituent l''historique '
  'des aides accordées.';

-- Une seule autorisation en cours à la fois par bénéficiaire : sans cela,
-- deux plafonds concurrents s'appliqueraient au même panier.
CREATE UNIQUE INDEX idx_urgent_authorization_one_active
  ON "UrgentAuthorization" ("urgentBeneficiaryId")
  WHERE status = 'active';

CREATE INDEX idx_urgent_authorization_mds
  ON "UrgentAuthorization" ("mdsId", status);

-- ---------------------------------------------------------------------------
-- 4. Consommation du solde
-- ---------------------------------------------------------------------------
-- Le décompte doit être atomique : deux commandes validées au même instant
-- pourraient chacune constater un solde suffisant et le dépasser ensemble.
-- Le verrou de ligne (FOR UPDATE) sérialise les deux.

CREATE OR REPLACE FUNCTION consume_urgent_authorization(
  auth_id uuid,
  amount real
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  a record;
  new_spent real;
BEGIN
  SELECT * INTO a
  FROM "UrgentAuthorization"
  WHERE id = auth_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF a.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_active');
  END IF;

  IF a."expiresAt" < now() THEN
    UPDATE "UrgentAuthorization" SET status = 'expired' WHERE id = auth_id;
    RETURN jsonb_build_object('ok', false, 'reason', 'expired');
  END IF;

  new_spent := a."spentAmount" + amount;

  IF new_spent > a."spendingLimit" THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'over_limit',
      'remaining', a."spendingLimit" - a."spentAmount"
    );
  END IF;

  UPDATE "UrgentAuthorization"
  SET "spentAmount" = new_spent,
      "lastOrderAt" = now(),
      -- Une tolérance d'un centime évite qu'un reliquat résiduel dû aux
      -- arrondis maintienne l'autorisation ouverte pour rien.
      status = CASE WHEN a."spendingLimit" - new_spent < 0.01 THEN 'exhausted' ELSE 'active' END
  WHERE id = auth_id;

  RETURN jsonb_build_object(
    'ok', true,
    'remaining', a."spendingLimit" - new_spent
  );
END;
$$;

REVOKE ALL ON FUNCTION consume_urgent_authorization(uuid, real) FROM public;

-- ---------------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------------

ALTER TABLE "UrgentAuthorization" ENABLE ROW LEVEL SECURITY;

-- Le centre social gère les autorisations qu'il a lui-même accordées.
CREATE POLICY "mds_manage_own_authorizations" ON "UrgentAuthorization"
  FOR ALL
  USING ("mdsId" = auth.uid())
  WITH CHECK ("mdsId" = auth.uid());

-- Le bénéficiaire consulte la sienne : il doit connaître son plafond et la
-- date au-delà de laquelle son accès se ferme.
CREATE POLICY "beneficiary_view_own_authorization" ON "UrgentAuthorization"
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "UrgentBeneficiary" b
    WHERE b.id = "UrgentAuthorization"."urgentBeneficiaryId"
      AND b."userId" = auth.uid()
  ));

-- Supervision par l'équipe, en consultation seule.
CREATE POLICY "admin_view_all_authorizations" ON "UrgentAuthorization"
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM "Admins" a WHERE a.id = auth.uid()));

-- Le bénéficiaire doit également pouvoir lire sa propre fiche (adresse de
-- livraison, coordonnées) une fois connecté.
CREATE POLICY "beneficiary_view_own_record" ON "UrgentBeneficiary"
  FOR SELECT
  USING ("userId" = auth.uid());

-- ---------------------------------------------------------------------------
-- 6. Facturation portée par la commande
-- ---------------------------------------------------------------------------
-- Le centre social à facturer est figé sur la commande plutôt que déduit du
-- compte : une personne peut être aidée successivement par des centres
-- différents, et les factures déjà émises doivent rester justes.

ALTER TABLE "cart"
  ADD COLUMN "billingClientId" uuid REFERENCES "User"(id) ON DELETE SET NULL;

COMMENT ON COLUMN "cart"."billingClientId" IS
  'Compte à facturer, lorsqu''il diffère de client_id. Renseigné pour une '
  'commande passée par un bénéficiaire autorisé (étape 2) : la facture revient '
  'au centre social qui a accordé l''autorisation. NULL pour toute commande '
  'ordinaire, auquel cas client_id fait foi.';

ALTER TABLE "cart"
  ADD COLUMN "urgentAuthorizationId" uuid REFERENCES "UrgentAuthorization"(id) ON DELETE SET NULL;

COMMENT ON COLUMN "cart"."urgentAuthorizationId" IS
  'Autorisation au titre de laquelle cette commande a été passée, le cas '
  'échéant. Plusieurs commandes peuvent se rattacher à une même autorisation '
  '(cas d''un CAP fractionné). Permet de retracer le dispositif mobilisé.';
