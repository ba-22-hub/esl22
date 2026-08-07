// =============================================================================
// HISTORIQUE DES MODIFICATIONS
// =============================================================================
//
// Date          Auteur        Description
// ----------    ----------    -------------------------------------------------
// 2026-06-09    Louvel       Création create-dpd-label-relay from creat-dpd-label
// 2026-06-09    Louvel       Adaptation pour prendre en compte le nouveau payload
//
// =============================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const cleanObject = (obj)=>{
  if (!obj || typeof obj !== "object") return {};
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)){
    if (value !== undefined && value !== null) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info"
};
serve(async (req)=>{
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
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  try {
    // 1. Récupération du body
    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      return new Response(JSON.stringify({
        error: "Invalid JSON input"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // 2. Nettoyage des objets
    const destinataire = cleanObject(body.destinataire);
    const expediteur = cleanObject(body.expediteur);
    const relais = cleanObject(body.relais);
    // 3. Validation des champs obligatoires
    if (!body.poids || !body.shippingdate || !body.referencenumber || !destinataire || Object.keys(destinataire).length === 0 || !expediteur || Object.keys(expediteur).length === 0) {
      return new Response(JSON.stringify({
        error: "Missing required fields: poids, shippingdate, referencenumber, destinataire, or expediteur"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Vérification spécifique pour le mode "relais"
    if (body.mode === "relais" && !relais?.shopid) {
      return new Response(JSON.stringify({
        error: "Missing required field: relais.shopid for mode 'relais'"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // 4. Construction du payload vers le proxy
    const payload = {
      mode: body.mode ?? "classic",
      poids: body.poids,
      shippingdate: body.shippingdate,
      referencenumber: body.referencenumber,
      destinataire,
      expediteur
    };
    // Ajout conditionnel de relais si mode === "relais"
    if (body.mode === "relais") {
      payload.relais = {
        shopid: relais.shopid,
        ...relais.sms && {
          sms: relais.sms
        },
        ...relais.email && {
          email: relais.email
        }
      };
    }
    // 5. URL du proxy via ngrok
    const proxyUrl = Deno.env.get("PROXY_URL") || "http://82.65.27.184:3000/generate-label";
    //const proxyUrl = "https://otter-divided-enviably.ngrok-free.dev/generate-label";
    // 6. Envoi de la requête au proxy
    console.log("📤 Envoi au proxy :", proxyUrl);
    console.log("📦 Payload :", JSON.stringify(payload));
    const response = await fetch(proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify(payload)
    });
    // 7. Gestion de la réponse
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur du proxy:", errorText);
      return new Response(JSON.stringify({
        error: `Erreur du proxy: ${response.status} - ${errorText.substring(0, 200)}`
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // 8. Récupération du PDF
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/pdf")) {
      const pdfBuffer = await response.arrayBuffer();
      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="label-${body.referencenumber}.pdf"`
        }
      });
    } else {
      const text = await response.text();
      return new Response(JSON.stringify({
        success: false,
        error: `Réponse inattendue du proxy (type: ${contentType}): ${text.substring(0, 200)}`
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
  } catch (error) {
    console.error("Erreur dans dpd-create-label-relay:", error);
    return new Response(JSON.stringify({
      error: error.message || "Internal server error"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
