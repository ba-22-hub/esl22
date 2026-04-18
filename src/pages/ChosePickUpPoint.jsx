// Importing dependencies
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@lib/supabaseClient.js';
import { useNavigate } from 'react-router-dom';
import { useAuthor } from '@context/AuthorContext.jsx';
import { useCart } from "@context/CartContext.jsx";
import { displayNotification } from '@lib/displayNotification.jsx';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from "leaflet";

// Importing common components
import Loading from "@common/Loading.jsx"
import FunctionButton from '@common/FunctionButton.jsx';

// Importing assets
import redMarker from "@assets/Assets/marker-icon-2x-red.png"
import orangeMarker from "@assets/Assets/marker-icon-2x-orange.png"

function ChosePickUpPoint() {
    const [loading, setLoading] = useState(false);
    const [currentLatitude, setCurrentLatitude] = useState(null);
    const [currentLongitude, setCurrentLongitude] = useState(null);
    const [productsInCart, setProductsInCart] = useState([])
    const [shippingCost, setShippingCost] = useState(1.35) // État pour les frais de port
    const shippingCostFetched = useRef(false)

    const [currPoint, setCurrPoint] = useState({ id: 0 })

    // --- States pour points relais ---
    const [chosenPostalCode, setChosenPostalCode] = useState("");
    const [chosenCoords, setChosenCoords] = useState({});
    const [pickupPoints, setPickupPoints] = useState([]);
    const [loadingPickup, setLoadingPickup] = useState(false);
    const [errorPickup, setErrorPickup] = useState(null);

    const { user } = useAuthor();
    const { cart, setCart } = useCart()
    const navigate = useNavigate()

    const redIcon = L.icon({
        iconUrl: redMarker,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
    });

    const orangeIcon = L.icon({
        iconUrl: orangeMarker,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
    });

    const daysMap = {
        1: "Lundi",
        2: "Mardi",
        3: "Mercredi",
        4: "Jeudi",
        5: "Vendredi",
        6: "Samedi",
        7: "Dimanche",
    };

    // Charger les frais de livraison
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

    // only accessible to users (this page needs user info)
    useEffect(() => {
        if (!user && !loading) {
            displayNotification("Vous devez vous connecter pour utiliser cette fonctionnalité !", "Connexion requise", "warning")
            navigate('/login')
            return;
        }

        if (cart?.content && Object.keys(cart.content).length > 0) {
            fetchProductsInCart();
        }
    }, [user, loading, navigate])

    useEffect(() => {
        const getLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords
                        setCurrentLatitude(latitude)
                        setCurrentLongitude(longitude)
                    },
                    (error) => {
                        displayNotification("Impossible d'accéder à votre localisation", error.message, "warning")
                    }
                )
            } else {
                displayNotification("Impossible d'accéder à votre localisation", "La fonctionnalité de géolocalisation n'est pas supportée par votre navigateur", "warning")
            }
        }

        getLocation();
    }, [user]);

    function selectPoint(point) {
        setCurrPoint(point)
    }

    // --- Fonction pour récupérer les points relais ---
    const fetchPickupPoints = async (postalCode) => {
        setLoadingPickup(true);
        setErrorPickup(null);
        try {
            // Récupérer les coordonnées du code postal
            const coords = await geocode(postalCode);
            if (coords) {
                setChosenCoords(coords);
            }

            const { data, error } = await supabase.functions.invoke('dpd_pickup_points', {
                body: JSON.stringify({
                    postalCode: postalCode,
                    countryCode: 'FR'
                })
            })
            if (error) {
                throw new Error(error)
            } else {
                setPickupPoints(data.points);
            }
        } catch (e) {
            setErrorPickup(e.message);
            displayNotification("Erreur lors de la récupération des points de relais proches", e.message, "danger")
        } finally {
            setLoadingPickup(false);
        }
    };

    async function reverseGeocode(lat, lon) {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;

        const response = await fetch(url, {
            headers: { "User-Agent": "Rayon22" }
        });

        const data = await response.json();
        return data.address.postcode || null;
    }

    async function geocode(postcode, country = "fr") {
        const url = `https://nominatim.openstreetmap.org/search?postalcode=${postcode}&country=${country}&format=json&limit=1`;

        const response = await fetch(url, {
            headers: { "User-Agent": "Rayon22" }
        });

        const data = await response.json();

        if (!data || data.length === 0) return null;

        return {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon)
        };
    }

    // Déterminer le centre de la carte
    const getMapCenter = () => {
        if (chosenCoords.latitude && chosenCoords.longitude) {
            return [chosenCoords.latitude, chosenCoords.longitude];
        }
        if (currentLatitude && currentLongitude) {
            return [currentLatitude, currentLongitude];
        }
        // Position par défaut (France)
        return [46.603354, 1.888334];
    };

    const fetchProductsInCart = async () => {
        if (!cart?.content || Object.keys(cart.content).length === 0) {
            setProductsInCart([])
            return;
        }

        const { data, error } = await supabase
            .from('products')
            .select('id, name, salePrice, weight')
            .in("id", Object.keys(cart.content));

        if (error) {
            displayNotification("Erreur de chargement des produits du panier", error.message, "danger")
            return;
        }

        setProductsInCart(data || [])
    }

    async function handleValidate() {
        if (currPoint.id === 0) {
            displayNotification("Aucun point relais sélectionné", "", "danger");
            return;
        }

        if (!productsInCart || productsInCart.length === 0) {
            displayNotification("Panier vide", "Impossible de valider un panier vide", "danger");
            return;
        }

        // Sauvegarder le point relais dans le panier
        setCart(prev => ({
            ...prev,
            pickupPoint: currPoint
        }));

        try {
            // CHANGEMENT : Ne plus inclure pickupPointId dans chaque produit
            const cartItems = productsInCart.map(p => ({
                id: p.id,
                name: p.name,
                salePrice: parseFloat(p.salePrice),
                weight: parseFloat(p.weight),
                quantity: parseInt(cart.content[p.id])
            }));

            // Invoquer la fonction edge pour créer la session Stripe
            const { data, error } = await supabase.functions.invoke("create-checkout-session", {
                body: {
                    cart: cartItems,
                    pickupPointId: currPoint.id, // Envoyé au niveau racine
                    shippingCost: parseFloat(shippingCost),
                    userId: user.id,
                    successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
                    cancelUrl: `${window.location.origin}/cart`,
                }
            });

            if (error) {
                displayNotification("Erreur de paiement", error.message || "Une erreur est survenue", "danger");
                return;
            }

            if (data?.url) {
                window.location.href = data.url;
            } else {
                displayNotification("Erreur de paiement", "Aucune URL de paiement reçue", "danger");
            }

        } catch (err) {
            displayNotification("Erreur de paiement", err.message || "Une erreur est survenue", "danger");
        }
    }

    return (
        <>
            {loading ? (
                <Loading />
            ) : (
                <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">

                    {/* Header — identique à Delivery */}
                    <div className="bg-gradient-to-br from-[#3435FF] via-[#2526B7] to-[#1F2099] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF8200] opacity-10 rounded-full blur-3xl"></div>
                        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 relative z-10">
                            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-2">Point de livraison</h1>
                            <p className="text-blue-100 text-lg">
                                Choisissez un point relais pour récupérer votre commande
                            </p>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
                        <div className="flex flex-col lg:flex-row gap-6">

                            {/* Panneau gauche */}
                            <div className="lg:w-1/2 bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">

                                {/* Recherche */}
                                <div className="p-6 border-b border-gray-100">
                                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-[#3435FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        Rechercher un point relais
                                    </h4>

                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            placeholder="Code postal (ex. 75001)"
                                            value={chosenPostalCode}
                                            onChange={(e) => setChosenPostalCode(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && chosenPostalCode.trim() && fetchPickupPoints(chosenPostalCode)}
                                            className="flex-1 px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#3435FF]"
                                        />
                                        <button
                                            onClick={() => chosenPostalCode.trim() && fetchPickupPoints(chosenPostalCode)}
                                            disabled={loadingPickup || !chosenPostalCode.trim()}
                                            className="px-5 py-2 text-base font-semibold bg-[#3435FF] hover:bg-[#5253ff] text-white rounded-lg shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {loadingPickup ? "..." : "Rechercher"}
                                        </button>
                                    </div>

                                    <button
                                        onClick={async () => {
                                            if (!currentLatitude || !currentLongitude) {
                                                displayNotification("Géolocalisation non disponible", "Veuillez autoriser l'accès à votre position", "warning");
                                                return;
                                            }
                                            setChosenCoords({});
                                            const code = await reverseGeocode(currentLatitude, currentLongitude);
                                            if (code) await fetchPickupPoints(code);
                                        }}
                                        disabled={loadingPickup}
                                        className="w-full py-2 text-base font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                                    >
                                        <svg className="w-4 h-4 text-[#FF8200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Me localiser
                                    </button>

                                    {errorPickup && (
                                        <p className="text-base text-red-500 mt-3">{errorPickup}</p>
                                    )}
                                </div>

                                {/* Liste des points */}
                                <div className="p-6">
                                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-[#FF8200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Points disponibles
                                    </h4>

                                    {pickupPoints.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="text-4xl mb-3">📍</div>
                                            <p className="text-gray-500 text-base">Entrez un code postal pour voir les points proches</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                            {pickupPoints.map((p) => (
                                                <React.Fragment key={p.id}>
                                                    <div
                                                        onClick={() => selectPoint(p)}
                                                        className={`rounded-xl border p-4 cursor-pointer transition-all ${currPoint.id === p.id
                                                            ? "border-[#3435FF] bg-blue-50 shadow-sm"
                                                            : "border-gray-100 hover:shadow-md hover:border-gray-200 shadow-sm"
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className={`px-2 py-0.5 rounded-full text-sm font-semibold ${currPoint.id === p.id
                                                                        ? "bg-[#3435FF] text-white"
                                                                        : "bg-gray-100 text-gray-500"
                                                                        }`}>
                                                                        {currPoint.id === p.id ? "Sélectionné" : "Disponible"}
                                                                    </span>
                                                                    {p.distance && (
                                                                        <span className="text-sm text-gray-400">{p.distance} km</span>
                                                                    )}
                                                                </div>
                                                                <p className="font-bold text-gray-800 text-base">{p.name}</p>
                                                                <p className="text-gray-500 text-sm mt-0.5">
                                                                    {p.address1.toLowerCase()}, {p.zipCode} {p.city}
                                                                </p>
                                                            </div>
                                                            <svg
                                                                className={`w-5 h-5 mt-1 flex-shrink-0 transition-transform ${currPoint.id === p.id ? "rotate-180 text-[#3435FF]" : "text-gray-300"}`}
                                                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </div>

                                                    {/* Horaires dépliés */}
                                                    {currPoint.id === p.id && (
                                                        <div className="rounded-xl border border-[#3435FF]/20 bg-gradient-to-b from-blue-50 to-white p-4 -mt-1">
                                                            <h5 className="text-sm font-semibold text-[#3435FF] uppercase tracking-wider mb-3">
                                                                Horaires d'ouverture
                                                            </h5>
                                                            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                                                                {[1, 2, 3, 4, 5, 6, 7].map((dayNb) => {
                                                                    const slots = p.openingHours?.filter(d => Number(d.dayId) === dayNb) || [];
                                                                    return (
                                                                        <div key={dayNb} className="flex justify-between text-sm py-0.5 border-b border-gray-100 last:border-0">
                                                                            <span className="text-gray-500">{daysMap[dayNb]}</span>
                                                                            <span className={slots.length ? "text-gray-800 font-medium" : "text-gray-300 italic"}>
                                                                                {slots.length
                                                                                    ? slots.map(s => `${s.startTime}–${s.endTime}`).join(" | ")
                                                                                    : "Fermé"}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Barre de validation */}
                                <div className="px-6 pb-6">
                                    <div className={`rounded-xl p-4 mb-3 border ${currPoint.id !== 0
                                        ? "bg-green-50 border-green-200"
                                        : "bg-gray-50 border-gray-100"
                                        }`}>
                                        <p className="text-base">
                                            {currPoint.id !== 0 ? (
                                                <>
                                                    <span className="font-semibold text-green-800">✓ {currPoint.name}</span>
                                                    <span className="text-green-700 text-sm block mt-0.5">
                                                        {currPoint.address1?.toLowerCase()}, {currPoint.zipCode} {currPoint.city}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-gray-400">Aucun point sélectionné</span>
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleValidate}
                                        disabled={currPoint.id === 0}
                                        className="w-full py-3 font-semibold rounded-lg text-base transition-all shadow-md flex items-center justify-center gap-2
                    bg-[#FF8200] hover:bg-[#ff9800] text-white
                    disabled:bg-gray-100 disabled:text-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Valider ce point relais
                                    </button>
                                </div>
                            </div>

                            {/* Panneau carte */}
                            <div className="lg:w-1/2 bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-[#3435FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                        </svg>
                                        Carte des points relais
                                    </h4>
                                </div>
                                <div style={{ height: "calc(100% - 73px)" }}>
                                    <MapContainer
                                        className="h-full w-full"
                                        style={{ minHeight: "520px" }}
                                        center={getMapCenter()}
                                        zoom={13}
                                        scrollWheelZoom={true}
                                        key={`${chosenCoords.latitude}-${chosenCoords.longitude}-${pickupPoints.length}`}
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        {currentLatitude && currentLongitude && (
                                            <Marker position={[currentLatitude, currentLongitude]} icon={redIcon}>
                                                <Popup>Vous êtes ici 📍</Popup>
                                            </Marker>
                                        )}
                                        {pickupPoints.map((p, i) => (
                                            <Marker
                                                key={p.id || i}
                                                position={[
                                                    parseFloat(p.latitude.replace(",", ".")),
                                                    parseFloat(p.longitude.replace(",", ".")),
                                                ]}
                                                icon={currPoint.id === p.id ? redIcon : orangeIcon}
                                                eventHandlers={{ click: () => setCurrPoint(p) }}
                                            >
                                                <Popup>
                                                    <strong>{p.name}</strong><br />
                                                    {p.address1}, {p.zipCode} {p.city}
                                                </Popup>
                                            </Marker>
                                        ))}
                                    </MapContainer>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default ChosePickUpPoint