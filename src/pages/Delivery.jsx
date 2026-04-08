// Importing dependencies
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@lib/supabaseClient.js';
import { useNavigate } from 'react-router-dom';
import { useAuthor } from '@context/AuthorContext.jsx'
import { displayNotification } from '@lib/displayNotification.jsx';
import 'leaflet/dist/leaflet.css';

// Importing common components
import Loading from "@common/Loading.jsx"

function Delivery() {

    const [loading, setLoading] = useState(true);
    const [ongoingDeliveries, setOngoingDeliveries] = useState([]);
    const [expanded, setExpanded] = useState(null);
    const isNotified = useRef(false)

    const { user, loading: authorLoading, checkHasRights } = useAuthor()
    const navigate = useNavigate()

    // only accessible to users (this page needs user info)
    useEffect(() => {
        if (!user && !loading) {
            displayNotification("Vous devez vous connecter pour utiliser cette fonctionnalité !", "Connexion requise", "warning")
            navigate('/login')
            return;
        }
    }, [user, loading, navigate])

    useEffect(() => {
        if (!user) return;

        const fetchOngoingDeliveries = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('cart')
                .select('*')
                .eq('client_id', user.id)
                .eq('delivered', false)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Erreur de chargement des livraisons en cours :', error)
                displayNotification("Erreur de chargement des livraisons en cours", error.message, "danger")
            } else {
                setOngoingDeliveries(data);
                console.log("ongoingDeliveries", data)
            }
            setLoading(false);
        };

        fetchOngoingDeliveries();
    }, [user]);

    useEffect(() => {
        if (authorLoading) return;
        if (!user) {
            navigate('/login')
            notify("Vous devez être connectés et avoir les droits pour passer afficher vos livraison")
        } else {
            checkHasRights(user.id)
                .then((rights) => {
                    if (!rights) {
                        notify("Vous n'avez pas (encore ?) les droits. Pour passer une commande, veuillez déposer un fichier dans votre espace compte")
                        navigate('/account')
                    }
                })
        }
    }, [authorLoading])

    function notify(message) {
        if (isNotified.current) return;
        isNotified.current = true
        displayNotification(message, "warn")
    }




    const toggleExpand = (id) => {
        setExpanded(prev => (prev === id ? null : id));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateTotal = (content) => {
        return content.reduce((sum, product) => sum + product.quantity, 0);
    };

    return (
        <>
            {loading ? (
                <Loading />
            ) : (
                <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                    {/* Header Section */}
                    <div className="bg-gradient-to-br from-[#3435FF] via-[#2526B7] to-[#1F2099] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF8200] opacity-10 rounded-full blur-3xl"></div>
                        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 relative z-10">
                            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-2">Mes Livraisons</h1>
                            <p className="text-blue-100 text-lg">
                                {ongoingDeliveries.length} {ongoingDeliveries.length > 1 ? 'commandes en cours' : 'commande en cours'}
                            </p>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
                        {ongoingDeliveries.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-md p-12 text-center">
                                <div className="text-6xl mb-4">📦</div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                    Aucune livraison en cours
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Vous n'avez pas de commande en cours de livraison
                                </p>
                                <a
                                    href="/catalog"
                                    className="inline-block bg-[#3435FF] hover:bg-[#5253ff] text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                                >
                                    Découvrir nos produits
                                </a>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {ongoingDeliveries.map(delivery => (
                                    <div
                                        key={delivery.id}
                                        className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100 overflow-hidden"
                                    >
                                        {/* Delivery Header */}
                                        <div className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="bg-[#FF8200] text-white px-3 py-1 rounded-full text-sm font-semibold">
                                                            En cours
                                                        </span>
                                                        <span className="text-gray-500 text-sm">
                                                            Commande du {formatDate(delivery.created_at)}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-6 mt-3">
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-5 h-5 text-[#3435FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                            </svg>
                                                            <span className="text-gray-700 font-medium">
                                                                {calculateTotal(delivery.content)} articles
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-5 h-5 text-[#FF8200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className="text-[#FF8200] font-bold text-lg">
                                                                {delivery.price}€
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => toggleExpand(delivery.id)}
                                                    className="ml-4 px-6 py-2 bg-[#3435FF] hover:bg-[#5253ff] text-white rounded-lg font-semibold transition-all shadow-md flex items-center gap-2"
                                                >
                                                    {expanded === delivery.id ? (
                                                        <>
                                                            Fermer
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                            </svg>
                                                        </>
                                                    ) : (
                                                        <>
                                                            Détails
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {expanded === delivery.id && (
                                            <div className="border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white p-6">
                                                <h3 className="text-2xl font-bold text-[#3435FF] mb-6">
                                                    Détails de la commande
                                                </h3>

                                                <div className="grid md:grid-cols-2 gap-6 mb-6">
                                                    {/* Order Info Card */}
                                                    <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                                                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                            <svg className="w-5 h-5 text-[#3435FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Informations
                                                        </h4>
                                                        <div className="space-y-3 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Date de commande</span>
                                                                <span className="font-semibold text-gray-800">
                                                                    {formatDate(delivery.created_at)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Référence</span>
                                                                <span className="font-mono font-semibold text-[#3435FF]">
                                                                    {delivery.orderReference || 'En attente'}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Total articles</span>
                                                                <span className="font-semibold text-gray-800">
                                                                    {calculateTotal(delivery.content)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between pt-3 border-t">
                                                                <span className="text-gray-600 font-semibold">Prix total</span>
                                                                <span className="font-bold text-[#FF8200] text-lg">
                                                                    {delivery.price}€
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Tracking Card */}
                                                    <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                                                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                            <svg className="w-5 h-5 text-[#FF8200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                            Suivi du colis
                                                        </h4>
                                                        <div className="space-y-4">
                                                            {delivery.trackingUrl ? (
                                                                <>
                                                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                                        <p className="text-green-800 text-sm font-medium">
                                                                            ✓ Votre colis est expédié
                                                                        </p>
                                                                    </div>
                                                                    <a
                                                                        href={delivery.trackingUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="block w-full text-center bg-gradient-to-r from-[#FF8200] to-[#ff9800] hover:from-[#ff9800] hover:to-[#FF8200] text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                                                    >
                                                                        🚚 Suivre mon colis
                                                                    </a>
                                                                </>
                                                            ) : (
                                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                                                    <svg className="w-12 h-12 text-blue-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    <p className="text-blue-800 text-sm font-medium">
                                                                        Étiquette en cours de création
                                                                    </p>
                                                                    <p className="text-blue-600 text-xs mt-1">
                                                                        Vous recevrez un lien de suivi sous peu
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Products Table */}
                                                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                                                    <div className="bg-gradient-to-r from-[#3435FF] to-[#5253ff] px-5 py-3">
                                                        <h4 className="font-bold text-white flex items-center gap-2">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                            </svg>
                                                            Contenu du colis
                                                        </h4>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                        Produit
                                                                    </th>
                                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                        Quantité
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                {delivery.content.map((product, idx) => (
                                                                    <tr key={product.id || idx} className="hover:bg-gray-50">
                                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                                            <div className="text-sm font-medium text-gray-900">
                                                                                {product.name}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                            <span className="inline-flex items-center justify-center w-8 h-8 bg-[#3435FF] text-white rounded-full font-bold text-sm">
                                                                                {product.quantity}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

export default Delivery