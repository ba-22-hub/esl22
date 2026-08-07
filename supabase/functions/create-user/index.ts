import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
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
    // Init admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    // Generate password
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%(){}[]=+-&";
    const pass = Array.from({
      length: 12
    }, ()=>charset.charAt(Math.floor(Math.random() * charset.length))).join("");
    // 1. Créer le user dans auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: newUser.email,
      password: pass,
      email_confirm: true
    });
    if (authError) {
      console.error("Auth error:", authError.message);
      return new Response(JSON.stringify({
        error: "Erreur Auth",
        details: authError.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // 2. Insérer dans la table User
    const { error: dbError } = await supabaseAdmin.from("User").insert([
      {
        ...newUser,
        id: authData.user.id
      }
    ]);
    if (dbError) {
      console.error("DB error:", dbError.message);
      // Rollback : supprimer le ghost user auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id).catch((e)=>console.warn("Rollback deleteUser failed:", e));
      return new Response(JSON.stringify({
        error: "Erreur DB",
        details: dbError.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
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
