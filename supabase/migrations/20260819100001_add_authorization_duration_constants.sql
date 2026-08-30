-- Durées de validité des autorisations, exprimées en heures pour éviter de
-- mélanger les unités.
--
--   urgentAuthHours : durée d'un colis urgent. Valeur système, appliquée
--                     telle quelle, non modifiable au cas par cas.
--
--   capDefaultHours : durée proposée par défaut lors de l'octroi d'un CAP.
--                     Le centre social l'ajuste selon la date figurant sur le
--                     chèque, dont la validité varie d'un dispositif à l'autre.
--
-- Toutes deux modifiables depuis l'écran d'administration des paramètres,
-- sans redéploiement.

INSERT INTO "constants" (name, value, unit)
VALUES
  ('urgentAuthHours', 48, 'h'),
  ('capDefaultHours', 720, 'h');
