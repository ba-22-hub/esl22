-- Paniers en cours de paiement.
--
-- Stripe limite chaque valeur de métadonnée à 500 caractères. Le panier y
-- était transmis sous forme d'identifiants et de quantités : un identifiant
-- UUID occupant 36 caractères, une dizaine d'articles suffisait à dépasser la
-- limite, et le paiement échouait.
--
-- Le panier est désormais déposé ici avant la redirection vers Stripe, qui ne
-- reçoit plus que la référence de cette ligne — 36 caractères, quel que soit
-- le nombre d'articles. Au retour, la commande est enregistrée à partir de
-- cette ligne, qui est ensuite supprimée.
--
-- Une table distincte de « cart » plutôt qu'un statut « en attente » : les
-- paniers abandonnés en cours de paiement ne doivent pas apparaître parmi les
-- commandes réelles.

CREATE TABLE "PendingCheckout" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,

  -- Identifiants et quantités, tels que transmis au moment de la validation.
  -- Les prix et poids sont relus depuis « products » au moment d'enregistrer
  -- la commande : ce qui transite par le navigateur ne fait pas foi.
  items jsonb NOT NULL,

  "pickupPointId" text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE "PendingCheckout" IS
  'Panier déposé avant redirection vers le paiement, le temps de la '
  'transaction. Supprimé une fois la commande enregistrée. Les lignes qui '
  'subsistent correspondent à des paiements abandonnés.';

CREATE INDEX idx_pending_checkout_created ON "PendingCheckout" (created_at);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- La fonction d'enregistrement travaille avec la clé de service et n'est donc
-- pas concernée. La lecture est ouverte au propriétaire du panier, pour le cas
-- où le traitement du retour aurait besoin de la consulter côté navigateur.

ALTER TABLE "PendingCheckout" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_view_own_pending_checkout" ON "PendingCheckout"
  FOR SELECT
  USING (client_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Nettoyage des abandons
-- ---------------------------------------------------------------------------
-- Un panier non confirmé au bout de vingt-quatre heures correspond à un
-- paiement abandonné : la session Stripe a elle-même expiré bien avant.

CREATE OR REPLACE FUNCTION purge_pending_checkouts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM "PendingCheckout"
  WHERE created_at < now() - INTERVAL '24 hours';
END;
$$;

REVOKE ALL ON FUNCTION purge_pending_checkouts() FROM public;

-- Passage quotidien, à 3 h. Les sessions Stripe expirent d'elles-mêmes bien
-- avant ce délai : une ligne qui subsiste correspond donc à un paiement
-- abandonné ou interrompu.
SELECT cron.schedule(
  'purge_pending_checkouts_daily',
  '0 3 * * *',
  $$ SELECT public.purge_pending_checkouts() $$
);
