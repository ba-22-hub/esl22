-- Colis urgent — signaler au centre social qu'une adresse électronique
-- correspond déjà à un compte de l'épicerie.
--
-- Une personne déjà inscrite dispose de son propre compte et de ses propres
-- droits : elle ne peut pas recevoir d'accès par le dispositif « colis
-- urgent ». Le centre social peut en revanche commander pour elle.
--
-- Jusqu'ici, il ne l'apprenait qu'en tentant d'accorder une autorisation,
-- après avoir créé la fiche et parfois passé des commandes. Cette fonction
-- permet de l'en avertir dès la saisie.
--
-- Elle s'exécute avec les droits du propriétaire, le centre social n'ayant
-- aucun accès à la table User. Elle ne renvoie qu'un booléen : ni identité, ni
-- coordonnées, rien qui permette de découvrir qui est inscrit à l'épicerie.
-- Seuls les comptes non « urgent » sont signalés, un compte urgent
-- préexistant étant simplement réutilisé.

CREATE OR REPLACE FUNCTION email_belongs_to_existing_account(email_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  found_type text;
BEGIN
  IF email_input IS NULL OR trim(email_input) = '' THEN
    RETURN false;
  END IF;

  SELECT u."accountType" INTO found_type
  FROM "User" u
  WHERE lower(u.email) = lower(trim(email_input))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  RETURN found_type <> 'urgent';
END;
$$;

REVOKE ALL ON FUNCTION email_belongs_to_existing_account(text) FROM public;
GRANT EXECUTE ON FUNCTION email_belongs_to_existing_account(text) TO authenticated;
