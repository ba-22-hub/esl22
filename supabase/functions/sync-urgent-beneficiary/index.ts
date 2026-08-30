// =============================================================================
// sync-urgent-beneficiary
// =============================================================================
//
// Répercute sur le compte de connexion les coordonnées modifiées sur la fiche
// d'un bénéficiaire.
//
// La fiche est la source de référence : c'est le centre social qui la tient à
// jour, la personne ne modifie rien. Le compte, lui, alimente l'étiquette de
// transport et la notification du transporteur — une adresse restée périmée
// enverrait le colis au mauvais endroit.
//
// Le changement d'adresse électronique demande un traitement particulier :
// elle sert d'identifiant de connexion et vit dans auth.users, qu'une simple
// écriture applicative ne touche pas. Sans cette reprise, les liens suivants
// partiraient à l'ancienne adresse.
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

function json(body: unknown, corsHeaders: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
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

  try {
    const { urgentBeneficiaryId } = await req.json();
    if (!urgentBeneficiaryId) {
      return json({ error: "Bénéficiaire non renseigné" }, corsHeaders, 400);
    }

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

    // La lecture passe par le client utilisateur : la RLS garantit que la
    // fiche appartient bien au centre social appelant.
    const { data: beneficiary, error: beneficiaryError } = await supabaseAsUser
      .from("UrgentBeneficiary")
      .select("*")
      .eq("id", urgentBeneficiaryId)
      .single();

    if (beneficiaryError || !beneficiary) {
      return json({ error: "Fiche introuvable ou non autorisée" }, corsHeaders, 403);
    }

    // Tant que la personne n'a jamais été autorisée, il n'y a pas de compte à
    // mettre à jour : la fiche se suffit à elle-même.
    if (!beneficiary.userId) {
      return json({ success: true, synced: false }, corsHeaders);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: account } = await supabaseAdmin
      .from("User")
      .select("email")
      .eq("id", beneficiary.userId)
      .single();

    const newEmail = (beneficiary.email ?? "").trim();
    const emailChanged = newEmail !== "" &&
      newEmail.toLowerCase() !== (account?.email ?? "").toLowerCase();

    // L'adresse de connexion doit être reprise dans auth.users, faute de quoi
    // les liens suivants partiraient à l'ancienne adresse.
    if (emailChanged) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        beneficiary.userId,
        { email: newEmail, email_confirm: true },
      );

      if (authUpdateError) {
        console.error("Reprise de l'adresse de connexion :", authUpdateError);
        return json({
          error: authUpdateError.code === "email_exists"
            ? "Cette adresse électronique est déjà utilisée par un autre compte."
            : "L'adresse électronique n'a pas pu être reprise sur l'accès de cette personne.",
        }, corsHeaders, 409);
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from("User")
      .update({
        firstName: beneficiary.firstName,
        lastName: beneficiary.lastName,
        phone: beneficiary.phone,
        email: newEmail || account?.email,
        address: beneficiary.address ?? "",
        addAddress: beneficiary.addAddress,
        city: beneficiary.city ?? "",
        postalCode: beneficiary.postalCode ?? "",
      })
      .eq("id", beneficiary.userId);

    if (updateError) {
      console.error("Mise à jour du compte :", updateError);
      return json({ error: "Les coordonnées n'ont pas pu être reportées" }, corsHeaders, 500);
    }

    return json({ success: true, synced: true, emailChanged }, corsHeaders);
  } catch (err) {
    console.error("sync-urgent-beneficiary — erreur inattendue :", err);
    return json({ error: err instanceof Error ? err.message : "Erreur interne" }, corsHeaders, 500);
  }
});
