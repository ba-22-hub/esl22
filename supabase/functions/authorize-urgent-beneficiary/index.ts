// =============================================================================
// authorize-urgent-beneficiary
// =============================================================================
//
// Autorise un bénéficiaire à composer lui-même son panier, à la demande du
// centre social (MDS) qui l'accompagne.
//
// La fonction :
//   1. vérifie que l'appelant est bien un compte MDS et que la fiche lui
//      appartient (la RLS en juge, via un client porteur de son jeton) ;
//   2. crée si nécessaire le compte de connexion du bénéficiaire — sans mot
//      de passe, l'accès se faisant uniquement par lien ;
//   3. enregistre l'autorisation (plafond, échéance, dispositif) ;
//   4. génère un lien de connexion et l'envoie par courriel, en y joignant le
//      montant accordé et la date limite.
//
// L'envoi passe par Brevo (fonction sendmail) plutôt que par le SMTP intégré
// de Supabase : ce dernier est fortement limité en volume, et son template
// générique ne permettrait pas d'annoncer le montant accordé.
//
// Date          Auteur        Description
// ----------    ----------    -------------------------------------------------
// 2026-08-22    Louvel        Création
//
// =============================================================================

import { createClient } from "npm:@supabase/supabase-js";

// Origines autorisées à appeler cette fonction depuis un navigateur. Refléter
// l'origine reçue sans la filtrer reviendrait à autoriser n'importe quel site,
// et permettrait en outre l'envoi de cookies, que le joker « * » interdit.
const ALLOWED_ORIGINS = [
  "https://esl22.fr",
  "https://test.esl22.fr",
  "http://localhost:5173",
];

function buildCorsHeaders(req: Request) {
  const requestOrigin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(requestOrigin)
      ? requestOrigin
      : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
    "Vary": "Origin",
  };
}

const INVITATION_TEMPLATE_ID = 13;

function json(body: unknown, corsHeaders: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function formatEuros(value: number) {
  return value.toFixed(2).replace(".", ",");
}

function formatDateFr(value: string | Date) {
  return new Date(value).toLocaleDateString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, corsHeaders, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const siteUrl = Deno.env.get("SITE_URL") ?? "https://esl22.fr";

  try {
    const body = await req.json();
    const { urgentBeneficiaryId, type, spendingLimit, expiresAt } = body;

    // --- Contrôles de saisie -------------------------------------------------
    if (!urgentBeneficiaryId) {
      return json({ error: "Bénéficiaire non renseigné" }, corsHeaders, 400);
    }
    if (type !== "colis_urgent" && type !== "cap") {
      return json({ error: "Dispositif inconnu" }, corsHeaders, 400);
    }

    const limit = Number(spendingLimit);
    if (!Number.isFinite(limit) || limit <= 0) {
      return json({ error: "Le montant accordé doit être supérieur à zéro" }, corsHeaders, 400);
    }

    if (!expiresAt) {
      return json({ error: "Date d'échéance non renseignée" }, corsHeaders, 400);
    }
    const expiry = new Date(expiresAt);
    if (Number.isNaN(expiry.getTime()) || expiry <= new Date()) {
      return json({ error: "La date d'échéance doit être dans le futur" }, corsHeaders, 400);
    }

    // --- Identification de l'appelant ----------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Non authentifié" }, corsHeaders, 401);
    }

    const supabaseAsUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authData, error: authError } = await supabaseAsUser.auth.getUser();
    if (authError || !authData?.user) {
      return json({ error: "Session invalide" }, corsHeaders, 401);
    }
    const mdsId = authData.user.id;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: mdsUser, error: mdsError } = await supabaseAdmin
      .from("User")
      .select("accountType, firstName, lastName")
      .eq("id", mdsId)
      .single();

    if (mdsError || !mdsUser) {
      return json({ error: "Compte introuvable" }, corsHeaders, 403);
    }
    if (mdsUser.accountType !== "mds") {
      return json({ error: "Seul un centre social peut accorder une autorisation" }, corsHeaders, 403);
    }

    // La lecture passe par le client utilisateur : si la fiche appartient à un
    // autre centre social, la RLS ne la renvoie pas.
    const { data: beneficiary, error: beneficiaryError } = await supabaseAsUser
      .from("UrgentBeneficiary")
      .select("*")
      .eq("id", urgentBeneficiaryId)
      .single();

    if (beneficiaryError || !beneficiary) {
      return json({ error: "Fiche bénéficiaire introuvable ou non autorisée" }, corsHeaders, 403);
    }

    const email = (beneficiary.email ?? "").trim();
    if (!email) {
      return json({
        error: "Cette personne n'a pas d'adresse électronique. Sans elle, aucun lien " +
               "d'accès ne peut lui être transmis : la commande doit être passée par " +
               "le centre social."
      }, corsHeaders, 400);
    }

    // --- Compte de connexion du bénéficiaire ---------------------------------
    // Créé au premier octroi, réutilisé ensuite. Sans mot de passe : l'accès se
    // fait uniquement par lien. email_confirm évite d'exiger une confirmation
    // que la personne n'a aucun moyen de comprendre.
    let userId: string | null = beneficiary.userId ?? null;

    // La fiche peut ne pas porter de rattachement alors qu'un compte existe
    // déjà pour cette adresse : fiche supprimée puis recréée, ou personne par
    // ailleurs inscrite à l'épicerie. On regarde avant de tenter la création.
    if (!userId) {
      const { data: existing } = await supabaseAdmin
        .from("User")
        .select("id, accountType")
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        if (existing.accountType !== "urgent") {
          return json({
            error: "Cette adresse électronique correspond déjà à un compte de " +
                   "l'épicerie. Une personne inscrite par ailleurs ne peut pas " +
                   "recevoir d'autorisation par ce biais : la commande doit être " +
                   "passée par le centre social.",
          }, corsHeaders, 409);
        }
        // Compte urgent préexistant : on le réutilise plutôt que d'en créer un
        // second, ce que l'unicité de l'adresse interdirait de toute façon.
        userId = existing.id;
        await supabaseAdmin
          .from("UrgentBeneficiary")
          .update({ userId })
          .eq("id", beneficiary.id);
      }
    }

    if (!userId) {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
      });

      if (createError || !created?.user) {
        console.error("Création du compte bénéficiaire :", createError);
        // Compte d'authentification sans ligne applicative : reliquat d'une
        // tentative interrompue. Il faut le supprimer côté Supabase avant de
        // pouvoir réessayer, l'adresse étant déjà prise.
        const message = createError?.code === "email_exists"
          ? "Un accès incomplet subsiste pour cette adresse électronique. " +
            "Signalez-le à l'administrateur du site avant de réessayer."
          : "Impossible de créer l'accès de cette personne";
        return json({
          error: message,
          details: createError?.message,
        }, corsHeaders, 500);
      }

      userId = created.user.id;

      // Ligne applicative correspondante. Les coordonnées sont reprises de la
      // fiche, qui reste la source de référence : le centre social la tient à
      // jour, la personne ne modifie rien.
      const { error: insertUserError } = await supabaseAdmin.from("User").insert({
        id: userId,
        accountType: "urgent",
        gender: "Autre",
        firstName: beneficiary.firstName,
        lastName: beneficiary.lastName,
        phone: beneficiary.phone,
        email,
        address: beneficiary.address ?? "",
        addAddress: beneficiary.addAddress,
        city: beneficiary.city ?? "",
        postalCode: beneficiary.postalCode ?? "",
        // Hors cycle de droits : jamais relancé, jamais suspendu
        // automatiquement. C'est l'autorisation qui borne l'accès.
        has_right: true,
        end_right: expiry.toISOString().slice(0, 10),
        // Quotas laissés à NULL (illimité) : la dépense est bornée par le
        // plafond de l'autorisation, pas par un quota mensuel.
        weight_limit: null,
        price_limit: null,
        order_limit: null,
      });

      if (insertUserError) {
        // Le compte d'authentification existerait sans ligne applicative :
        // on annule pour ne pas laisser d'orphelin.
        await supabaseAdmin.auth.admin.deleteUser(userId).catch((e) =>
          console.warn("Annulation de la création du compte :", e)
        );
        console.error("Insertion User :", insertUserError);
        return json({
          error: "Impossible de créer l'accès de cette personne",
          details: insertUserError.message,
        }, corsHeaders, 500);
      }

      const { error: linkError } = await supabaseAdmin
        .from("UrgentBeneficiary")
        .update({ userId })
        .eq("id", beneficiary.id);

      if (linkError) {
        console.error("Rattachement fiche/compte :", linkError);
      }
    }

    // --- Autorisation --------------------------------------------------------
    // Un index unique partiel n'admet qu'une seule autorisation active par
    // bénéficiaire : deux plafonds concurrents n'auraient pas de sens.
    const { data: authorization, error: authorizationError } = await supabaseAdmin
      .from("UrgentAuthorization")
      .insert({
        urgentBeneficiaryId: beneficiary.id,
        mdsId,
        type,
        spendingLimit: limit,
        expiresAt: expiry.toISOString(),
        status: "active",
      })
      .select("id")
      .single();

    if (authorizationError) {
      if (authorizationError.code === "23505") {
        return json({
          error: "Cette personne dispose déjà d'une autorisation en cours. " +
                 "Annulez-la avant d'en accorder une nouvelle."
        }, corsHeaders, 409);
      }
      console.error("Création de l'autorisation :", authorizationError);
      return json({ error: "Impossible d'enregistrer l'autorisation" }, corsHeaders, 500);
    }

    // Le compte peut avoir été fermé à l'expiration d'une autorisation
    // précédente, ou porter l'échéance d'une aide antérieure plus courte : on
    // le réouvre et on l'aligne sur la nouvelle autorisation. Sans cela, une
    // personne ayant reçu un colis urgent puis un chèque resterait bloquée sur
    // l'échéance des 48 heures.
    const { error: reactivateError } = await supabaseAdmin
      .from("User")
      .update({
        has_right: true,
        status: "Actif",
        end_right: expiry.toISOString().slice(0, 10),
      })
      .eq("id", userId);

    if (reactivateError) {
      console.warn("Réactivation du compte bénéficiaire :", reactivateError.message);
    }

    // --- Lien de connexion ---------------------------------------------------
    const { data: linkData, error: generateError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${siteUrl}/acces-urgent` },
    });

    if (generateError || !linkData?.properties?.action_link) {
      console.error("Génération du lien :", generateError);
      // L'autorisation est enregistrée mais le courriel n'est pas parti : la
      // personne pourra demander un lien depuis la page d'accès.
      return json({
        success: true,
        authorizationId: authorization.id,
        mailSent: false,
        warning: "L'autorisation est enregistrée, mais le courriel n'a pas pu être envoyé.",
      }, corsHeaders);
    }

    // --- Courriel ------------------------------------------------------------
    let mailSent = true;
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/sendmail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          to: email,
          templateId: INVITATION_TEMPLATE_ID,
          params: {
            FIRSTNAME: beneficiary.firstName || "",
            AMOUNT: formatEuros(limit),
            EXPIRY_DATE: formatDateFr(expiry),
            ACCESS_LINK: linkData.properties.action_link,
            MDS_NAME: `${mdsUser.firstName ?? ""} ${mdsUser.lastName ?? ""}`.trim(),
          },
        }),
      });
      const text = await res.text();
      if (!res.ok) {
        mailSent = false;
        console.error("Envoi du courriel d'invitation :", text);
      }
    } catch (mailError) {
      mailSent = false;
      console.error("Envoi du courriel d'invitation :", mailError);
    }

    return json({
      success: true,
      authorizationId: authorization.id,
      mailSent,
      warning: mailSent
        ? undefined
        : "L'autorisation est enregistrée, mais le courriel n'a pas pu être envoyé. " +
          "La personne peut demander un lien depuis la page d'accès.",
    }, corsHeaders);
  } catch (err) {
    console.error("authorize-urgent-beneficiary — erreur inattendue :", err);
    return json({ error: err instanceof Error ? err.message : "Erreur interne" }, corsHeaders, 500);
  }
});
