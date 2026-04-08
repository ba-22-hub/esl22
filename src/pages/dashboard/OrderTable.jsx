// Importing dependencies
import { useEffect, useState } from "react";
import { useAuthor } from "@context/AuthorContext";
import { useNavigate } from "react-router-dom";
import { displayNotification } from '@lib/displayNotification.jsx';
import { supabase } from "@lib/supabaseClient";

// Importing common components
import FunctionButton from "@common/FunctionButton.jsx";
import Loading from "@common/Loading.jsx";

/**
 * Component to display and manage orders in the admin dashboard.
 * Allows admins to view, confirm delivery, and manage orders.
 * @returns {React.ReactElement} OrderTable component.
 */
function OrderTable() {
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'delivered'

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
                User: client_id (
                  firstName,
                  lastName,
                  email
                )
            `)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Erreur chargement commandes:", error);
            displayNotification("Erreur de chargement", error.message, "danger")
        } else {
            setOrders(data);
        }
        setLoadingOrders(false);
    };

    const confirmDelivery = async (id) => {
        if (!confirm('Êtes-vous sûr de vouloir marquer cette commande comme livrée ?')) return;

        const { error } = await supabase.from("cart").update({ delivered: true }).eq("id", id);

        if (error) {
            console.error("Erreur livraison:", error);
            displayNotification("Erreur de confirmation", error.message, "danger")
        } else {
            displayNotification("Livraison confirmée", `Commande ${id.slice(0, 8)} marquée comme livrée ✅`, "success")
            fetchOrders();
        }
    };

    if (loading || loadingOrders) {
        return <Loading />;
    }

    const deliveredOrders = orders.filter((o) => o.delivered);
    const pendingOrders = orders.filter((o) => !o.delivered);

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

    const displayOrders = activeTab === 'pending' ? pendingOrders : deliveredOrders;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-rayonblue">Gestion des Commandes</h1>

                {/* Onglets */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${activeTab === 'pending'
                            ? 'bg-rayonblue text-white'
                            : 'bg-white text-rayonblue border-2 border-rayonblue hover:bg-blue-50'
                            }`}
                    >
                        📦 En attente ({pendingOrders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('delivered')}
                        className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${activeTab === 'delivered'
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
                                {activeTab === 'pending'
                                    ? 'Aucune commande en attente'
                                    : 'Aucune commande livrée'}
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
                                                    {order.price.toFixed(2)} €
                                                </span>
                                            </div>
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

                                            {!order.delivered && (
                                                <button
                                                    onClick={() => confirmDelivery(order.id)}
                                                    className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-lg transition flex items-center justify-center text-xl"
                                                    title="Marquer comme livrée"
                                                >
                                                    ✓
                                                </button>
                                            )}

                                            {order.delivered && (
                                                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-xl">
                                                    ✓
                                                </div>
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
                                                    {order.price.toFixed(2)} €
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
                                                    <p className="text-gray-800 font-medium">{order.id.slice(0, 8)}...</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-xs">Statut</p>
                                                    <p className={`font-medium ${order.delivered ? 'text-green-600' : 'text-orange-600'}`}>
                                                        {order.delivered ? '✓ Livrée' : '📦 En attente'}
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
                                                        <p className="text-gray-800 font-medium">{order.client_id.slice(0, 8)}...</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Bouton de confirmation en bas */}
                                        {!order.delivered && (
                                            <div className="mt-4">
                                                <button
                                                    onClick={() => confirmDelivery(order.id)}
                                                    className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition"
                                                >
                                                    ✓ Confirmer la livraison
                                                </button>
                                            </div>
                                        )}
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