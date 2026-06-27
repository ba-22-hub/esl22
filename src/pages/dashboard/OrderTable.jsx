// =============================================================================
// HISTORIQUE DES MODIFICATIONS
// =============================================================================
//
// Date          Auteur        Description
// ----------    ----------    -------------------------------------------------
// 2026-06-07    Louvel       Ajout shippingCost dans la facture
// 2026-06-08    Louvel       Ajout packagingWeight pour le calcul du poids brut
//                            du colis : poids des produits + poids de l'emballage
// 2026-06-08    Louvel       Traitement du colis en mode "relais"
// 2026-06-08    Louvel       Blindage complet du code pour le mode "relais" (validation des champs, gestion des erreurs)
// 2026-06-09    Louvel       create-dpd-label => dpd-create-label-relay
// 2026-06-27    Louvel       ajout du shippingCost de l'expédition sur la facture de l'utilisateur
//
// =============================================================================

// Importing dependencies
import { useEffect, useState } from "react";
import { useAuthor } from "@context/AuthorContext";
import { useNavigate } from "react-router-dom";
import { displayNotification } from '@lib/displayNotification.jsx';
import { supabase } from "@lib/supabaseClient";
import { getPickupPoint } from '@lib/pudo_helper.js';
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'

// Importing common components
import Loading from "@common/Loading.jsx";

// Importing content
import content from "../../content/sender_content.json";

/**
 * Component to display and manage orders in the admin dashboard.
 * Allows admins to view, confirm delivery, and manage orders.
 * @returns {React.ReactElement} OrderTable component.
 */
function OrderTable() {
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [activeTab, setActiveTab] = useState('paid');
    const [isGeneratingLabel, setIsGeneratingLabel] = useState(false);

    const { isAdmin, loading } = useAuthor();
    const navigate = useNavigate();

    useEffect(() => {
        if (loading) return;
        if (!isAdmin) {
            navigate("/admin");
            return;
        }
        fetchOrders();
    }, [loading]);

    const fetchOrders = async () => {
        setLoadingOrders(true);
        const { data, error } = await supabase
            .from("cart")
            .select(`
                id,
                client_id,
                content,
                price,
                delivered,
                created_at,
                status,
                referenceNumber,
                shippingLabelFileName,
                pickupPoint,
                User: client_id (
                  firstName,
                  lastName,
                  email
                )
            `)
            .order("created_at", { ascending: false });

        if (error) {
            displayNotification("Erreur de chargement", error.message, "danger")
        } else {
            setOrders(data);
        }
        setLoadingOrders(false);
    };

    const generateDPDLabel = async (order) => {
        setIsGeneratingLabel(true);
        try {
            // ── Récupération du poids d'emballage depuis constants ────────────
            const totalProductsWeightKg = order.content.reduce((acc, product) => {
            return acc + (parseFloat(product.weight) * parseFloat(product.quantity)) / 1000;
            }, 0);

            const { data: packagingData } = await supabase
                .from('constants')
                .select('value')
                .eq('name', 'packagingWeight')
                .maybeSingle();
            const packagingWeightKg = parseFloat(packagingData?.value ?? 0) / 1000;
            const totalWeightKg = totalProductsWeightKg + packagingWeightKg;
            // ─────────────────────────────────────────────────────────────────

            const shippingDate = new Date().toISOString().split("T")[0];
            const referenceNumber = `CMD-${order.id}`;

            const userData = await (async () => {
                const { data: userData, error: userError } = await supabase
                    .from("User")
                    .select("phone, email, firstName, lastName, postalCode, city, address, addAddress")
                    .eq("id", order.client_id)
                    .single();
                if (userError) {
                    displayNotification("Utilisateur introuvable", userError.message, "danger");
                    throw new Error(`Impossible de récupérer les données de l'utilisateur: ${userError.message}`);
                }
                return userData;
            })();

            // 2. Récupération du point relais
            let pickupId = order.pickupPoint;

            if (!pickupId) {
                let contentArr = [];
                try {
                    contentArr = Array.isArray(order.content) ? order.content : JSON.parse(order.content || "[]");
                } catch (e) {
                    contentArr = [];
                }
                const itemWithPickup = contentArr.find(it => it && (it.pickupPointId || it.pickup_point));
                pickupId = itemWithPickup?.pickupPointId || itemWithPickup?.pickup_point;
            }

            if (!pickupId) {
                displayNotification("Erreur", "Aucun pickup point associé à cette commande", "danger");
                throw new Error("pickupId not found for order " + order.id);
            }

            const pickupPoint = await getPickupPoint(pickupId);

            // 3. Vérification que pickupPoint existe
            if (!pickupPoint) {
                throw new Error(`Point relais introuvable pour l'ID: ${pickupId}`);
            }

            // 4. Valeurs par défaut
            const defaultPhone = "0651047772";
            const defaultEmail = "ba220.epicerie@banquealimentaire.org";

            // 5. Normalisation du téléphone (suppression du +33)
            const normalizePhone = (phone) => phone?.replace(/^\+33/, '0');

            // 6. Construction des objets destinataire et expéditeur
            const destinataire = {
                nom: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || pickupPoint.name || "Client",
                pays: "FR",
                cp: userData?.postalCode || pickupPoint.zipCode, // Code postal du destinataire ou du point relais
                vville: userData?.city || pickupPoint.city, // Ville du destinataire ou du point relais
                rue: userData?.address || `${pickupPoint.address1 || ""} ${pickupPoint.address2 || ""}`.trim(),
                contact: {
                    phone: normalizePhone(userData?.phone) || defaultPhone,
                    email: userData?.email || defaultEmail,
                },
            };

            const expediteur = {
                nom: content.adresse.nom,
                pays: content.adresse.pays,
                cp: content.adresse.cp,
                ville: content.adresse.ville,
                rue: content.adresse.rue,
                contact: {
                phone: normalizePhone(content.adresse.phone) || defaultPhone,
                },
            };

            // 7. Construction du payload pour le mode "relais"
            const payload = {
                mode: "relais",
                poids: totalWeightKg,
                shippingdate: shippingDate,
                referencenumber: referenceNumber,
                relais: {
                    shopid: pickupId, // ID DPD du point relais
                    sms: normalizePhone(userData?.phone) || defaultPhone, // Téléphone du destinataire
                    email: userData?.email || defaultEmail, // email du destinataire
                },
                destinataire,
                expediteur,
            };

            // 8. Validation du payload
            if (!payload.relais?.shopid) {
                throw new Error("ID du point relais manquant dans le payload.");
            }
            if (!payload.destinataire?.contact?.phone) {
                throw new Error("Téléphone du destinataire manquant.");
            }

            console.log("Payload DPD (mode relais) :", payload);

            // 9. Appel à l'Edge Function
            const { data: labelData, error: functionError } = await supabase.functions.invoke(
                "dpd-create-label-relay",
                {
                    body: payload,
                }
            );

            if (functionError) {
                throw new Error(`Erreur fonction Edge: ${functionError.message}`);
            }

            let pdfBlob;

            if (labelData instanceof Blob) {
                pdfBlob = labelData;
            } else if (labelData instanceof ArrayBuffer) {
                pdfBlob = new Blob([labelData], { type: "application/pdf" });
            } else if (labelData instanceof Uint8Array) {
                pdfBlob = new Blob([labelData], { type: "application/pdf" });
            } else if (typeof labelData === 'string' && labelData.startsWith('%PDF')) {
                const encoder = new TextEncoder();
                const uint8Array = encoder.encode(labelData);
                pdfBlob = new Blob([uint8Array], { type: "application/pdf" });
            } else if (typeof labelData === 'string') {
                try {
                    const binaryString = atob(labelData);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    pdfBlob = new Blob([bytes], { type: "application/pdf" });
                } catch (e) {
                    throw new Error("Impossible de décoder le PDF: " + e.message);
                }
            } else if (typeof labelData === 'object' && labelData !== null) {
                if (labelData.pdf && typeof labelData.pdf === 'string') {
                    const binaryString = atob(labelData.pdf);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    pdfBlob = new Blob([bytes], { type: "application/pdf" });
                } else {
                    throw new Error(`Format d'objet inattendu`);
                }
            } else {
                throw new Error(`Type inattendu: ${typeof labelData}`);
            }

            if (!pdfBlob || pdfBlob.size === 0) {
                throw new Error("Le PDF généré est vide ou invalide");
            }

            const fileName = `label-${order.id}.pdf`;

            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `label_${order.id}.pdf`;
            a.click();
            URL.revokeObjectURL(url);

            const { error: uploadError } = await supabase
                .storage
                .from("labels")
                .upload(fileName, pdfBlob, {
                    contentType: "application/pdf",
                    upsert: true,
                });

            if (uploadError) {
                throw new Error(`Erreur upload: ${uploadError.message}`);
            }

            const { error: updateError } = await supabase
                .from("cart")
                .update({
                    referenceNumber: referenceNumber,
                    shippingLabelFileName: fileName,
                    status: "validated",
                })
                .eq("id", order.id);

            if (updateError) {
                throw new Error(`Erreur mise à jour: ${updateError.message}`);
            }

            displayNotification("Label généré", `Label DPD généré pour la commande ${order.id}`, "success");
            fetchOrders();
        } catch (error) {
            displayNotification("Erreur", error.message, "danger");
        } finally {
            setIsGeneratingLabel(false);
        }
    };

    const updateOrderStatus = async (id, newStatus, successMessage) => {
        // if (!confirm(`Êtes-vous sûr de vouloir passer cette commande au statut "${newStatus}" ?`)) return;

        const { error } = await supabase
            .from("cart")
            .update({ status: newStatus })
            .eq("id", id);

        if (error) {
            displayNotification("Erreur de mise à jour", error.message, "danger");
        } else {
            displayNotification("Statut mis à jour", successMessage, "success");
            fetchOrders();
        }
    };

    const prepareDPD = (id) => generateDPDLabel(orders.find(o => o.id === id), updateOrderStatus(id, 'validated', `Commande ${id} marquée comme "En préparation DPD" ✅`));
    const markAsShipped = (id) => updateOrderStatus(id, 'shipped', `Commande ${id} marquée comme "Expédiée" ✅`);
    const confirmDelivery = (id) => updateOrderStatus(id, 'delivered', `Commande ${id} marquée comme "Livrée" ✅`);


    if (loading || loadingOrders) {
        return <Loading />;
    }

    const paidOrders = orders.filter((o) => o.status === 'paid');
    const validatedOrders = orders.filter((o) => o.status === 'validated');
    const shippedOrders = orders.filter((o) => o.status === 'shipped');
    const deliveredOrders = orders.filter((o) => o.status === 'delivered');

    const displayOrders = {
        paid: paidOrders,
        validated: validatedOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
    }[activeTab] || [];

    // helper to display order content
    const renderContent = (content) => {
        try {
            const items = Array.isArray(content) ? content : JSON.parse(content);
            return (
                <div className="space-y-2">
                    {items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200">
                            <div className="flex items-center gap-2">
                                <span className="bg-rayonblue text-white px-2 py-1 rounded text-xs font-semibold">
                                    {item.quantity}x
                                </span>
                                <span className="text-gray-800">{item.name}</span>
                            </div>
                            <span className="text-rayonorange font-semibold">{item.salePrice.toFixed(2)} €</span>
                        </div>
                    ))}
                </div>
            );
        } catch (e) {
            return <pre className="text-xs bg-red-50 p-2 rounded">{JSON.stringify(content, null, 2)}</pre>;
        }
    };

    const statusConfig = {
        paid: { label: "Payée", color: "text-blue-600", bgColor: "bg-blue-100" },
        validated: { label: "En préparation DPD", color: "text-yellow-600", bgColor: "bg-yellow-100" },
        shipped: { label: "Expédiée", color: "text-purple-600", bgColor: "bg-purple-100" },
        delivered: { label: "Livrée", color: "text-green-600", bgColor: "bg-green-100" },
    };

    async function downloadLabel(order) {
        const { data: labelData, error: labelError } = await supabase
            .storage
            .from("labels")
            .download(order.shippingLabelFileName);

        if (labelError) {
            displayNotification("Erreur lors du téléchargement de l'étiquette " + order.shippingLabelFileName, labelError.message, "danger")
        } else {
            const url = URL.createObjectURL(labelData);
            const a = document.createElement('a');
            a.href = url;
            a.download = `label_${order.id}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    async function createAndDownloadBill(order) {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let yPosition = 20;

            doc.setFontSize(20);
            doc.setTextColor(255,130,0);
            doc.text("L'épicerie Sociale en Ligne des Côtes d'Armor", 20, yPosition);
            yPosition += 10;

            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text("FACTURE", 20, yPosition);
            yPosition += 12;

            doc.setFontSize(10);
            doc.text(`Numéro de facture : ${order.referenceNumber || order.id}`, 20, yPosition);
            yPosition += 6;
            doc.text(`Date de la commande : ${new Date(order.created_at).toLocaleDateString('fr-FR')}`, 20, yPosition);
            yPosition += 12;

            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text("Informations client :", 20, yPosition);
            yPosition += 6;

            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            if (order.User) {
                doc.text(`${order.User.firstName} ${order.User.lastName}`, 20, yPosition);
                yPosition += 5;
                doc.text(`Email: ${order.User.email}`, 20, yPosition);
                yPosition += 5;
            }
            yPosition += 5;

            // ── AJOUT : récupération shippingCost ──────────────────────────────
            const { data: shippingData, error: shippingError } = await supabase
                .from('constants')
                .select('value')
                .eq('name', 'shippingCost')
                .maybeSingle();

            if (shippingError) {
                console.warn("Impossible de récupérer shippingCost, valeur par défaut utilisée :", shippingError.message);
            }

            const shippingCost = parseFloat(shippingData?.value) || 1.35;

            // ──────────────────────────────────────────────────────────────────

            const tableColumn = ["Quantité", "Produit", "Prix unitaire", "Montant"];
            const tableRows = [];

            const contentArray = Array.isArray(order.content)
                ? order.content
                : JSON.parse(order.content || "[]");

            contentArray.forEach(item => {
                tableRows.push([
                    item.quantity.toString(),
                    item.name,
                    `${item.salePrice.toFixed(2)} €`,
                    `${(item.salePrice * item.quantity).toFixed(2)} €`
                ]);
            });

            // ── AJOUT : ligne frais de port dans le tableau ────────────────────
            tableRows.push([
                "1",
                "Frais de livraison",
                `${shippingCost.toFixed(2)} €`,
                `${shippingCost.toFixed(2)} €`
            ]);
            // ──────────────────────────────────────────────────────────────────

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: yPosition,
                theme: 'grid',
                headStyles: {
                    fillColor: [0, 71, 171],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                bodyStyles: {
                    textColor: 0
                }
            })

            yPosition = doc.lastAutoTable.finalY + 10;

            // ── MODIFIÉ : total décomposé ──────────────────────────────────────
            const produitsTotal = contentArray.reduce(
                (acc, item) => acc + item.salePrice * item.quantity, 0
            );

            doc.setFont(undefined, 'bold');
            doc.setFontSize(12);
            doc.text(`Total: ${(order.price || 0).toFixed(2)} €`, pageWidth - 40, yPosition, { align: 'right' });

            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                "Merci de votre commande!",
                pageWidth / 2,
                pageHeight - 10,
                { align: "center" }
            );

            doc.save(`facture_${order.id}.pdf`);

            displayNotification("Facture générée", `Facture créée pour la commande ${order.id}`, "success");

        } catch (error) {
            displayNotification("Erreur", "Impossible de générer la facture : " + error.message, "danger");
        }
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-rayonblue">Gestion des Commandes</h1>

                {/* Onglets pour chaque statut */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    <button
                        onClick={() => setActiveTab('paid')}
                        className={`px-6 py-3 rounded-lg font-semibold transition ${activeTab === 'paid'
                            ? 'bg-rayonblue text-white'
                            : 'bg-white text-rayonblue border-2 border-rayonblue hover:bg-blue-50'
                            }`}
                    >
                        💳 Payées ({paidOrders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('validated')}
                        className={`px-6 py-3 rounded-lg font-semibold transition ${activeTab === 'validated'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-white text-yellow-600 border-2 border-yellow-500 hover:bg-yellow-50'
                            }`}
                    >
                        📦 En préparation DPD ({validatedOrders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('shipped')}
                        className={`px-6 py-3 rounded-lg font-semibold transition ${activeTab === 'shipped'
                            ? 'bg-purple-500 text-white'
                            : 'bg-white text-purple-600 border-2 border-purple-500 hover:bg-purple-50'
                            }`}
                    >
                        🚚 Expédiées ({shippedOrders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('delivered')}
                        className={`px-6 py-3 rounded-lg font-semibold transition ${activeTab === 'delivered'
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-green-600 border-2 border-green-500 hover:bg-green-50'
                            }`}
                    >
                        ✅ Livrées ({deliveredOrders.length})
                    </button>
                </div>

                {/* Liste des commandes */}
                <div className="space-y-4 mb-6">
                    {displayOrders.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
                            <p className="text-lg">
                                Aucune commande avec le statut "{statusConfig[activeTab]?.label}"
                            </p>
                        </div>
                    ) : (
                        displayOrders.map((order) => (
                            <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                                {/* En-tête de la commande */}
                                <div className="p-4 bg-gradient-to-r from-blue-50 to-white border-b border-rayonblue">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 bg-rayonorange rounded-full flex items-center justify-center text-white font-semibold">
                                                    {order.User ? `${order.User.firstName.charAt(0)}${order.User.lastName.charAt(0)}` : '?'}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-800">
                                                        {order.User
                                                            ? `${order.User.firstName} ${order.User.lastName.toUpperCase()}`
                                                            : 'Client inconnu'}
                                                    </h3>
                                                    {order.User && (
                                                        <p className="text-xs text-gray-500">
                                                            {order.User.email}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span>{new Date(order.created_at).toLocaleDateString('fr-FR')} à {new Date(order.created_at).toLocaleTimeString('fr-FR')}</span>
                                                <span className="font-semibold text-rayonorange text-lg">
                                                    {(order.price || 0).toFixed(2)} €
                                                </span>
                                            </div>
                                        </div>

                                        {/* Statut de la commande */}
                                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[order.status]?.bgColor} ${statusConfig[order.status]?.color} ml-4`}>
                                            {statusConfig[order.status]?.label || order.status}
                                        </div>

                                        {/* Boutons d'action */}
                                        <div className="flex items-center gap-2 ml-4">
                                            <button
                                                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm font-medium text-rayonblue"
                                                title="Voir détails"
                                            >
                                                {expandedOrder === order.id ? "▲ Masquer" : "▼ Détails"}
                                            </button>

                                            {/* Boutons de transition de statut */}
                                            {order.status === 'paid' && (
                                                <button
                                                    onClick={() => prepareDPD(order.id)}
                                                    disabled={isGeneratingLabel}
                                                    className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition text-sm font-medium disabled:opacity-50"
                                                    title="En préparation DPD"
                                                >
                                                    {isGeneratingLabel ? "⏳ Génération..." : "Préparer DPD"}
                                                </button>
                                            )}
                                            {order.status === 'validated' && (
                                                <button
                                                    onClick={() => markAsShipped(order.id)}
                                                    className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition text-sm font-medium"
                                                    title="Marquer comme expédiée"
                                                >
                                                    Expédier
                                                </button>
                                            )}
                                            {order.status === 'shipped' && (
                                                <button
                                                    onClick={() => confirmDelivery(order.id)}
                                                    className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition text-sm font-medium"
                                                    title="Confirmer la livraison"
                                                >
                                                    Livrer
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Détails de la commande */}
                                {expandedOrder === order.id && (
                                    <div className="p-4 bg-gray-50 border-t">
                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                            <label className="text-xs font-medium text-rayonblue block mb-3">
                                                Contenu de la commande
                                            </label>
                                            {renderContent(order.content)}

                                            {/* Total */}
                                            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                                                <span className="text-lg font-semibold text-gray-800">Total</span>
                                                <span className="text-2xl font-bold text-rayonorange">
                                                    {(order.price || 0).toFixed(2)} €
                                                </span>
                                            </div>
                                        </div>

                                        {/* Informations complémentaires */}
                                        <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200">
                                            <label className="text-xs font-medium text-rayonblue block mb-2">
                                                Informations de la commande
                                            </label>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <p className="text-gray-500 text-xs">ID de la commande</p>
                                                    <p className="text-gray-800 font-medium">{order.id}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-xs">Statut</p>
                                                    <p className={`font-medium ${statusConfig[order.status]?.color}`}>
                                                        {statusConfig[order.status]?.label || order.status}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-xs">Date de création</p>
                                                    <p className="text-gray-800 font-medium">
                                                        {new Date(order.created_at).toLocaleString('fr-FR')}
                                                    </p>
                                                </div>
                                                {order.User && (
                                                    <div>
                                                        <p className="text-gray-500 text-xs">ID client</p>
                                                        <p className="text-gray-800 font-medium">{order.client_id}</p>
                                                    </div>
                                                )}
                                                {order.referenceNumber && (
                                                    <div>
                                                        <p className="text-gray-500 text-xs">Référence</p>
                                                        <p className="text-gray-800 font-medium">{order.referenceNumber}</p>
                                                    </div>
                                                )}
                                                <div>
                                                    <button
                                                        onClick={() => createAndDownloadBill(order)}
                                                        className="text-rayonblue hover:underline font-medium"
                                                    >
                                                        Générer la facture
                                                    </button>
                                                </div>
                                                {order.shippingLabelFileName && (
                                                    <div>
                                                        <button
                                                            onClick={() => downloadLabel(order)}
                                                            className="text-rayonblue hover:underline font-medium"
                                                        >
                                                            Télécharger l'étiquette
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Boutons de transition en bas */}
                                        <div className="mt-4 flex gap-2">
                                            {order.status === 'paid' && (
                                                <button
                                                    onClick={() => prepareDPD(order.id)}
                                                    disabled={isGeneratingLabel}
                                                    className="flex-1 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition disabled:opacity-50"
                                                >
                                                    {isGeneratingLabel ? "⏳ Génération en cours..." : "✅ En préparation DPD"}
                                                </button>
                                            )}
                                            {order.status === 'validated' && (
                                                <button
                                                    onClick={() => markAsShipped(order.id)}
                                                    className="flex-1 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition"
                                                >
                                                    🚚 Marquer comme expédiée
                                                </button>
                                            )}
                                            {order.status === 'shipped' && (
                                                <button
                                                    onClick={() => confirmDelivery(order.id)}
                                                    className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition"
                                                >
                                                    ✅ Confirmer la livraison
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default OrderTable;
