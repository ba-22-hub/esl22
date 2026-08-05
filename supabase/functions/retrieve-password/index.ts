import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const VITE_API_URL = Deno.env.get('VITE_API_URL');
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
serve(async (req)=>{
  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
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
    const { email } = body;
    if (!email) {
      return new Response(JSON.stringify({
        error: "Missing email"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const { data: userData, error: userError } = await supabaseAdmin.from('User').select('firstName').eq('email', email).single();
    // Gestion d'erreur si l'utilisateur n'existe pas
    if (userError || !userData) {
      return new Response(JSON.stringify({
        error: "Erreur utilisateur : ",
        details: userError.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: VITE_API_URL + 'reset-password'
      }
    });
    if (error) return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 400
    });
    const resetLink = data.properties.action_link;
    // send mail 
    const { data: mailData, error: mailError } = await supabaseAdmin.functions.invoke("sendmail", {
      body: {
        to: email,
        templateId: 6,
        params: {
          FIRSTNAME: userData.firstName,
          EMAIL: email,
          LINK: resetLink
        }
      }
    });
    if (mailError) {
      return new Response(JSON.stringify({
        error: "Erreur mail",
        details: mailError.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    return new Response(JSON.stringify({
      sent: true
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("create-user error:", err);
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
