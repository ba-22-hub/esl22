-- =============================================================================
-- Sécurité, phase 1 (03/11/2026 en test, à appliquer en prod)
-- - User : suppression de la règle qui ouvrait toutes les fiches à tous
-- - products : suppression de la modification ouverte à tous et d'un doublon
-- - products : création réservée aux admins
-- - decrement_stock : droits du créateur, quantité positive obligatoire,
--   réservée aux personnes connectées
-- Script rejouable sans risque (create or replace, drop if exists, alter).
-- =============================================================================

-- decrement_stock : droits du créateur, quantité positive, connectés uniquement
create or replace function public.decrement_stock(product_id_input uuid, quantity_input integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if quantity_input is null or quantity_input <= 0 then
    raise exception 'Quantité invalide';
  end if;
  update public.products set stock = stock - quantity_input
  where id = product_id_input and stock >= quantity_input;
  if not found then
    raise exception 'Stock insuffisant';
  end if;
end;
$$;
revoke all on function public.decrement_stock(uuid, integer) from public, anon;
grant execute on function public.decrement_stock(uuid, integer) to authenticated, service_role;

-- Produits : plus de modification ouverte à tous ; suppression d'un doublon de lecture
drop policy if exists "Authentificated users can update" on public.products;
drop policy if exists "Enable read access for all users" on public.products;

-- Produits : création réservée aux admins (aligné sur test)
alter policy "Enable insert for users based on user_id" on public.products
  to authenticated
  with check (auth.uid() in (select id from public."Admins"));

-- Fiches bénéficiaires : fermeture de l'accès ouvert à tous
drop policy if exists "Service role full access on User" on public."User";
