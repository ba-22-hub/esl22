-- Étape 2 « colis urgent » — accès du bénéficiaire.
--
-- Le bénéficiaire ne dispose que d'un droit de lecture sur son autorisation :
-- il ne doit pouvoir ni modifier son plafond, ni repousser son échéance. Le
-- marquage de la première ouverture du lien passe donc par une fonction
-- exécutée avec les droits du propriétaire, qui n'écrit que ce seul champ.

CREATE OR REPLACE FUNCTION mark_authorization_opened()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  a record;
BEGIN
  -- L'autorisation est retrouvée à partir de l'utilisateur connecté, jamais
  -- d'un identifiant fourni par l'appelant : nul ne peut ainsi toucher
  -- l'autorisation d'un tiers.
  SELECT auth_row.* INTO a
  FROM "UrgentAuthorization" auth_row
  JOIN "UrgentBeneficiary" b ON b.id = auth_row."urgentBeneficiaryId"
  WHERE b."userId" = auth.uid()
    AND auth_row.status = 'active'
  ORDER BY auth_row.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_active_authorization');
  END IF;

  IF a."expiresAt" < now() THEN
    UPDATE "UrgentAuthorization" SET status = 'expired' WHERE id = a.id;
    RETURN jsonb_build_object('ok', false, 'reason', 'expired');
  END IF;

  -- Première ouverture seulement : la date sert au centre social à savoir si
  -- la personne a pris connaissance de son courriel, pas à compter ses visites.
  IF a."openedAt" IS NULL THEN
    UPDATE "UrgentAuthorization" SET "openedAt" = now() WHERE id = a.id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'id', a.id,
    'type', a.type,
    'spendingLimit', a."spendingLimit",
    'spentAmount', a."spentAmount",
    'remaining', a."spendingLimit" - a."spentAmount",
    'expiresAt', a."expiresAt"
  );
END;
$$;

REVOKE ALL ON FUNCTION mark_authorization_opened() FROM public;
GRANT EXECUTE ON FUNCTION mark_authorization_opened() TO authenticated;
