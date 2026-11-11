// =============================================================================
// HISTORIQUE DES MODIFICATIONS
// =============================================================================
//
// Date          Auteur        Description
// ----------    ----------    -------------------------------------------------
// 2026-11-02    Louvel       Messages d'erreur lisibles (adresse déjà utilisée,
//                            doublon en base) ; mot de passe généré avec
//                            crypto.getRandomValues au lieu de Math.random
// 2026-11-10    Louvel       Sécurité : seul un administrateur connecté (table Admins)
//                            peut créer un compte (401/403 sinon) ; seuls les champs
//                            autorisés de newUser sont insérés dans "User" ;
//                            ajout validation_org, validation_person, user_message.
//
// =============================================================================
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";
const jsonResponse = (payload, status)=>new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
// Champs de "User" que le formulaire d'inscription (AddUserModal) a le droit de renseigner.
// Tout autre champ envoyé (status, current_weight, reminder_sent_at...) est ignoré.
const ALLOWED_FIELDS = [
  "accountType",
  "gender",
  "firstName",
  "lastName",
  "phone",
  "email",
  "address",
  "addAddress",
  "city",
  "postalCode",
  "start_right",
  "end_right",
  "weight_limit",
  "order_limit",
  "price_limit",
  "has_right",
  "validation_org",
  "validation_person",
  "user_message"
];
// Champs texte facultatifs : chaîne vide → NULL
const NULLABLE_TEXT_FIELDS = [
  "validation_org",
  "validation_person",
  "user_message"
];
const pickAllowedFields = (src)=>{
  const out = {};
  for (const key of ALLOWED_FIELDS){
    if (!(key in src)) continue;
    let value = src[key];
    if (NULLABLE_TEXT_FIELDS.includes(key)) {
      value = typeof value === "string" && value.trim() !== "" ? value.trim() : null;
    }
    out[key] = value;
  }
  return out;
};
serve(async (req)=>{
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed"
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  try {
    // Init admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    // 0. Vérifier que l'appelant est un administrateur connecté
    //    (la clé anon publique ou un compte bénéficiaire ne suffisent pas)
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) {
      return jsonResponse({
        error: "Authentification requise"
      }, 401);
    }
    const { data: callerData, error: callerError } = await supabaseAdmin.auth.getUser(token);
    if (callerError || !callerData?.user) {
      return jsonResponse({
        error: "Session invalide ou expirée, reconnectez-vous."
      }, 401);
    }
    const { data: adminRow, error: adminError } = await supabaseAdmin.from("Admins").select("id").eq("id", callerData.user.id).maybeSingle();
    if (adminError) {
      console.error("Admin check error:", adminError.message);
      return jsonResponse({
        error: "Vérification des droits impossible"
      }, 500);
    }
    if (!adminRow) {
      console.warn("create-user refusé pour un non-admin:", callerData.user.id);
      return jsonResponse({
        error: "Action réservée aux administrateurs"
      }, 403);
    }
    // Parse body
    let body;
    try {
      body = await req.json();
    } catch  {
      return new Response(JSON.stringify({
        error: "Body invalide"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const { newUser } = body;
    if (!newUser) {
      return new Response(JSON.stringify({
        error: "Missing user"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Generate password
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%(){}[]=+-&";
    // crypto.getRandomValues : aléatoire cryptographique (Math.random est prévisible)
    const randomValues = crypto.getRandomValues(new Uint32Array(12));
    const pass = Array.from(randomValues, (v)=>charset.charAt(v % charset.length)).join("");
    // 1. Créer le user dans auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: newUser.email,
      password: pass,
      email_confirm: true
    });
    if (authError) {
      console.error("Auth error:", authError.code, authError.message);
      // Adresse déjà utilisée par un compte existant
      if (authError.code === "email_exists" || /already (been )?registered/i.test(authError.message)) {
        return jsonResponse({
          error: `L'adresse ${newUser.email} est déjà utilisée par un autre compte.`,
          details: authError.message
        }, 409);
      }
      if (authError.code === "email_address_invalid" || /invalid.*email|email.*invalid/i.test(authError.message)) {
        return jsonResponse({
          error: `L'adresse ${newUser.email} n'est pas valide.`,
          details: authError.message
        }, 400);
      }
      return jsonResponse({
        error: `Erreur lors de la création du compte : ${authError.message}`,
        details: authError.message
      }, authError.status && authError.status >= 400 ? authError.status : 500);
    }
    // 2. Insérer dans la table User
    const { error: dbError } = await supabaseAdmin.from("User").insert([
      {
        ...pickAllowedFields(newUser),
        id: authData.user.id
      }
    ]);
    if (dbError) {
      console.error("DB error:", dbError.message);
      // Rollback : supprimer le ghost user auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id).catch((e)=>console.warn("Rollback deleteUser failed:", e));
      // 23505 = violation d'unicité (doublon)
      if (dbError.code === "23505") {
        return jsonResponse({
          error: "Un utilisateur existe déjà avec ces informations.",
          details: dbError.message
        }, 409);
      }
      return jsonResponse({
        error: `Erreur lors de l'enregistrement de l'utilisateur : ${dbError.message}`,
        details: dbError.message
      }, 500);
    }
    // 3. Envoyer le mail de bienvenue via fetch direct (évite l'EarlyDrop causé par functions.invoke)
    const mailController = new AbortController();
    const mailTimeout = setTimeout(()=>mailController.abort(), 5000);
    try {
      const mailRes = await fetch(`${supabaseUrl}/functions/v1/sendmail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({
          to: newUser.email,
          templateId: 1,
          params: {
            FIRSTNAME: newUser.firstName,
            EMAIL: newUser.email,
            PASSWORD: pass
          }
        }),
        signal: mailController.signal
      });
      // Consommer le body pour libérer la connexion
      const mailBody = await mailRes.text();
      if (!mailRes.ok) {
        console.error("Erreur envoi mail:", mailBody);
      }
    } catch (mailErr) {
      // L'user est créé — on logue sans faire échouer la requête
      console.error("Erreur fetch sendmail:", mailErr);
    } finally{
      clearTimeout(mailTimeout);
    }
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("create-user unhandled error:", err);
    return new Response(JSON.stringify({
      error: "Internal server error"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
