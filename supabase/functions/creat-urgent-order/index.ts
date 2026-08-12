// =============================================================================
// create-urgent-order
// =============================================================================
//
// Enregistre une commande « colis urgent » passée par un centre social (MDS)
// au nom d'un bénéficiaire, sans passage par Stripe : ces commandes sont
// prises en charge par le centre social, le paiement en ligne est écarté.
//
// Cette fonction reprend le traitement effectué par PaymentSuccess.jsx après
// un paiement classique (insertion du panier, décrément des stocks, mise à
// jour des compteurs, facture, e-mails), à ceci près qu'aucun paiement ne
// vient attester de la validité de la commande. Les prix et poids sont donc
// relus depuis la base plutôt qu'acceptés depuis le client, et l'appartenance
// de la fiche bénéficiaire au MDS appelant est vérifiée.
//
// Date          Auteur        Description
// ----------    ----------    -------------------------------------------------
// 2026-08-12    Louvel        Création
//
// =============================================================================

import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

const ADMIN_ALERT_EMAIL = "ba220.epicerie@banquealimentaire.org";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function roundTwoDigits(nb: number) {
  return Math.round(nb * 100) / 100;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const body = await req.json();
    const { items, pickupPointId, urgentBeneficiaryId } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return json({ error: "Panier vide ou invalide" }, 400);
    }
    if (!urgentBeneficiaryId) {
      return json({ error: "Bénéficiaire non renseigné" }, 400);
    }

    // --- Identification de l'appelant ----------------------------------------
    // On utilise un client porteur du JWT de l'utilisateur : cela permet à la
    // fois d'identifier l'appelant et de laisser la RLS vérifier que la fiche
    // bénéficiaire lui appartient bien.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Non authentifié" }, 401);
    }

    const supabaseAsUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authData, error: authError } = await supabaseAsUser.auth.getUser();
    if (authError || !authData?.user) {
      return json({ error: "Session invalide" }, 401);
    }
    const mdsId = authData.user.id;

    // --- Contrôles d'habilitation --------------------------------------------
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: mdsUser, error: mdsError } = await supabaseAdmin
      .from("User")
      .select("accountType, email, firstName, lastName, current_weight, current_price, current_order, address, city, postalCode")
      .eq("id", mdsId)
      .single();

    if (mdsError || !mdsUser) {
      return json({ error: "Compte introuvable" }, 403);
    }
    if (mdsUser.accountType !== "mds") {
      return json({ error: "Seul un centre social peut passer une commande urgente" }, 403);
    }

    // La lecture passe par le client utilisateur : si la fiche appartient à un
    // autre MDS, la RLS ne la renvoie pas et la commande est refusée.
    const { data: beneficiary, error: beneficiaryError } = await supabaseAsUser
      .from("UrgentBeneficiary")
      .select("id, firstName, lastName, phone, email")
      .eq("id", urgentBeneficiaryId)
      .single();

    if (beneficiaryError || !beneficiary) {
      return json({ error: "Fiche bénéficiaire introuvable ou non autorisée" }, 403);
    }

    // --- Reconstitution du panier depuis la base ------------------------------
    // Les prix et poids ne sont jamais repris du client : sans paiement pour
    // les attester, ils doivent venir de la table products.
    const quantities = new Map<string, number>();
    for (const item of items) {
      const qty = parseInt(item.quantity, 10);
      if (!item.id || !Number.isFinite(qty) || qty <= 0) {
        return json({ error: "Panier invalide" }, 400);
      }
      quantities.set(item.id, qty);
    }

    const { data: productsData, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, name, salePrice, weight")
      .in("id", [...quantities.keys()]);

    if (productsError || !productsData || productsData.length !== quantities.size) {
      return json({ error: "Impossible de récupérer les produits du panier" }, 400);
    }

    const fullCartContent = productsData.map((p) => ({
      id: p.id,
      name: p.name,
      salePrice: parseFloat(p.salePrice),
      weight: parseFloat(p.weight),
      quantity: quantities.get(p.id)!,
      pickupPointId: pickupPointId,
    }));

    // --- Constantes ----------------------------------------------------------
    const { data: constants } = await supabaseAdmin
      .from("constants")
      .select("name, value")
      .in("name", ["shippingCost", "packagingWeight"]);

    const shippingCost =
      parseFloat(constants?.find((c) => c.name === "shippingCost")?.value) || 1.35;
    const packagingWeight =
      parseFloat(constants?.find((c) => c.name === "packagingWeight")?.value) || 300;

    const cartWeight = roundTwoDigits(
      fullCartContent.reduce((total, p) => total + p.weight * p.quantity, 0),
    );
    const cartPrice = roundTwoDigits(
      fullCartContent.reduce((total, p) => total + p.salePrice * p.quantity, 0),
    );

    // --- Enregistrement de la commande ---------------------------------------
    // urgentBeneficiaryName est un instantané : il doit rester lisible même si
    // la fiche est modifiée ou supprimée par la suite.
    const { data: insertedCart, error: insertError } = await supabaseAdmin
      .from("cart")
      .insert({
        client_id: mdsId,
        content: fullCartContent,
        price: roundTwoDigits(cartPrice + shippingCost),
        delivered: false,
        pickupPoint: pickupPointId,
        isUrgent: true,
        urgentBeneficiaryId: beneficiary.id,
        urgentBeneficiaryName: `${beneficiary.firstName} ${beneficiary.lastName}`,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Erreur d'insertion de la commande urgente :", insertError);
      return json({ error: "Échec de l'enregistrement de la commande", details: insertError.message }, 500);
    }

    const cartId = insertedCart.id;

    // --- Décrément des stocks ------------------------------------------------
    // Un échec de stock ne doit pas annuler la commande déjà enregistrée : on
    // alerte l'équipe et on poursuit (même politique que le flux classique).
    const stockResults = await Promise.allSettled(
      fullCartContent.map(async (product) => {
        const { error } = await supabaseAdmin.rpc("decrement_stock", {
          product_id_input: product.id,
          quantity_input: product.quantity,
        });
        if (error) throw new Error(`${product.name} : ${error.message}`);
      }),
    );

    const stockErrors = stockResults
      .filter((r) => r.status === "rejected")
      .map((r) => (r as PromiseRejectedResult).reason?.message || "Erreur inconnue");

    // --- Compteurs du compte MDS ---------------------------------------------
    const { error: countersError } = await supabaseAdmin
      .from("User")
      .update({
        current_weight: (mdsUser.current_weight || 0) + cartWeight + packagingWeight,
        current_price: (mdsUser.current_price || 0) + cartPrice + shippingCost,
        current_order: (mdsUser.current_order || 0) + 1,
      })
      .eq("id", mdsId);

    if (countersError) {
      console.warn("Échec de mise à jour des compteurs :", countersError.message);
    }

    // --- Envois annexes ------------------------------------------------------
    // Facture et e-mails sont en best-effort : la commande est enregistrée, un
    // échec ici ne doit pas la remettre en cause.
    const callFunction = (name: string, payload: unknown) =>
      fetch(`${supabaseUrl}/functions/v1/${name}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify(payload),
      })
        .then((res) => res.text())
        .catch((err) => console.error(`Échec de l'appel à ${name} :`, err));

    // Facture attribuée au centre social, qui prend la commande en charge.
    await callFunction("create-invoice", {
      cartId,
      client: {
        id: mdsId,
        firstName: mdsUser.firstName,
        lastName: mdsUser.lastName,
        address: mdsUser.address,
        city: mdsUser.city,
        postalCode: mdsUser.postalCode,
      },
      items: fullCartContent,
      shippingCost,
      totalPrice: roundTwoDigits(cartPrice + shippingCost),
    });

    // Confirmation au centre social, et au bénéficiaire si son adresse mail
    // est connue (elle est facultative sur la fiche).
    const mailParams = {
      COMMAND_NUMBER: cartId.slice(0, 8),
      CONTENT: fullCartContent.map((i) => `- ${i.name} x ${i.quantity}<br>`).join(""),
      PRICE: roundTwoDigits(cartPrice + shippingCost).toFixed(2).replace(".", ","),
    };

    const recipients = [
      { email: mdsUser.email, firstName: mdsUser.firstName || "Centre social" },
    ];
    if (beneficiary.email) {
      recipients.push({ email: beneficiary.email, firstName: beneficiary.firstName || "Client" });
    }

    await Promise.all(
      recipients.map((r) =>
        callFunction("sendmail", {
          to: r.email,
          templateId: 2,
          params: { ...mailParams, FIRSTNAME: r.firstName },
        }),
      ),
    );

    if (stockErrors.length > 0) {
      await callFunction("sendmail", {
        to: ADMIN_ALERT_EMAIL,
        templateId: 8,
        params: {
          ERRORS: stockErrors.join(" || "),
          CART_ID: cartId,
          CLIENT_EMAIL: mdsUser.email,
          DATE: new Date().toLocaleDateString("fr-FR"),
        },
      });
    }

    return json({
      success: true,
      cartId,
      stockWarnings: stockErrors.length > 0 ? stockErrors : undefined,
    });
  } catch (err) {
    console.error("create-urgent-order — erreur inattendue :", err);
    return json({ error: err instanceof Error ? err.message : "Erreur interne" }, 500);
  }
});
