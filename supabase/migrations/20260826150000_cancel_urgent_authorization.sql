-- Étape 2 « colis urgent » — annulation d'une autorisation par le centre
-- social, avec fermeture immédiate de l'accès.
--
-- Sans cela, le compte restait ouvert jusqu'au passage du cron de 4 h : la
-- personne pouvait encore composer un panier, pour se voir refuser la
-- validation. La fermeture est donc faite dans le même mouvement que
-- l'annulation, les deux écritures devant réussir ou échouer ensemble.
--
-- La fonction s'exécute avec les droits du propriétaire, mais vérifie
-- elle-même que l'appelant est bien le centre social ayant accordé
-- l'autorisation : nul ne peut ainsi fermer l'accès accordé par un autre.

CREATE OR REPLACE FUNCTION cancel_urgent_authorization(auth_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  a record;
  v_user_id uuid;
BEGIN
  SELECT * INTO a
  FROM "UrgentAuthorization"
  WHERE id = auth_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF a."mdsId" <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'forbidden');
  END IF;

  IF a.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_active');
  END IF;

  UPDATE "UrgentAuthorization"
  SET status = 'cancelled'
  WHERE id = auth_id;

  SELECT b."userId" INTO v_user_id
  FROM "UrgentBeneficiary" b
  WHERE b.id = a."urgentBeneficiaryId";

  -- Le compte n'est fermé que s'il ne reste aucune autre autorisation en
  -- cours. L'index unique n'en admet qu'une seule, mais la vérification évite
  -- de dépendre de cette contrainte.
  IF v_user_id IS NOT NULL THEN
    UPDATE "User" u
    SET has_right = false,
        status = 'Suspendu'
    WHERE u.id = v_user_id
      AND NOT EXISTS (
        SELECT 1
        FROM "UrgentBeneficiary" b2
        JOIN "UrgentAuthorization" a2 ON a2."urgentBeneficiaryId" = b2.id
        WHERE b2."userId" = v_user_id
          AND a2.status = 'active'
      );
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION cancel_urgent_authorization(uuid) FROM public;
GRANT EXECUTE ON FUNCTION cancel_urgent_authorization(uuid) TO authenticated;
