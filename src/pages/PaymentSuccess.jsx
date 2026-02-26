// Importing dependencies
import { useEffect, useRef, useState } from "react";
import { supabase } from "@lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useCart } from "@context/CartContext.jsx";
import { displayNotification } from '@lib/displayNotification.jsx';

// Importing common components
import Loading from "@common/Loading.jsx";

function PaymentSuccess() {
    const navigate = useNavigate();
    const hasRun = useRef(false);
    const { setCart } = useCart();
    const [isProcessing, setIsProcessing] = useState(true);
    const [shippingCost, setShippingCost] = useState(1.35) // État pour les frais de port
    const shippingCostFetched = useRef(false)

    function roundTwoDigits(nb) {
        return Math.round(nb * 100) / 100
    }

    useEffect(() => {
            if (shippingCostFetched.current) return;
    
            const fetchShippingCost = async () => {
                const { data, error } = await supabase
                    .from('constants')
                    .select('value')
                    .eq("name", "shippingCost")
                    .maybeSingle();
                if (!error && data) {
                    setShippingCost(data.value)
                    shippingCostFetched.current = true
                }
            };
    
            fetchShippingCost();
        }, []);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        // Creating the label
        const createAndInsertLabel = async (cartId) => {
            try {
                const { data, error } = await supabase.functions.invoke('dpd_create_label', {
                    body: JSON.stringify({
                        cartId: cartId
                    })
                })
                if (error) {
                    throw new Error(error)
                } else {
                    // Inserting useful label datas associated to cart in database
                    const { error: labelError } = await supabase
                        .from("cart")
                        .update({ orderReference: data.orderReference, trackingUrl: data.trackingUrl })
                        .eq('id', cartId)

                    if (labelError) {
                        displayNotification("Échec de l'enregistrement des références de votre colis", labelError.message, "danger")
                        console.error("Échec de l'enregistrement des références de votre colis", labelError.message)
                    }
                }
            } catch (e) {
                displayNotification("Erreur lors de la création de l'étiquette associée à votre colis", e.message, "danger")
                console.error("Erreur lors de la création de l'étiquette:", e)
            }
        };

        const confirmPayment = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const session_id = urlParams.get("session_id");

                if (!session_id) {
                    console.error("❌ Aucun session_id dans l'URL");
                    displayNotification("Erreur", "Aucune session de paiement trouvée", "danger");
                    navigate("/cart");
                    return;
                }

                console.log("🔍 Vérification paiement pour session :", session_id);

                // Invoke the Supabase edge function to retrieve the checkout session
                const { data, error } = await supabase.functions.invoke("retrieve-checkout-session", {
                    body: { session_id }
                });

                console.log("📦 Données retournées par retrieve-checkout-session :", data);

                if (error) {
                    console.error("💥 Erreur récupération session Stripe :", error);
                    displayNotification("Erreur", "Impossible de récupérer les informations de paiement", "danger");
                    navigate("/cart");
                    return;
                }

                if (data?.payment_status === "paid" && data?.cartToValidate) {
                    console.log("✅ Paiement validé, insertion dans la base...");
                    displayNotification("Paiement validé", "Votre commande est en cours de traitement", "success")

                    const cartMetadata = data.cartToValidate;

                    // 🔧 RECONSTITUER LES DONNÉES COMPLÈTES DES PRODUITS
                    const productIds = cartMetadata.items.map(item => item.id);

                    const { data: productsData, error: productsError } = await supabase
                        .from('products')
                        .select('id, name, salePrice, weight')
                        .in('id', productIds);

                    if (productsError) {
                        console.error("❌ Erreur récupération produits:", productsError);
                        displayNotification("Erreur", "Impossible de récupérer les informations des produits", "danger");
                        setIsProcessing(false);
                        return;
                    }

                    // Créer un map pour accès rapide aux produits
                    const productsMap = {};
                    productsData.forEach(p => {
                        productsMap[p.id] = p;
                    });

                    // Reconstituer le contenu complet du panier
                    const fullCartContent = cartMetadata.items.map(item => {
                        const product = productsMap[item.id];
                        return {
                            id: item.id,
                            name: product.name,
                            salePrice: parseFloat(product.salePrice),
                            weight: parseFloat(product.weight),
                            quantity: item.qty,
                            pickupPointId: cartMetadata.pickup_point
                        };
                    });

                    console.log("🛒 Contenu complet reconstitué:", fullCartContent);

                    // Créer l'objet cart complet pour insertion
                    const cartToInsert = {
                        client_id: cartMetadata.client_id,
                        content: fullCartContent,
                        price: cartMetadata.price + shippingCost,
                        delivered: cartMetadata.delivered
                    };

                    // Fetching old counters
                    const { data: dataOldCounters, error: errorOldCounters } = await supabase
                        .from('User')
                        .select('current_weight, current_price, current_order')
                        .eq('id', cartMetadata.client_id)
                        .single();

                    if (errorOldCounters) {
                        console.error("Échec lors de la récupération des compteurs du compte", errorOldCounters.message)
                        displayNotification("Échec lors de la récupération des compteurs du compte", errorOldCounters.message, "danger")
                        setIsProcessing(false);
                        return;
                    }

                    const oldWeight = dataOldCounters.current_weight || 0
                    const oldOrder = dataOldCounters.current_order || 0
                    const oldPrice = dataOldCounters.current_price || 0

                    // Computing new cart counters values
                    const cartWeight = roundTwoDigits(
                        fullCartContent
                            .map((product) => parseFloat(product.weight) * parseFloat(product.quantity))
                            .reduce((total, weight) => total + weight, 0)
                    )
                    const cartOrder = roundTwoDigits(
                        fullCartContent
                            .map((product) => parseFloat(product.quantity))
                            .reduce((total, qty) => total + qty, 0)
                    )
                    const cartPrice = roundTwoDigits(
                        fullCartContent
                            .map((product) => parseFloat(product.salePrice) * parseFloat(product.quantity))
                            .reduce((total, price) => total + price, 0)
                    )

                    console.log("📊 Compteurs:", { cartWeight, cartOrder, cartPrice });

                    // Insert cart in database
                    const { data: dataInsertedCart, error: insertError } = await supabase
                        .from("cart")
                        .insert(cartToInsert)
                        .select("id")
                        .single();

                    if (insertError) {
                        console.error("💥 Erreur insertion commande :", insertError);
                        displayNotification("Erreur", "Échec de l'enregistrement de la commande", "danger");
                        setIsProcessing(false);
                        return;
                    } else {
                        console.log("🛒 Commande insérée avec succès ! ID:", dataInsertedCart.id);
                    }

                    // Updating the counters
                    const { error: updateError } = await supabase
                        .from("User")
                        .update({
                            current_weight: oldWeight + cartWeight,
                            current_price: oldPrice + cartPrice,
                            current_order: oldOrder + cartOrder
                        })
                        .eq('id', cartMetadata.client_id)

                    if (updateError) {
                        console.error("Échec de mise à jour des compteurs liés au compte", updateError.message)
                        displayNotification("Échec de mise à jour des compteurs liés au compte", updateError.message, "danger")
                    }

                    // Create shipping label
                    await createAndInsertLabel(dataInsertedCart.id)

                    // Empty the cart
                    setCart({ content: {} });
                    console.log("🗑️ Panier vidé");

                    // Wait a bit before redirect to ensure user sees success message
                    setTimeout(() => {
                        setIsProcessing(false);
                        navigate("/delivery");
                    }, 1500);

                } else {
                    console.warn("⚠️ Paiement non validé ou panier manquant.");
                    displayNotification("Attention", "Le paiement n'a pas pu être confirmé", "warning");
                    setIsProcessing(false);
                    navigate("/cart");
                }
            } catch (err) {
                console.error("💥 Erreur générale dans confirmPayment:", err);
                displayNotification("Erreur", "Une erreur est survenue lors de la validation", "danger");
                setIsProcessing(false);
                navigate("/cart");
            }
        };

        confirmPayment();
    }, [navigate, setCart]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
            <div className="text-center">
                <Loading text="Validation du paiement en cours..." />
                {!isProcessing && (
                    <p className="mt-4 text-gray-600">
                        Redirection en cours...
                    </p>
                )}
            </div>
        </div>
    );
}

export default PaymentSuccess;