// =============================================================================
// create-authorized-order
// =============================================================================
//
// Enregistre une commande passée par un bénéficiaire que le centre social a
// autorisé à composer lui-même son panier (étape 2).
//
// Elle diffère de create-urgent-order sur trois points :
//   - l'appelant est le bénéficiaire, non le centre social ;
//   - la dépense est décomptée d'un montant accordé, via une fonction qui
//     verrouille l'autorisation le temps de l'opération ;
//   - la facture revient au centre social, désigné sur la commande plutôt que
//     déduit du compte : une personne peut être aidée successivement par des
//     centres différents, et les factures déjà émises doivent rester justes.
//
// Comme pour les colis urgents, aucun paiement n'est demandé : les prix et
// poids sont donc relus depuis la base plutôt qu'acceptés depuis le client.
//
// Date          Auteur        Description
// ----------    ----------    -------------------------------------------------
// 2026-08-26    Louvel        Création
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

const ADMIN_ALERT_EMAIL = "ba220.epicerie@banquealimentaire.org";
const MDS_ORDER_TEMPLATE_ID = 14;
const BENEFICIARY_ORDER_TEMPLATE_ID = 2;

function json(body: unknown, corsHeaders: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function roundTwoDigits(nb: number) {
  return Math.round(nb * 100) / 100;
}

function formatEuros(value: number) {
  return value.toFixed(2).replace(".", ",");
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
    const body = await req.json();
    const { items, pickupPointId } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return json({ error: "Panier vide ou invalide" }, corsHeaders, 400);
    }

    // --- Identification de l'appelant ----------------------------------------
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
    const beneficiaryUserId = authData.user.id;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userRow, error: userError } = await supabaseAdmin
      .from("User")
      .select("accountType, email, firstName, lastName")
      .eq("id", beneficiaryUserId)
      .single();

    if (userError || !userRow) {
      return json({ error: "Compte introuvable" }, corsHeaders, 403);
    }
    if (userRow.accountType !== "urgent") {
      return json({ error: "Ce parcours est réservé aux bénéficiaires autorisés" }, corsHeaders, 403);
    }

    // --- Autorisation en cours -----------------------------------------------
    const { data: beneficiary, error: beneficiaryError } = await supabaseAdmin
      .from("UrgentBeneficiary")
      .select("id, firstName, lastName, email, phone")
      .eq("userId", beneficiaryUserId)
      .single();

    if (beneficiaryError || !beneficiary) {
      return json({ error: "Fiche introuvable" }, corsHeaders, 403);
    }

    const { data: authorization, error: authorizationError } = await supabaseAdmin
      .from("UrgentAuthorization")
      .select("*")
      .eq("urgentBeneficiaryId", beneficiary.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (authorizationError || !authorization) {
      return json({
        error: "Vous n'avez plus d'aide en cours. Rapprochez-vous du service social qui vous accompagne."
      }, corsHeaders, 403);
    }

    // --- Reconstitution du panier depuis la base ------------------------------
    const quantities = new Map<string, number>();
    for (const item of items) {
      const qty = parseInt(item.quantity, 10);
      if (!item.id || !Number.isFinite(qty) || qty <= 0) {
        return json({ error: "Panier invalide" }, corsHeaders, 400);
      }
      quantities.set(item.id, qty);
    }

    const { data: productsData, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, name, salePrice, weight")
      .in("id", [...quantities.keys()]);

    if (productsError || !productsData || productsData.length !== quantities.size) {
      return json({ error: "Impossible de récupérer les produits du panier" }, corsHeaders, 400);
    }

    const fullCartContent = productsData.map((p) => ({
      id: p.id,
      name: p.name,
      salePrice: parseFloat(p.salePrice),
      weight: parseFloat(p.weight),
      quantity: quantities.get(p.id)!,
      pickupPointId: pickupPointId,
    }));

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
    const totalPrice = roundTwoDigits(cartPrice + shippingCost);

    // --- Décompte du montant accordé -----------------------------------------
    // Effectué avant l'enregistrement : si le solde est insuffisant, aucune
    // commande ne doit exister. La fonction verrouille l'autorisation le temps
    // de l'opération, deux commandes simultanées ne pouvant ainsi dépasser le
    // plafond ensemble.
    const { data: consumeResult, error: consumeError } = await supabaseAdmin.rpc(
      "consume_urgent_authorization",
      { auth_id: authorization.id, amount: totalPrice },
    );

    if (consumeError) {
      console.error("Décompte de l'autorisation :", consumeError);
      return json({ error: "Impossible d'enregistrer la commande" }, corsHeaders, 500);
    }

    if (!consumeResult?.ok) {
      const reason = consumeResult?.reason;
      if (reason === "over_limit") {
        return json({
          error: `Votre commande revient à ${formatEuros(totalPrice)} € (frais de livraison ` +
                 `compris) alors qu'il ne vous reste que ${formatEuros(consumeResult.remaining)} €. ` +
                 `Retirez quelques produits de votre panier.`
        }, corsHeaders, 409);
      }
      if (reason === "expired") {
        return json({
          error: "La date jusqu'à laquelle vous pouviez commander est passée. " +
                 "Rapprochez-vous du service social qui vous accompagne."
        }, corsHeaders, 409);
      }
      return json({
        error: "Vous n'avez plus d'aide en cours. Rapprochez-vous du service social qui vous accompagne."
      }, corsHeaders, 409);
    }

    const remaining = roundTwoDigits(consumeResult.remaining ?? 0);

    // --- Enregistrement de la commande ---------------------------------------
    const { data: insertedCart, error: insertError } = await supabaseAdmin
      .from("cart")
      .insert({
        client_id: beneficiaryUserId,
        content: fullCartContent,
        price: totalPrice,
        delivered: false,
        pickupPoint: pickupPointId,
        isUrgent: true,
        urgentBeneficiaryId: beneficiary.id,
        urgentBeneficiaryName: `${beneficiary.firstName} ${beneficiary.lastName}`,
        urgentAuthorizationId: authorization.id,
        // La facture revient au centre social ayant accordé l'aide.
        billingClientId: authorization.mdsId,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Insertion de la commande :", insertError);
      // Le montant a été décompté mais la commande n'existe pas : on rend le
      // solde pour ne pas pénaliser la personne.
      const { error: refundError } = await supabaseAdmin
        .from("UrgentAuthorization")
        .update({
          spentAmount: authorization.spentAmount,
          status: "active",
        })
        .eq("id", authorization.id);

      if (refundError) {
        console.error("Restitution du solde :", refundError);
      }

      return json({ error: "Impossible d'enregistrer la commande" }, corsHeaders, 500);
    }

    const cartId = insertedCart.id;

    // --- Décrément des stocks ------------------------------------------------
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

    // --- Compteurs du compte -------------------------------------------------
    const { data: counters } = await supabaseAdmin
      .from("User")
      .select("current_weight, current_price, current_order")
      .eq("id", beneficiaryUserId)
      .single();

    if (counters) {
      await supabaseAdmin
        .from("User")
        .update({
          current_weight: (counters.current_weight || 0) + cartWeight + packagingWeight,
          current_price: (counters.current_price || 0) + totalPrice,
          current_order: (counters.current_order || 0) + 1,
        })
        .eq("id", beneficiaryUserId);
    }

    // --- Envois annexes ------------------------------------------------------
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

    const { data: mdsUser } = await supabaseAdmin
      .from("User")
      .select("email, firstName, lastName, address, city, postalCode")
      .eq("id", authorization.mdsId)
      .single();

    if (mdsUser) {
      await callFunction("create-invoice", {
        cartId,
        client: {
          id: authorization.mdsId,
          firstName: mdsUser.firstName,
          lastName: mdsUser.lastName,
          address: mdsUser.address,
          city: mdsUser.city,
          postalCode: mdsUser.postalCode,
        },
        items: fullCartContent,
        shippingCost,
        totalPrice,
      });
    }

    const commandNumber = cartId.slice(0, 8);
    const content = fullCartContent.map((i) => `- ${i.name} x ${i.quantity}<br>`).join("");

    // Le centre social est informé de la dépense engagée et du solde restant :
    // c'est lui qui suit l'enveloppe qu'il a accordée.
    if (mdsUser?.email) {
      await callFunction("sendmail", {
        to: mdsUser.email,
        templateId: MDS_ORDER_TEMPLATE_ID,
        params: {
          BENEFICIARY_NAME: `${beneficiary.firstName} ${beneficiary.lastName}`,
          COMMAND_NUMBER: commandNumber,
          CONTENT: content,
          PRICE: formatEuros(totalPrice),
          REMAINING: formatEuros(remaining),
          SPENDING_LIMIT: formatEuros(authorization.spendingLimit),
        },
      });
    }

    // Confirmation à la personne, avec son point relais.
    if (beneficiary.email) {
      let pickupPoint: Record<string, string> = {};
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/get-pickup-by-id`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ pudoId: pickupPointId }),
        });
        pickupPoint = await res.json();
      } catch (err) {
        console.warn("Point relais non récupéré :", err);
      }

      await callFunction("sendmail", {
        to: beneficiary.email,
        templateId: BENEFICIARY_ORDER_TEMPLATE_ID,
        params: {
          FIRSTNAME: beneficiary.firstName || "Client",
          COMMAND_NUMBER: commandNumber,
          CONTENT: content,
          PRICE: formatEuros(totalPrice),
          PICKUP_POINT_NAME: pickupPoint?.name ?? "",
          PICKUP_POINT_ADDRESS: pickupPoint?.address1
            ? `${pickupPoint.address1} ${pickupPoint.address2 ?? ""}, ${pickupPoint.zipCode} ${pickupPoint.city}`
            : "",
        },
      });
    }

    if (stockErrors.length > 0) {
      await callFunction("sendmail", {
        to: ADMIN_ALERT_EMAIL,
        templateId: 8,
        params: {
          ERRORS: stockErrors.join(" || "),
          CART_ID: cartId,
          CLIENT_EMAIL: userRow.email,
          DATE: new Date().toLocaleDateString("fr-FR"),
        },
      });
    }

    return json({
      success: true,
      cartId,
      remaining,
      stockWarnings: stockErrors.length > 0 ? stockErrors : undefined,
    }, corsHeaders);
  } catch (err) {
    console.error("create-authorized-order — erreur inattendue :", err);
    return json({ error: err instanceof Error ? err.message : "Erreur interne" }, corsHeaders, 500);
  }
});
