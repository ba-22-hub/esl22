-- ESL22 — Demande du président (17/11/2026) : le message administrateur devient
-- visible par le bénéficiaire, en LECTURE SEULE.
-- Ajout d'une policy SELECT sur sa propre ligne ; aucune policy INSERT/UPDATE/DELETE
-- pour le bénéficiaire → il ne peut ni créer, ni modifier, ni supprimer la note.
-- La policy admins existante (admins_all_user_admin_note) est inchangée.
-- À passer d'abord sur test (tzozmvnjrkiscdurtcis), puis en prod.

create policy "beneficiary_select_own_admin_note"
  on public.user_admin_note
  for select
  using (user_id = auth.uid());

-- Retour arrière :
-- drop policy if exists "beneficiary_select_own_admin_note" on public.user_admin_note;
