// Version figée : « latest » a introduit une rupture lors d'un simple
// redéploiement, les moyens de paiement n'étant plus déclarés ici mais dans
// le tableau de bord Stripe.
import Stripe from "npm:stripe@23.0.0";
import { createClient } from "npm:@supabase/supabase-js";

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
    const body = await req.json();
    console.log("📦 Requête reçue :", body);
    const { cart, pickupPointId, shippingCost, successUrl, cancelUrl, userId } = body; // ✅ Ajouté pickupPointId
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      console.error("❌ Panier vide ou invalide :", cart);
      return new Response(JSON.stringify({
        error: "Panier vide ou invalide"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Le panier est déposé en base avant la redirection : Stripe limite chaque
    // valeur de métadonnée à 500 caractères, et une dizaine d'articles suffisait
    // à dépasser cette limite. Seule la référence de cette ligne lui est
    // transmise — 36 caractères, quel que soit le nombre d'articles.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: pending, error: pendingError } = await supabaseAdmin
      .from("PendingCheckout")
      .insert({
        client_id: userId,
        items: cart.map((p) => ({ id: p.id, qty: p.quantity })),
        pickupPointId: pickupPointId
      })
      .select("id")
      .single();

    if (pendingError || !pending) {
      console.error("💥 Dépôt du panier impossible :", pendingError);
      return new Response(JSON.stringify({
        error: "Impossible de préparer le paiement"
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    const session = await stripe.checkout.sessions.create({
      // payment_method_types n'est plus accepté : les moyens de paiement se
      // règlent désormais depuis le tableau de bord Stripe.
      allow_promotion_codes: false,
      mode: "payment",
      customer_creation: "if_required",
      line_items: cart.map((item)=>({
          price_data: {
            currency: "eur",
            product_data: {
              name: item.name
            },
            unit_amount: Math.round(item.salePrice * 100)
          },
          quantity: item.quantity
        })),
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: Math.round(shippingCost * 100),
              currency: "eur"
            },
            display_name: "Participation solidaire aux frais de livraison"
          }
        }
      ],
      payment_intent_data: {
        setup_future_usage: undefined
      },
      // 3. Désactiver les options de sauvegarde automatique comme Link (si activées par défaut)
      payment_method_options: {
        card: {
          request_three_d_secure: "any"
        }
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: "fr",
      metadata: {
        // Référence du panier déposé en base. Taille fixe, donc jamais de
        // dépassement de la limite imposée par Stripe.
        pending_checkout_id: pending.id
      }
    });
    console.log("✅ Session Stripe créée :", session.url);
    return new Response(JSON.stringify({
      url: session.url
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("💥 Erreur Stripe ou serveur :", err);
    return new Response(JSON.stringify({
      error: err.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
