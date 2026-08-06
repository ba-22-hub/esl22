// supabase/functions/create-invoice/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import autoTable from "https://esm.sh/jspdf-autotable@3.8.1";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_ALERT_EMAIL");
const ADMIN_ALERT_TEMPLATE_ID = Number(Deno.env.get("ADMIN_ALERT_TEMPLATE_ID"));

// --- CORS ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://www.esl22.fr",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function notifyAdminFailure(cartId, reason) {
  try {
    const timestamp = new Date().toLocaleString("fr-FR", {
      timeZone: "Europe/Paris",
      dateStyle: "short",
      timeStyle: "medium"
    });
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to: [{ email: ADMIN_EMAIL }],
        templateId: ADMIN_ALERT_TEMPLATE_ID,
        params: {
          CART_ID: cartId.slice(0, 8),
          FULL_CART_ID: cartId,
          REASON: reason,
          TIMESTAMP: timestamp
        }
      })
    });
  } catch (e) {
    console.error("Échec de l'envoi de l'alerte admin :", e.message);
  }
}

serve(async (req) => {
  // 1. Répondre au preflight AVANT toute autre logique
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let cartId = "unknown";
  try {
    const body = await req.json();
    cartId = body.cartId;
    const { client, items, shippingCost, totalPrice } = body;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    const doc = new jsPDF();
    doc.text("Facture BA22 - ESL22", 14, 20);
    doc.text(`Commande n° ${cartId.slice(0, 8)}`, 14, 30);
    doc.text(`${client.firstName} ${client.lastName}`, 14, 40);
    doc.text(`${client.address}, ${client.postalCode} ${client.city}`, 14, 46);
    autoTable(doc, {
      startY: 55,
      head: [["Produit", "Qté", "Prix unitaire", "Total"]],
      body: items.map((item) => [
        item.name,
        item.quantity,
        `${item.salePrice.toFixed(2)} €`,
        `${(item.salePrice * item.quantity).toFixed(2)} €`
      ])
    });

    const finalY = doc.lastAutoTable.finalY || 60;
    doc.text(`Frais de livraison : ${shippingCost.toFixed(2)} €`, 14, finalY + 10);
    doc.text(`Total : ${totalPrice.toFixed(2)} €`, 14, finalY + 18);

    const pdfBytes = doc.output("arraybuffer");
    const fileName = `${client.id}/facture-${cartId}.pdf`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("invoices")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true
      });

    if (uploadError) {
      await notifyAdminFailure(cartId, `Upload échoué : ${uploadError.message}`);
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from("cart")
      .update({ invoiceFileName: fileName })
      .eq("id", cartId);

    if (updateError) {
      await notifyAdminFailure(cartId, `Mise à jour cart échouée : ${updateError.message}`);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ fileName }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error(`[create-invoice] Exception pour cartId=${cartId} :`, e.message, e.stack);
    await notifyAdminFailure(cartId, `Exception : ${e.message}`);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
