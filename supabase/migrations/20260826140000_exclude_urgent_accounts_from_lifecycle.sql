-- Étape 2 « colis urgent » — les comptes de bénéficiaires autorisés ne
-- relèvent pas du cycle de droits ordinaire.
--
-- Un compte « urgent » n'a pas de droits à renouveler : son accès est borné
-- par l'autorisation que lui a accordée le centre social. Traité comme un
-- bénéficiaire ordinaire, il recevait des rappels de fin de droits et se
-- trouvait suspendu dès que end_right était dépassé — y compris lorsqu'une
-- autorisation plus longue était en cours.
--
-- Deux changements :
--   1. les comptes « urgent » sortent des deux boucles existantes, au même
--      titre que les comptes « mds » ;
--   2. un troisième cas ferme leur accès lorsqu'ils n'ont plus d'autorisation
--      en cours, ce qui remplace pour eux la notion de fin de droits.

CREATE OR REPLACE FUNCTION public.handle_rights_lifecycle()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'net', 'private'
AS $function$
declare
  r record;
  v_url text;
  v_key text;
begin
  select value into v_url from private.app_settings where key = 'notify_end_right_url';
  select value into v_key from private.app_settings where key = 'service_role_key';

  -- CAS 1 : J-21, avertissement (compte reste Actif)
  for r in
    select u.id, u.email, u."firstName"
    from public."User" u
    where u.has_right = true
      and u."accountType" not in ('mds', 'urgent')
      and u.end_right = CURRENT_DATE + INTERVAL '21 days'
      and (u.reminder_sent_at is null or u.reminder_sent_at < u.end_right - INTERVAL '30 days')
  loop
    perform net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_key
      ),
      body := jsonb_build_object(
        'user_id', r.id, 'email', r.email, 'firstName', r."firstName",
        'templateId', 3
      )
    );
  end loop;

  -- CAS 2 : échéance atteinte -> suspension + notification user + notification admin
  for r in
    select u.id, u.email, u."firstName", u.end_right
    from public."User" u
    where u.end_right < CURRENT_DATE
      and u.has_right = true
      and u."accountType" not in ('mds', 'urgent')
  loop
    update public."User"
    set has_right = false,
        status = 'Suspendu'
    where id = r.id;

    perform net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_key
      ),
      body := jsonb_build_object(
        'user_id', r.id, 'email', r.email, 'firstName', r."firstName",
        'templateId', 4
      )
    );

    perform net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_key
      ),
      body := jsonb_build_object(
        'type', 'admin_alert',
        'user_id', r.id, 'email', r.email, 'firstName', r."firstName",
        'end_right', r.end_right,
        'templateId', 9
      )
    );
  end loop;

  -- CAS 3 : comptes « urgent » sans autorisation en cours.
  -- Marque d'abord comme échues les autorisations dont la date est passée,
  -- puis ferme l'accès des comptes qui n'en ont plus aucune d'active. Aucune
  -- notification : la personne n'a pas de démarche à faire, c'est au centre
  -- social de lui en accorder une nouvelle s'il le juge utile.
  update public."UrgentAuthorization"
  set status = 'expired'
  where status = 'active'
    and "expiresAt" < now();

  update public."User" u
  set has_right = false,
      status = 'Suspendu'
  where u."accountType" = 'urgent'
    and u.has_right = true
    and not exists (
      select 1
      from public."UrgentBeneficiary" b
      join public."UrgentAuthorization" a on a."urgentBeneficiaryId" = b.id
      where b."userId" = u.id
        and a.status = 'active'
    );
end;
$function$
