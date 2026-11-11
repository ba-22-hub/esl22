-- ESL22 — « Information Bénéficiaire » (le bloc « Déclarations » est seulement masqué côté front)
-- Migration 100 % additive : aucune colonne existante modifiée ou supprimée, pas de trigger.
-- À passer d'abord sur test.esl22.fr (tzozmvnjrkiscdurtcis), puis en prod.
-- Tables réelles : "User" (bénéficiaires) et "Admins" (id = auth.uid() des administrateurs).

begin;

-- 1. Champs visibles par le bénéficiaire
alter table public."User"
  add column if not exists validation_org text
    check (char_length(validation_org) <= 150),
  add column if not exists validation_person text
    check (char_length(validation_person) <= 150),
  add column if not exists user_message text
    check (char_length(user_message) <= 500);

comment on column public."User".validation_org is
  'Origine de la validation — organisation (ex : CCAS de Lannion)';
comment on column public."User".validation_person is
  'Origine de la validation — personne et fonction (ex : Ginette Durand, AS)';
comment on column public."User".user_message is
  'Message affiché au bénéficiaire dans son espace';

-- 2. Message administrateur : table séparée, jamais lisible par le bénéficiaire
create table if not exists public.user_admin_note (
  user_id       uuid primary key references public."User"(id) on delete cascade,
  admin_message text check (char_length(admin_message) <= 1000),
  updated_at    timestamptz not null default now(),
  updated_by    uuid default auth.uid()
);

alter table public.user_admin_note enable row level security;

create policy "admins_all_user_admin_note"
  on public.user_admin_note
  for all
  using (exists (select 1 from public."Admins" a where a.id = auth.uid()))
  with check (exists (select 1 from public."Admins" a where a.id = auth.uid()));

commit;

-- Retour arrière (remet la base exactement dans l'état actuel) :
-- drop table if exists public.user_admin_note;
-- alter table public."User"
--   drop column if exists validation_org,
--   drop column if exists validation_person,
--   drop column if exists user_message;
