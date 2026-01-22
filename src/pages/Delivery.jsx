// Importing dependencies
import React, { useEffect, useState } from 'react';
import { supabase } from '@lib/supabaseClient.js';
import { useNavigate } from 'react-router-dom';
import { useAuthor } from '@context/AuthorContext.jsx'
import { displayNotification } from '@lib/displayNotification.jsx';
import 'leaflet/dist/leaflet.css';

// Importing common components
import Loading from "@common/Loading.jsx"
import FunctionButton from '@common/FunctionButton.jsx';

/**
 * The Delivery page.
 * @returns {React.ReactElement} Delivery component.
 */

function Delivery() {
    const [loading, setLoading] = useState(false);
    const [ongoingDeliveries, setOngoingDeliveries] = useState([]);
    const [expanded, setExpanded] = useState(null);

    const { user } = useAuthor();
    const navigate = useNavigate()

    // only accessible to users (this page needs user info)
    useEffect(() => {
        if (loading) return;
        if (!user) {
            displayNotification("Vous devez vous connecter pour utiliser cette fonctionnalité !", "Connexion requise", "warning")
            navigate('/login')
            return;
        }
    }, [loading, user])

    useEffect(() => {
        if (loading) return;
        // Récupérer la position de l'utilisateur UNE SEULE FOIS au chargement

        if (!user) return;
        const fetchOngoingDeliveries = async () => {
            const { data, error } = await supabase
                .from('cart')
                .select('*')
                .eq('client_id', user.id)
                .eq('delivered', false);
            if (error) {
                console.error('Erreur de chargement des livraisons en cours :', error)
                displayNotification("Erreur de chargement des livraisons en cours", error.message, "danger")
            }
            else {
                setOngoingDeliveries(data);
                console.log("ongoingDeliveries", data)
            }
            setLoading(false);
        };

        fetchOngoingDeliveries();
    }, [loading]);

    const toggleExpand = (id) => {
        setExpanded(prev => (prev === id ? null : id));
    };

    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };

    return (
        <>
            <h1 className="text-[#2E2EFF] text-5xl lg:text-7xl font-extrabold leading-tight ml-5 mt-5">Livraisons</h1>

            {loading ? <Loading /> : (
                <>
                    {/*Ongoing deliveries*/}
                    <div key="OngoingDeliveries">
                        <div className="flex items-start ...">
                            <p className="ml-5 text-[#3435FF] text-3xl lg:text-4xl mb-2 mt-10 font-extrabold text-left">Mes livraisons en cours</p>
                        </div>

                        <div className="overflow-x-auto bg-white shadow rounded">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100 text-left text-sm font-medium text-gray-700">
                                    <tr>
                                        <th className="px-6 py-3">Date de commande</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 text-sm">
                                    {ongoingDeliveries.map(delivery => (
                                        <React.Fragment key={delivery.id}>
                                            <tr>
                                                {/* Command date */}
                                                <td className="px-6 py-4">
                                                    {new Date(delivery.created_at).toLocaleString('fr-FR', options)}

                                                    {/* Fold / unfold buttons */}
                                                    <FunctionButton
                                                        buttonText={expanded === delivery.id ? 'Fermer' : 'Déplier'}
                                                        fun={() => toggleExpand(delivery.id)}
                                                        className="text-blue-600 hover:underline mr-4 bg-transparent p-0 shadow-none"
                                                    />
                                                </td>

                                            </tr>
                                            {(user && expanded === delivery.id) && (
                                                <>
                                                    <tr className="bg-gray-50">
                                                        <div colSpan="5" className="px-6 py-4">
                                                            <h2 className="text-rayonblue font-bold text-2xl mb-3">Récapitulatif de la livraison</h2>
                                                            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                                                                {/* Command date */}
                                                                <div>
                                                                    <strong>Date de la commande :</strong>{' '}
                                                                    {
                                                                        <span className="ml-1">
                                                                            {new Date(delivery.created_at).toLocaleString('fr-FR', options)}
                                                                        </span>
                                                                    }
                                                                </div>

                                                                {/* Price */}
                                                                <div>
                                                                    <strong>Prix :</strong>{' '}
                                                                    {
                                                                        <span className="ml-1">
                                                                            {delivery["price"]} €
                                                                        </span>
                                                                    }
                                                                </div>

                                                                {/* Number of products */}
                                                                <div>
                                                                    <strong>Nombre total d'articles :</strong>{' '}
                                                                    {
                                                                        <span className="ml-1">
                                                                            {delivery.content.reduce((sum, product) => sum + product.quantity, 0)}
                                                                        </span>
                                                                    }
                                                                </div>

                                                                {/* Content */}
                                                                <div>
                                                                    <strong>Contenu du colis :</strong>{' '}
                                                                    <table className="min-w-full divide-y divide-gray-200">
                                                                        <thead className="bg-gray-100 text-left text-sm font-medium text-gray-700">
                                                                            <tr>
                                                                                <th className="px-6 py-3">Produit</th>
                                                                                <th className="px-6 py-3">Quantité</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                                            {delivery.content.map((product) => (
                                                                                <tr key={product.id}>
                                                                                    <td className="px-6 py-4">{product.name}</td>
                                                                                    <td className="px-6 py-4">{product.quantity}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>

                                                                {/* Order reference */}
                                                                <div>
                                                                    <strong>Référence de la commande :</strong>{' '}
                                                                    {
                                                                        <span className="ml-1">
                                                                            {delivery["orderReference"]}
                                                                        </span>
                                                                    }
                                                                </div>

                                                                <div>
                                                                    <a
                                                                        href={delivery["trackingUrl"] ?? delivery["trackingUrl"]}
                                                                        className={`mt-2 text-white px-8 py-3 rounded-lg font-mono text-base font-semibold shadow transition-all ${delivery["trackingUrl"]
                                                                            ? 'bg-[#FF8200] text-white hover:bg-[#ff9800]'
                                                                            : 'bg-[#878787] text-white'
                                                                            }`}
                                                                        target="_blank"
                                                                    >Suivre mon colis</a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </tr>
                                                </>
                                            )}
                                        </React.Fragment>
                                    ))}
                                    {ongoingDeliveries.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-4 text-center text-gray">
                                                Aucune livraison en cours.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}

export default Delivery