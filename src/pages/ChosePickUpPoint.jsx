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
        console.log("Point selectionné : ", point)
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
            // 🔧 CHANGEMENT : Ne plus inclure pickupPointId dans chaque produit
            const cartItems = productsInCart.map(p => ({
                id: p.id,
                name: p.name,
                salePrice: parseFloat(p.salePrice),
                weight: parseFloat(p.weight),
                quantity: parseInt(cart.content[p.id])
                // ❌ RETIRÉ : pickupPointId: currPoint.id
            }));

            console.log("Données envoyées à Stripe:", {
                cart: cartItems,
                pickupPointId: currPoint.id, // ✅ UNE SEULE FOIS ici
                shippingCost: parseFloat(shippingCost),
                userId: user.id
            });

            // Invoquer la fonction edge pour créer la session Stripe
            const { data, error } = await supabase.functions.invoke("create-checkout-session", {
                body: {
                    cart: cartItems,
                    pickupPointId: currPoint.id, // ✅ Envoyé au niveau racine
                    shippingCost: parseFloat(shippingCost),
                    userId: user.id,
                    successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
                    cancelUrl: `${window.location.origin}/cart`,
                }
            });

            if (error) {
                console.error("Erreur fonction edge Stripe :", error);
                displayNotification("Erreur de paiement", error.message || "Une erreur est survenue", "danger");
                return;
            }

            if (data?.url) {
                window.location.href = data.url;
            } else {
                console.error("Aucune URL Stripe renvoyée par la fonction edge.");
                displayNotification("Erreur de paiement", "Aucune URL de paiement reçue", "danger");
            }

        } catch (err) {
            console.error("Erreur Stripe :", err);
            displayNotification("Erreur de paiement", err.message || "Une erreur est survenue", "danger");
        }
    }

    return (
        <>
            <h1 className="text-[#2E2EFF] text-5xl lg:text-7xl font-extrabold leading-tight ml-5 mt-5">
                Choix du point de livraison
            </h1>

            {loading ? <Loading /> : (
                <>
                    {/* Relay points nearby */}
                    <div key="RelayPointsNearby" className='flex lg:flex-row flex-col'>
                        <div style={{ padding: "2rem", fontFamily: "sans-serif" }} className="lg:w-1/2">
                            <div className="flex items-start">
                                <p className="ml-5 text-[#3435FF] text-3xl lg:text-4xl mb-2 mt-10 font-extrabold text-left">
                                    Points relais proches de moi
                                </p>
                            </div>
                            <h2 className="mb-4">Dans quelle ville souhaitez-vous récupérer votre colis ?</h2>

                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Code postal"
                                    value={chosenPostalCode}
                                    onChange={(e) => setChosenPostalCode(e.target.value)}
                                    className="border rounded p-2 w-full max-w-xs"
                                />
                            </div>

                            <FunctionButton
                                buttonText={loadingPickup ? "Chargement..." : "Rechercher"}
                                fun={async () => {
                                    if (chosenPostalCode.trim()) {
                                        await fetchPickupPoints(chosenPostalCode);
                                    }
                                }}
                                disabled={loadingPickup || !chosenPostalCode.trim()}
                                className="bg-rayonorange mt-3 w-80 h-10"
                            />

                            <FunctionButton
                                buttonText={loadingPickup ? "Chargement..." : "Me localiser"}
                                fun={async () => {
                                    if (!currentLatitude || !currentLongitude) {
                                        displayNotification("Géolocalisation non disponible", "Veuillez autoriser l'accès à votre position", "warning");
                                        return;
                                    }
                                    setChosenCoords({});
                                    const code = await reverseGeocode(currentLatitude, currentLongitude);
                                    if (code) {
                                        await fetchPickupPoints(code);
                                    }
                                }}
                                className="bg-rayonorange mt-3 w-80 h-10"
                            />

                            <FunctionButton
                                buttonText="Valider le point relais"
                                fun={handleValidate}
                                className={`mt-3 w-80 h-10 ${currPoint.id != 0
                                    ? 'bg-[#FF8200] text-white hover:bg-[#ff9800]'
                                    : 'bg-[#878787] text-white'
                                    }`}
                            />

                            {errorPickup && <p style={{ color: "red" }} className="mt-4">{errorPickup}</p>}

                            {pickupPoints.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="font-bold mb-3">Points relais disponibles :</h3>
                                    <ul className="space-y-2">
                                        {pickupPoints.map((p) => (
                                            <React.Fragment key={p.id}>
                                                <li className={p.id == currPoint.id ? "border p-1 rounded hover:bg-gray-50 bg-[#8FF29F] hover:bg-[#00C921]" : "border p-1 rounded hover:bg-gray-50 hover:bg-[#cccccc]"} onClick={() => selectPoint(p)} >
                                                    <strong>{p.name}</strong> - {p.address1.toLowerCase()}, {p.zipCode} {p.city}
                                                </li>
                                                {currPoint.id == p.id && (
                                                    <div>
                                                        {currPoint.openingHours && currPoint.openingHours.length > 0 ? (
                                                            <div>
                                                                <strong>Horaires d'ouverture :</strong>

                                                                {[1, 2, 3, 4, 5, 6, 7].map((dayNb) => {
                                                                    const slots = p.openingHours.filter(
                                                                        (d) => Number(d.dayId) === dayNb
                                                                    );

                                                                    return (
                                                                        <div key={dayNb}>
                                                                            {daysMap[dayNb]} :{" "}
                                                                            {slots.length > 0 ? (
                                                                                slots
                                                                                    .map((s) => `${s.startTime} - ${s.endTime}`)
                                                                                    .join(" | ")
                                                                            ) : (
                                                                                "Fermé"
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div>Non renseignées</div>
                                                        )}
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="lg:w-1/2 flex items-start justify-center p-4 mt-10">
                            <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-2xl">
                                <div id="map" className="h-[80vh] w-full">
                                    <MapContainer
                                        className="h-full w-full"
                                        center={getMapCenter()}
                                        zoom={13}
                                        scrollWheelZoom={true}
                                        key={`${chosenCoords.latitude}-${chosenCoords.longitude}-${pickupPoints.length}`}
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />

                                        {currentLatitude && currentLongitude && (
                                            <Marker
                                                position={[currentLatitude, currentLongitude]}
                                                icon={redIcon}
                                            >
                                                <Popup>Vous êtes ici 📍</Popup>
                                            </Marker>
                                        )}

                                        {pickupPoints.length > 0 &&
                                            pickupPoints.map((pickupPoint, index) => (
                                                <Marker
                                                    key={pickupPoint.id || index}
                                                    position={[
                                                        parseFloat(pickupPoint.latitude.replace(",", ".")),
                                                        parseFloat(pickupPoint.longitude.replace(",", ".")),
                                                    ]}
                                                    icon={orangeIcon}
                                                    eventHandlers={{
                                                        click: () => {
                                                            setCurrPoint(pickupPoint)
                                                        },
                                                    }}
                                                >
                                                    <Popup>
                                                        <strong>{pickupPoint.name}</strong> 📬<br />
                                                        {pickupPoint.address}<br />
                                                        {pickupPoint.postalCode} {pickupPoint.city}
                                                    </Popup>
                                                </Marker>
                                            ))
                                        }
                                    </MapContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}

export default ChosePickUpPoint