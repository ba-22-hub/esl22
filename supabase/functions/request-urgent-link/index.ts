// =============================================================================
// request-urgent-link
// =============================================================================
//
// Renvoie un lien de connexion à un bénéficiaire dont l'autorisation est
// toujours en cours.
//
// Le lien reçu à l'octroi ne vaut que quelques heures, pour des raisons de
// sécurité, alors qu'un chèque d'accompagnement court sur plusieurs semaines.
// Cette fonction permet à la personne d'en obtenir un nouveau sans repasser
// par le centre social.
//
// Deux précautions gouvernent son écriture :
//
//   - Elle ne délivre de lien qu'aux comptes « urgent » disposant d'une
//     autorisation active. Sans cela, elle offrirait à n'importe quel
//     utilisateur du site une connexion sans mot de passe.
//
//   - Elle répond invariablement la même chose, que l'adresse soit connue ou
//     non. Distinguer les deux cas permettrait à quiconque de savoir si telle
//     personne bénéficie de l'aide alimentaire.
//
// Date          Auteur        Description
// ----------    ----------    -------------------------------------------------
// 2026-08-28    Louvel        Création
//
// =============================================================================

import { createClient } from "npm:@supabase/supabase-js";

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

  // Réponse unique, quel que soit le sort réservé à la demande.
  const neutralAnswer = {
    success: true,
    message: "Si un accès est ouvert pour cette adresse, un lien vient d'être envoyé.",
  };

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const siteUrl = Deno.env.get("SITE_URL") ?? "https://esl22.fr";

  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return json(neutralAnswer, corsHeaders);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Le compte doit exister et être de type « urgent ». Un bénéficiaire
    // ordinaire ou un centre social se connecte avec son mot de passe.
    const { data: userRow } = await supabaseAdmin
      .from("User")
      .select("id, accountType, firstName")
      .ilike("email", email)
      .maybeSingle();

    if (!userRow || userRow.accountType !== "urgent") {
      return json(neutralAnswer, corsHeaders);
    }

    const { data: beneficiary } = await supabaseAdmin
      .from("UrgentBeneficiary")
      .select("id, firstName, email")
      .eq("userId", userRow.id)
      .maybeSingle();

    if (!beneficiary) {
      return json(neutralAnswer, corsHeaders);
    }

    const { data: authorization } = await supabaseAdmin
      .from("UrgentAuthorization")
      .select("spendingLimit, spentAmount, expiresAt, status")
      .eq("urgentBeneficiaryId", beneficiary.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Pas d'autorisation en cours, ou échéance dépassée : aucun lien n'est
    // délivré. C'est au centre social d'en accorder une nouvelle.
    if (!authorization || new Date(authorization.expiresAt) < new Date()) {
      return json(neutralAnswer, corsHeaders);
    }

    // Le lien est envoyé à l'adresse enregistrée sur la fiche, jamais à celle
    // saisie dans le formulaire : une différence de casse ou d'alias ne doit
    // pas permettre de détourner l'envoi.
    const targetEmail = (beneficiary.email ?? "").trim();
    if (!targetEmail) {
      return json(neutralAnswer, corsHeaders);
    }

    const { data: linkData, error: generateError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: targetEmail,
      options: { redirectTo: `${siteUrl}/acces-urgent` },
    });

    if (generateError || !linkData?.properties?.action_link) {
      console.error("Génération du lien :", generateError);
      return json(neutralAnswer, corsHeaders);
    }

    const remaining = Math.round(
      (authorization.spendingLimit - authorization.spentAmount) * 100,
    ) / 100;

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/sendmail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          to: targetEmail,
          templateId: INVITATION_TEMPLATE_ID,
          params: {
            FIRSTNAME: beneficiary.firstName || "",
            AMOUNT: formatEuros(remaining),
            EXPIRY_DATE: formatDateFr(authorization.expiresAt),
            ACCESS_LINK: linkData.properties.action_link,
            MDS_NAME: "",
          },
        }),
      });
      if (!res.ok) {
        console.error("Envoi du lien :", await res.text());
      }
    } catch (mailError) {
      console.error("Envoi du lien :", mailError);
    }

    return json(neutralAnswer, corsHeaders);
  } catch (err) {
    console.error("request-urgent-link — erreur inattendue :", err);
    // Même en cas d'incident, la réponse ne révèle rien.
    return json(neutralAnswer, corsHeaders);
  }
});
