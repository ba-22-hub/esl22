// Importing dependencies
import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { useAuthor } from '@context/AuthorContext.jsx'
import { useNavigate } from 'react-router-dom';
import { useCart } from "@context/CartContext.jsx";
import { supabase } from "@lib/supabaseClient";
import { displayNotification } from '@lib/displayNotification.jsx';

// Importing common components
import Loading from "@common/Loading.jsx";

// Importing assets
import roundLogo from "@assets/logos/roundLogo.png"

// Composant mémoïsé pour éviter les re-renders inutiles
const DisplayProductCard = memo(({ product, quantity, onAdd, onRemove, roundTwoDigits }) => {
    return (
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-4 border border-gray-100">
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 flex-shrink-0 bg-gray-50 rounded-lg p-2">
                    <img
                        src={product.imageUrl || roundLogo}
                        alt={product.name}
                        className="w-full h-full object-contain"
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-[#3435FF] font-bold text-lg truncate">
                        {product.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                        {product.weight}g • {product.category}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                        {quantity === 1 ? (
                            <button
                                onClick={onRemove}
                                className="w-8 h-8 bg-[#FF8200] hover:bg-[#ff9800] text-white rounded-full flex items-center justify-center transition-all shadow-md"
                            >
                                <svg viewBox="0 0 32 32" fill="currentColor" className="h-4 w-4">
                                    <path d="M13.5 6.5V7h5v-.5a2.5 2.5 0 0 0-5 0Zm-2 .5v-.5a4.5 4.5 0 1 1 9 0V7H28a1 1 0 1 1 0 2h-1.508L24.6 25.568A5 5 0 0 1 19.63 30h-7.26a5 5 0 0 1-4.97-4.432L5.508 9H4a1 1 0 0 1 0-2h7.5Zm2.5 6.5a1 1 0 1 0-2 0v10a1 1 0 1 0 2 0v-10Zm5-1a1 1 0 0 0-1 1v10a1 1 0 1 0 2 0v-10a1 1 0 0 0-1-1Z" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                onClick={onRemove}
                                className="w-8 h-8 bg-[#FF8200] hover:bg-[#ff9800] text-white rounded-full font-bold flex items-center justify-center transition-all shadow-md"
                            >
                                −
                            </button>
                        )}
                        <span className="text-[#3435FF] text-xl font-bold min-w-[2rem] text-center">
                            {quantity}
                        </span>
                        <button
                            onClick={onAdd}
                            className="w-8 h-8 bg-[#3435FF] hover:bg-[#5253ff] text-white rounded-full font-bold flex items-center justify-center transition-all shadow-md"
                        >
                            +
                        </button>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-sm text-gray-500 hidden lg:block">
                        {quantity} × {product.salePrice}€
                    </div>
                    <div className="text-[#FF8200] text-2xl font-bold">
                        {roundTwoDigits(quantity * product.salePrice)}€
                    </div>
                </div>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Comparaison personnalisée pour éviter les re-renders inutiles
    return prevProps.product.id === nextProps.product.id &&
        prevProps.quantity === nextProps.quantity &&
        prevProps.product.imageUrl === nextProps.product.imageUrl;
});

DisplayProductCard.displayName = 'DisplayProductCard';

function Cart() {
    const [productsInCart, setProductsInCart] = useState([])
    const [shippingCost, setShippingCost] = useState(1.35)
    const isNotified = useRef(false)
    const [loading, setLoading] = useState(true);
    const [stockIncertainThreshold, setStockIncertainThreshold] = useState(3);
    const shippingCostFetched = useRef(false)
    const prevCartIds = useRef([])

    const { user, loading: authorLoading, checkHasRights } = useAuthor()
    const { cart, setCart } = useCart()

    let navigate = useNavigate()

    // Fonction utilitaire mémoïsée
    const roundTwoDigits = useCallback((nb) => {
        return Math.round(nb * 100) / 100
    }, []);

    // Calculs mémoïsés - ne recalculent que si productsInCart ou cart.content changent
    const { productsPriceTotal, productsWeightTotal, productsNumberTotal } = useMemo(() => {
        if (productsInCart.length === 0 || !cart?.content) {
            return {
                productsPriceTotal: 0,
                productsWeightTotal: 0,
                productsNumberTotal: 0
            };
        }

        const priceTotal = roundTwoDigits(
            productsInCart
                .map((product) => parseFloat(product.salePrice) * parseFloat(cart.content[product.id] || 0))
                .reduce((total, price) => total + price, 0)
        );

        const weightTotal = roundTwoDigits(
            productsInCart
                .map((product) => parseFloat(product.weight) * parseFloat(cart.content[product.id] || 0))
                .reduce((total, weight) => total + weight, 0)
        );

        const numberTotal = Object.keys(cart.content)
            .map(k => cart.content[k])
            .reduce((acc, number) => acc + number, 0);

        return {
            productsPriceTotal: priceTotal,
            productsWeightTotal: weightTotal,
            productsNumberTotal: numberTotal
        };
    }, [productsInCart, cart?.content, roundTwoDigits]);

    // Charger le threshold
    useEffect(() => {
        const fetchStockIncertainThreshold = async () => {
            const { data, error } = await supabase
                .from('constants')
                .select('value')
                .eq("name", "stockIncertainThreshold")
                .maybeSingle();
            if (!error && data) {
                setStockIncertainThreshold(data.value)
            }
        };
        fetchStockIncertainThreshold();
    }, []);

    useEffect(() => {
        if (authorLoading) return;
        if (!user) {
            navigate('/login')
            notify("Vous devez être connectés et avoir les droits pour passer commande")
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
        displayNotification(message, "", "warn")
    }

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

    // Charger les produits uniquement quand la liste d'IDs change
    useEffect(() => {
        if (cart === null) {
            setLoading(true)
            return;
        }

        if (!cart.content) {
            setProductsInCart([])
            setLoading(false)
            return;
        }

        const cartKeys = Object.keys(cart.content).sort()
        const prevKeys = prevCartIds.current

        const idsChanged =
            cartKeys.length !== prevKeys.length ||
            cartKeys.some((id, i) => id !== prevKeys[i])

        if (!idsChanged) {
            setLoading(false)
            return
        }

        prevCartIds.current = cartKeys

        if (cartKeys.length === 0) {
            setProductsInCart([])
            setLoading(false)
            return
        }

        const fetchDataProductsInCart = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .in("id", cartKeys);

            if (error) {
                displayNotification("Erreur de chargement des produits", error.message, "danger")
                setLoading(false);
            } else {
                const productsWithImages = await Promise.all(
                    data.map(async product => {
                        const { data: imgData, error: imgError } = await supabase
                            .storage
                            .from("images")
                            .download(product.image_name);

                        if (!imgError && imgData) {
                            product.imageUrl = URL.createObjectURL(imgData);
                        }
                        return product;
                    })
                );
                setProductsInCart(productsWithImages);
                setLoading(false);
            }
        };

        fetchDataProductsInCart();
    }, [cart]);

    // Handlers mémoïsés pour éviter de recréer les fonctions à chaque render
    const handleAddToCart = useCallback((product) => {
        const productId = product.id.toString();
        const productInCart = cart?.content?.[productId];
        if (product.stock > productInCart) {
            if (productInCart < product.max_order) {
                setCart(prev => ({
                    ...prev,
                    content: {
                        ...prev.content,
                        [productId]: (prev.content[productId] || 0) + 1,
                    }
                }));
            } else {
                displayNotification(
                    "Quantité de " + product.name + " maximale atteinte",
                    "Vous ne pouvez pas commander plus de " + product.max_order + " rations de " + product.name + " à la fois.",
                    "danger"
                );
            }
        } else {
            displayNotification(
                "Stock de " + product.name + " insuffisant",
                "",
                "danger"
            );
        }
    }, [setCart, cart]);

    const handleRemoveFromCart = useCallback((productId) => {
        setCart(prevData => {
            if (!prevData?.content || !prevData.content[productId]) return prevData;

            if (prevData.content[productId] <= 1) {
                const newCart = { ...prevData };
                delete newCart.content[productId];
                return newCart;
            } else {
                return {
                    ...prevData,
                    content: {
                        ...prevData.content,
                        [productId]: prevData.content[productId] - 1,
                    }
                };
            }
        });
    }, [setCart]);

    const handleValidate = useCallback(async () => {
        if (!cart?.content || Object.keys(cart.content).length === 0) {
            displayNotification("Échec de validation du panier", "Le panier est vide", "danger")
            return;
        }

        if (productsPriceTotal < 0.5) {
            displayNotification("Échec de validation du panier", "Le total produits doit être d'au moins 0.5€ pour pouvoir procéder au payement en ligne", "danger")
            return;
        }

        const { data: userData, error: userError } = await supabase
            .from("User")
            .select("weight_limit, weight_min_limit, current_weight, price_limit, current_price, order_limit, current_order")
            .eq('id', user.id)
            .single();

        if (userError) {
            displayNotification("Échec de validation du panier", "Erreur lors du chargement des limites liées à votre compte : " + userError.message, "danger")
            return;
        }

        const limits = userData;

        if (limits.weight_limit && (limits.current_weight + productsWeightTotal) > limits.weight_limit) {
            displayNotification("Échec de validation du panier", "Condition de poids non respectée", "danger", 0)
            return;
        }

        const outOfStockProducts = productsInCart.filter(p => cart.content[p.id] > p.stock);
        if (outOfStockProducts.length > 0) {
            displayNotification("Échec de validation du panier", "Stock insuffisant", "danger", 7000);
            return;
        }

        navigate("/chose-pickup-point")
    }, [cart, productsPriceTotal, productsWeightTotal, productsInCart, user, navigate]);

    return (
        <>
            {loading || authorLoading ? (
                <Loading />
            ) : (
                <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                    <div className="bg-gradient-to-br from-[#3435FF] via-[#2526B7] to-[#1F2099] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF8200] opacity-10 rounded-full blur-3xl"></div>
                        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 relative z-10">
                            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-2">Mon Panier</h1>
                            <p className="text-blue-100 text-lg">
                                {productsNumberTotal} {productsNumberTotal > 1 ? 'produits' : 'produit'} • {productsWeightTotal / 1000}kg
                            </p>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-bold text-[#3435FF]">
                                        Produits ({productsNumberTotal})
                                    </h2>
                                    <a
                                        href="/catalog"
                                        className="text-[#FF8200] hover:text-[#ff9800] font-semibold text-sm transition-colors"
                                    >
                                        + Ajouter des produits
                                    </a>
                                </div>

                                {productsInCart.length === 0 ? (
                                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                                        <div className="text-6xl mb-4">🛒</div>
                                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                            Votre panier est vide
                                        </h3>
                                        <p className="text-gray-600 mb-6">
                                            Découvrez nos produits et ajoutez-les à votre panier
                                        </p>
                                        <a
                                            href="/catalog"
                                            className="inline-block bg-[#3435FF] hover:bg-[#5253ff] text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                                        >
                                            Voir les produits
                                        </a>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {productsInCart.map((product) => (
                                            cart?.content?.[product.id] && (
                                                <DisplayProductCard
                                                    key={product.id}
                                                    product={product}
                                                    quantity={cart.content[product.id]}
                                                    onAdd={() => handleAddToCart(product)}
                                                    onRemove={() => handleRemoveFromCart(product.id)}
                                                    roundTwoDigits={roundTwoDigits}
                                                />
                                            )
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-6 border-t-4 border-[#FF8200]">
                                    <h2 className="text-2xl font-bold text-[#3435FF] mb-6">
                                        Récapitulatif
                                    </h2>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between text-gray-700">
                                            <span>Total produits</span>
                                            <span className="font-semibold">{productsPriceTotal}€</span>
                                        </div>

                                        <div className="flex justify-between text-gray-700">
                                            <span>Poids total</span>
                                            <span className="font-semibold">{productsWeightTotal / 1000}kg</span>
                                        </div>

                                        <div className="flex justify-between text-gray-700">
                                            <span className="text-sm">Participation solidaire</span>
                                            <span className="font-semibold">{shippingCost}€</span>
                                        </div>

                                        <div className="flex justify-between text-gray-700">
                                            <span>Nombre de produits</span>
                                            <span className="font-semibold">{productsNumberTotal}</span>
                                        </div>

                                        <div className="border-t-2 border-gray-200 pt-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-2xl font-bold text-[#3435FF]">Total</span>
                                                <span className="text-3xl font-bold text-[#FF8200]">
                                                    {roundTwoDigits(productsPriceTotal + shippingCost)}€
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleValidate}
                                        disabled={!cart?.content || Object.keys(cart.content).length === 0}
                                        className={`w-full py-4 rounded-lg font-bold text-lg transition-all shadow-lg ${!cart?.content || Object.keys(cart.content).length === 0
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-[#FF8200] to-[#ff9800] hover:from-[#ff9800] hover:to-[#FF8200] text-white hover:shadow-xl transform hover:-translate-y-1'
                                            }`}
                                    >
                                        {!cart?.content || Object.keys(cart.content).length === 0
                                            ? 'Panier vide'
                                            : 'Valider ma commande'
                                        }
                                    </button>

                                    <div className="mt-4 text-xs text-center text-gray-500">
                                        <p>🔒 Paiement sécurisé</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
export default Cart