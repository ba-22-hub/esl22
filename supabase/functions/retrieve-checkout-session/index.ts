import Stripe from "npm:stripe@latest";
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info"
};
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
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
    const body = await req.json();
    const { session_id } = body;
    console.log("🔍 Récupération session_id :", session_id);
    if (!session_id) {
      console.error("❌ session_id manquant");
      return new Response(JSON.stringify({
        error: "Missing session_id"
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log("✅ Session Stripe récupérée :", session);
    const cartToValidate = session.metadata?.cart ? JSON.parse(session.metadata.cart) : null;
    return new Response(JSON.stringify({
      payment_status: session.payment_status,
      cartToValidate
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("💥 Erreur récupération session Stripe :", err);
    return new Response(JSON.stringify({
      error: err.message
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
