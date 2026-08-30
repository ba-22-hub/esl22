-- Étape 2 « colis urgent » — le centre social doit voir les commandes qu'il
-- finance.
--
-- Lorsque le bénéficiaire commande lui-même, client_id porte son compte et le
-- centre social n'apparaît que dans billingClientId. Les policies existantes
-- ne lui donnaient donc aucun accès à ces commandes, alors même qu'il en
-- assume la dépense et doit pouvoir en suivre la livraison.

CREATE POLICY "mds_view_billed_carts" ON "cart"
  FOR SELECT
  USING ("billingClientId" = auth.uid());

COMMENT ON POLICY "mds_view_billed_carts" ON "cart" IS
  'Le centre social consulte les commandes qui lui sont facturées, passées '
  'par un bénéficiaire qu''il a autorisé. En lecture seule : il ne les modifie '
  'pas, n''en étant pas l''auteur.';
