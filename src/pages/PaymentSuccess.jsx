// =============================================================================
// HISTORIQUE DES MODIFICATIONS
// =============================================================================
//
// Date          Auteur        Description
// ----------    ----------    -------------------------------------------------
// 2026-06-15    Louvel       recalcul de current_price et current_weight lors
// 2026-06-15    Louvel		  de l'update => ajout shippingCost et packagingWeight
//
// =============================================================================
// Importing dependencies
import { useEffect, useRef, useState } from "react";
import { supabase } from "@lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useCart } from "@context/CartContext.jsx";
import { displayNotification } from '@lib/displayNotification.jsx';
import { useAuthor } from '@context/AuthorContext.jsx'
import sendMail from '@lib/sendMail.js';
import { getPickupPoint } from '@lib/pudo_helper.js';

// Importing common components
import Loading from "@common/Loading.jsx";

function PaymentSuccess() {
    const navigate = useNavigate();
    const hasRun = useRef(false);
    const { setCart } = useCart();
    const { user } = useAuthor();
    const [isProcessing, setIsProcessing] = useState(true);

    function roundTwoDigits(nb) {
        return Math.round(nb * 100) / 100
    }

    useEffect(() => {
        if (hasRun.current || !user) return;
        hasRun.current = true;

        // const createAndInsertLabel = async ({
        //     cartId,
        //     fullCartContent,
        //     pickupPoint,
        //     userData
        // }) => {
        //     try {
        //         const totalWeightKg = roundTwoDigits(
        //             fullCartContent.reduce((acc, product) => {
        //                 return acc + (
        //                     (parseFloat(product.weight) * parseFloat(product.quantity)) / 1000
        //                 );
        //             }, 0)
        //         );

        //         const shippingDate = new Date().toISOString().split("T")[0];
        //         const referenceNumber = `CMD-${cartId}`;

        //         const destinataire = {
        //             nom: pickupPoint.name || userData.firstName || "Client",
        //             pays: "FR",
        //             cp: pickupPoint.zipCode,
        //             ville: pickupPoint.city,
        //             rue: `${pickupPoint.address1 || ""} ${pickupPoint.address2 || ""}`.trim(),
        //         };

        //         const expediteur = {
        //             nom: content.adresse.nom,
        //             pays: content.adresse.pays,
        //             cp: content.adresse.cp,
        //             ville: content.adresse.ville,
        //             rue: content.adresse.rue,
        //         };

        //         const payload = {
        //             poids: totalWeightKg,
        //             shippingdate: shippingDate,
        //             referencenumber: referenceNumber,
        //             destinataire: destinataire,
        //             expediteur: expediteur,
        //         };

        //         console.log("Payload étiquette :", payload);

        //         const { data: labelData, error: functionError } = await supabase.functions.invoke(
        //             "create-dpd-label",
        //             {
        //                 body: payload,
        //             }
        //         );

        //         if (functionError) {
        //             displayNotification("Erreur fonction Edge", functionError.message, "danger");
        //             throw new Error(`Erreur fonction Edge: ${functionError.message}`);
        //         }

        //         const blob = new Blob([labelData], { type: "application/pdf" });
        //         console.log("blob", blob)

        //         const fileName = `label-${cartId}.pdf`;

        //         const { error: uploadError } = await supabase
        //             .storage
        //             .from("labels")
        //             .upload(fileName, blob, {
        //                 contentType: "application/pdf",
        //                 upsert: true,
        //             });

        //         if (uploadError) {
        //             displayNotification("Erreur lors de la sauvegarde de l'étiquette", labelError.message, "danger");
        //         }

        //         console.log("Réponse API :", labelData);

        //         const { error: labelError } = await supabase
        //             .from("cart")
        //             .update({
        //                 referenceNumber: referenceNumber,
        //                 shippingLabelFileName: fileName,
        //                 status: "paid"
        //             })
        //             .eq("id", cartId);

        //         if (labelError) {
        //             displayNotification("Erreur lors de la sauvegarde des données liées à la commande", labelError.message, "danger");
        //         }

        //         return labelData;

        //     } catch (e) {
        //         displayNotification("Erreur lors de la création de l'étiquette", e.message, "danger");

        //         return null;
        //     }
        // };

        const confirmPayment = async () => {
            try {

                // 1. Fetch des constantes shippingCost & packagingWeight
                const { data: constants, error: constantsError } = await supabase
                    .from('constants')
                    .select('name, value')
                    .in("name", ["shippingCost", "packagingWeight"]);

                if (constantsError) {
                    console.warn("Impossible de récupérer les constantes, valeurs par défaut utilisées :", constantsError.message);
                }

                const shippingCost = parseFloat(constants?.find(c => c.name === "shippingCost")?.value) || 1.35;
                const packagingWeight = parseFloat(constants?.find(c => c.name === "packagingWeight")?.value) || 300;

                const urlParams = new URLSearchParams(window.location.search);
                const session_id = urlParams.get("session_id");

                if (!session_id) {
                    displayNotification("Erreur", "Aucune session de paiement trouvée", "danger");
                    navigate("/cart");
                    return;
                }

                // Invoke the Supabase edge function to retrieve the checkout session
                const { data, error } = await supabase.functions.invoke("retrieve-checkout-session", {
                    body: { session_id }
                });

                if (error) {
                    displayNotification("Erreur", "Impossible de récupérer les informations de paiement", "danger");
                    navigate("/cart");
                    return;
                }

                if (data?.payment_status === "paid" && data?.cartToValidate) {
                    displayNotification("Paiement validé", "Votre commande est en cours de traitement", "success")

                    const cartMetadata = data.cartToValidate;

                    // RECONSTITUER LES DONNÉES COMPLÈTES DES PRODUITS
                    const productIds = cartMetadata.items.map(item => item.id);

                    const { data: productsData, error: productsError } = await supabase
                        .from('products')
                        .select('id, name, salePrice, weight')
                        .in('id', productIds);

                    if (productsError) {
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

                    // Créer l'objet cart complet pour insertion
                    const cartToInsert = {
                        client_id: cartMetadata.client_id,
                        content: fullCartContent,
                        price: cartMetadata.price + shippingCost,
                        delivered: cartMetadata.delivered,
                        pickupPoint: cartMetadata.pickup_point
                    };

                    // Fetching old counters
                    const { data: dataOldCounters, error: errorOldCounters } = await supabase
                        .from('User')
                        .select('current_weight, current_price, current_order')
                        .eq('id', cartMetadata.client_id)
                        .single();

                    if (errorOldCounters) {
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

                    // Insert cart in database
                    const { data: dataInsertedCart, error: insertError } = await supabase
                        .from("cart")
                        .insert(cartToInsert)
                        .select("id")
                        .single();

                    if (insertError) {
                        console.error("Supabase insert error:", insertError);
                        // insertError.message, insertError.code, insertError.details, insertError.hint
                        displayNotification("Erreur", `Échec: ${insertError.message}`, "danger");
                        //displayNotification("Erreur", "Échec de l'enregistrement de la commande", "danger");
                        setIsProcessing(false);
                        return;
                    } else {
                        // Updating stocks in database
                        fullCartContent
                            .map(async (product) => {
                                const { data: updateStockData, error: updateStockError } = await supabase.rpc("decrement_stock", {
                                    product_id_input: product.id,
                                    quantity_input: product.quantity
                                })
                                if (updateStockError) {
                                    displayNotification(
                                        "Erreur de mise à jour des stocks de " + product.name,
                                        updateStockError.message,
                                        "danger"
                                    );
                                }
                            })
                    }

                    let name = ""
                    // get user firstname
                    try {
                        const { data: firstName, error: dberror } = await supabase
                            .from('User')
                            .select('firstName')
                            .eq('id', user.id)
                            .single();
                        if (dberror) {
                            displayNotification("Erreur lors de la récupération des informations", "", "danger")
                            return;
                        }
                        name = firstName.firstName
                    } catch (err) {
                        displayNotification("Erreur d'envoi de l'e-mail", err.message, "danger")
                        return;
                    }

                    const pickupPoint = await getPickupPoint(cartMetadata.pickup_point)

                    // Updating the counters
                    const { error: updateError } = await supabase
                        .from("User")
                        .update({
                            current_weight: oldWeight + cartWeight + packagingWeight,
                            current_price: oldPrice + cartPrice + shippingCost,
                            current_order: oldOrder + 1
                        })
                        .eq('id', cartMetadata.client_id)

                    if (updateError) {
                        displayNotification("Échec de mise à jour des compteurs liés au compte", updateError.message, "danger")
                    }

                    // Récupération des infos client nécessaires à la facture
                    const { data: currentUserData, error: currentUserError } = await supabase
                        .from("User")
                        .select("firstName, lastName, address, city, postalCode")
                        .eq("id", user.id)
                        .single();
                    if (currentUserError) {
                            console.warn("Impossible de récupérer les infos client pour la facture :", currentUserError.message);
                    }

                    // Génération de la facture en best-effort (ne bloque jamais le flow utilisateur)
                    if (currentUserData) {
                        supabase.functions.invoke("create-invoice", {
                            body: {
                                cartId: dataInsertedCart.id,
                                client: {
                                    id: cartMetadata.client_id,
                                    firstName: currentUserData.firstName,
                                    lastName: currentUserData.lastName,
                                    address: currentUserData.address,
                                    city: currentUserData.city,
                                    postalCode: currentUserData.postalCode,
                                },
                                items: fullCartContent,
                                shippingCost,
                                totalPrice: cartMetadata.price + shippingCost,
                            },
                        }).then(({ error }) => {
                            if (error) {
                                console.warn(`Facture non générée pour la commande ${dataInsertedCart.id} :`, error.message);
                            }
                        });
                    }

                    // const label = await createAndInsertLabel({
                    //     cartId: dataInsertedCart.id,
                    //     cartMetadata,
                    //     fullCartContent,
                    //     pickupPoint,
                    //     userData: currentUserData
                    // });

                    //  notify user
                    try {
                        await sendMail({
                            email: user.email,
                            templateId: 2,
                            params: {
                                FIRSTNAME: name || "Client",
                                COMMAND_NUMBER: dataInsertedCart.id.slice(0, 8),
                                CONTENT: fullCartContent.map(item => `- ${item.name} x ${item.quantity}<br>`).join(""),
                                PRICE: (cartMetadata.price + shippingCost).toFixed(2).replace('.', ','),
                                PICKUP_POINT_NAME: pickupPoint.name,
                                PICKUP_POINT_ADDRESS: `${pickupPoint.address1} ${pickupPoint.address2}, ${pickupPoint.zipCode} ${pickupPoint.city}`
                            },
                        });

                        displayNotification("E-mail envoyé avec succès", "", "success");
                    } catch (error) {
                        displayNotification("Erreur d'envoi de l'e-mail", error.message, "danger")
                    }

                    // Empty the cart
                    setCart({ content: {} });

                    // Wait a bit before redirect to ensure user sees success message
                    setTimeout(() => {
                        setIsProcessing(false);
                        navigate("/delivery");
                    }, 1500);

                } else {
                    displayNotification("Attention", "Le paiement n'a pas pu être confirmé", "warning");
                    setIsProcessing(false);
                    navigate("/cart");
                }
            } catch (err) {
                console.error("Erreur lors de la validation", err.message);
                displayNotification("Erreur", "Une erreur est survenue lors de la validation", err.message, "danger");
                setIsProcessing(false);
                navigate("/cart");
            }
        };

        confirmPayment();
    }, [navigate, setCart, user]);

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
