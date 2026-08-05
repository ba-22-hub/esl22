const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
Deno.serve(async (req)=>{
  // Gérer le preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed"
    }), {
      status: 405,
      headers: corsHeaders
    });
  }
  try {
    const { to, templateId, params } = await req.json();
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!BREVO_API_KEY) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing BREVO_API_KEY"
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          name: "noreply",
          email: "noreply@esl22.fr"
        },
        to: [
          {
            email: to
          }
        ],
        templateId,
        params
      })
    });
    const data = await resp.json();
    if (!resp.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: data
      }), {
        status: resp.status,
        headers: corsHeaders
      });
    }
    return new Response(JSON.stringify({
      success: true,
      data
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
