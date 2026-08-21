-- Étape 1 "colis urgent" : exclure les comptes MDS (centre social) du cycle
-- de droits. Un compte MDS n'a pas de date de fin de droits pertinente
-- (end_right est fixé arbitrairement à +100 ans côté AddUserModal, juste
-- pour satisfaire la contrainte NOT NULL) et ne doit jamais recevoir de
-- rappel J-21 ni être suspendu automatiquement.
--
-- Seul changement par rapport à la version précédente : ajout de
-- `AND u."accountType" <> 'mds'` dans les deux boucles (CAS 1 et CAS 2).
-- Comportement inchangé pour tous les comptes bénéficiaires existants.

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
      and u."accountType" <> 'mds'
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
      and u."accountType" <> 'mds'
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
end;
$function$
