// Importing dependencies
import { useState, useEffect, useRef } from 'react';
import { useAuthor } from '@context/AuthorContext.jsx'
import { useNavigate } from 'react-router-dom';
import { useCart } from "@context/CartContext.jsx";
import { supabase } from "@lib/supabaseClient";
import { displayNotification } from '@lib/displayNotification.jsx';

// Importing common components
import FunctionButton from "@common/FunctionButton"
import PageButton from "@common/PageButton.jsx";
import Loading from "@common/Loading.jsx";

// Importing assets
import receipt from "@assets/Assets/ticket-caisse-ecriture.png"
import orangeLine from "@assets/Assets/Trait orange.png"
import orangeShape from "@assets/Assets/Coup crayon orange.svg"
import blueRayonShape from "@assets/Assets/Rayons traits bleus.svg"
import orangeCircle from "@assets/Assets/Cercle orange crayon.png"
import roundLogo from "@assets/logos/roundLogo.png"


/**
 * The Cart page.
 * @returns {React.ReactElement} Cart component.
 */


function Cart() {
    const [productsInCart, setProductsInCart] = useState([])
    const [productsPriceTotal, setProductsPriceTotal] = useState(0)
    const [productsWeightTotal, setProductsWeightTotal] = useState(0)
    const [productsNumberTotal, setProductsNumberTotal] = useState(0)
    const [shippingCost, setShippingCost] = useState(1.35)
    const isNotified = useRef(false)
    const [loading, setLoading] = useState(true);

    const { user, loading: authorLoading, checkHasRights } = useAuthor()
    const { cart, setCart } = useCart()

    let navigate = useNavigate()

    useEffect(() => {
        // star author routine 
        if (authorLoading) return; // no needs to exec the useEffect if the rights aren't known

        if (!user) { // user not login 
            navigate('/login')
            notify("Vous devez être connectés et avoir les droits pour passer commande")
        } else {
            checkHasRights(user.id) // user doesn't have rights
                .then((rights) => {
                    if (!rights) {
                        notify("Vous n'avez pas (encore ?) les droits. Pour passer une commande, veuillez déposer un fichier dans votre espace compte")
                        navigate('/account')
                    }
                })

        }
        // end author routine 

    }, [authorLoading])

    const [stockIncertainThreshold, setStockIncertainThreshold] = useState(3);

    const fetchStockIncertainThreshold = async () => {
        const { data, error } = await supabase
            .from('constants')
            .select('value')
            .eq("name", "stockIncertainThreshold")
            .maybeSingle();
        if (!error) {
            setStockIncertainThreshold(data.value)
        }
    };
    fetchStockIncertainThreshold();

    // function to avoid double notification in the login routine
    function notify(message) {
        console.log(message, isNotified)
        if (isNotified.current) return;  // no need to notify again
        isNotified.current = true
        alert(message)
    }

    function roundTwoDigits(nb) {
        return Math.round(nb * 100) / 100
    }

    useEffect(() => {
        if (cart === null) {
            setLoading(true)
            return;
        }

        const fetchDataProductsInCart = async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .in("id", Object.keys(cart.content));
            if (error) {
                displayNotification("Erreur de chargement des produits", error.message, "danger")
            } else {
                const productsWithImages = await Promise.all(
                    data.map(async product => {
                        const { data: imgData, error: imgError } = await supabase
                            .storage
                            .from("images")
                            .download(product.image_name);

                        if (imgError) {
                            displayNotification("Erreur de chargement de l'image : " + product.image_name, imgError.message, "warning")
                        } else {
                            product.imageUrl = URL.createObjectURL(imgData);
                        }
                        return product;
                    })
                );

                setProductsInCart(productsWithImages);
            }
            setLoading(false);
        };

        const fetchShippingCost = async () => {
            const { data, error } = await supabase
                .from('constants')
                .select('value')
                .eq("name", "shippingCost")
                .maybeSingle();
            if (!error) {
                setShippingCost(data.value)
                setCart(prev => ({
                    ...prev,
                    shippingCost: data.value,
                }));
            }
        };

        fetchShippingCost();
        fetchDataProductsInCart();
    }, [cart]);

    useEffect(() => {
        updateTotals();
    }, [productsInCart]);


    const updateTotals = () => {
        if (productsInCart.length > 0) {
            setProductsPriceTotal(roundTwoDigits(productsInCart.map((product) => (parseFloat(product.salePrice) * parseFloat(cart.content[product.id]))).reduce((priceTotal, price) => priceTotal + price)))
            setProductsWeightTotal(roundTwoDigits(productsInCart.map((product) => (parseFloat(product.weight) * parseFloat(cart.content[product.id]))).reduce((weightTotal, weight) => weightTotal + weight)))
            setProductsNumberTotal(Object.keys(cart.content).map(k => cart.content[k]).reduce((acc, number) => acc + number, 0))
        } else {
            setProductsPriceTotal(0)
            setProductsWeightTotal(0)
            setProductsNumberTotal(0)
        }
    }

    async function handleValidate() {
        checkHasRights(user.id) // user doesn't have rights
            .then((rights) => {
                if (!rights) {
                    displayNotification("Échec de validation du panier", "Vous n'avez pas les droits", "danger")
                    return;
                }
            })
        if (Object.keys(cart.content).length === 0) {
            // Empty cart
            displayNotification("Échec de validation du panier", "Le panier est vide", "danger")
            return;
        } else {
            const productsPriceTotal = productsInCart
                .map(p => parseFloat(p.salePrice) * cart.content[p.id])
                .reduce((a, b) => a + b, 0);

            if (productsPriceTotal < 0.5) {
                displayNotification("Échec de validation du panier", "Le total produits doit être d'au moins 0.5€ pour pouvoir procéder au payement en ligne", "danger")
                return;
            }

        }

        // User's limits check
        const { data: userData, error: userError } = await supabase
            .from("User")
            .select("weight_limit, weight_min_limit, current_weight, price_limit, current_price, order_limit, current_order")
            .eq('id', user.id)
            .single();

        if (userError) {
            displayNotification("Échec de validation du panier", "Erreur lors du chargement des limites liées à votre compte : " + error.message, "danger")
            return;
        }

        const limits = userData;
        const isRespectedLimit = (limit, currentAmount, newAmount) =>
            !limit || (currentAmount + newAmount) <= limit;

        const productsWeightTotal = productsInCart
            .map(p => parseFloat(p.weight) * cart.content[p.id])
            .reduce((a, b) => a + b, 0);

        const productsPriceTotal = productsInCart
            .map(p => parseFloat(p.salePrice) * cart.content[p.id])
            .reduce((a, b) => a + b, 0);

        const productsNumberTotal = Object.keys(cart.content).map(k => cart.content[k]).reduce((a, b) => a + b, 0);

        if (limits.weight_limit && !isRespectedLimit(limits.weight_limit, limits.current_weight, productsWeightTotal)) {
            displayNotification(
                "Échec de validation du panier",
                "Condition de poids non respectée : Seulement " + (limits.weight_limit - limits.current_weight) / 1000 + "kg d'achats possibles restants sur votre compte ce mois-ci.",
                "danger",
                0
            )
            return;
        }
        if (limits.weight_min_limit && productsWeightTotal < limits.weight_min_limit) {
            displayNotification(
                "Échec de validation du panier",
                "Condition de poids non respectée : Le poids du panier doit être d'au moins " + limits.weight_min_limit / 1000 + "kg.",
                "danger",
                0
            )
            return;
        }
        if (limits.price_limit && !isRespectedLimit(limits.price_limit, limits.current_price, productsPriceTotal)) {
            displayNotification(
                "Échec de validation du panier",
                "Condition de prix non respectée : Seulement " + (limits.price_limit - limits.current_price) + "€ d'achats possibles restants sur votre compte ce mois-ci.",
                "danger",
                0
            )
            return;
        }
        if (limits.order_limit && !isRespectedLimit(limits.order_limit, limits.current_order, productsNumberTotal)) {
            displayNotification(
                "Échec de validation du panier",
                "Condition de nombre de produits non respectée : Seulement " + (limits.order_limit - limits.current_order) + " achats possibles restants sur votre compte ce mois-ci.",
                "danger",
                0
            )
            return;
        }

        // Check stock
        const outOfStockProducts = productsInCart.filter(p => cart.content[p.id] > p.stock);
        if (outOfStockProducts.length > 0) {
            const productNames = outOfStockProducts.map(p => p.name).join(", ");
            if (outOfStockProducts.length > 1) {
                displayNotification(
                    "Échec de validation du panier",
                    "Stocks de " + productNames + " insuffisants",
                    "danger",
                    7000
                );
                return;
            } else {
                const productNames = outOfStockProducts.map(p => p.name).join(", ");
                displayNotification(
                    "Échec de validation du panier",
                    "Stock de " + productNames + " insuffisant",
                    "danger",
                    7000
                );
                return;
            }
        }

        const lowStockProduct = productsInCart.filter(p => p.stock < stockIncertainThreshold);
        if (lowStockProduct.length > 0) {
            const productNames = lowStockProduct.map(p => p.name).join(", ");
            if (lowStockProduct.length > 1) {
                if (!confirm("Stocks de " + productNames + " incertains. Cela pourrait avoir un impact sur le délai de votre livraison. Voulez-vous quand même confirmer la livraison ?")) {
                    return;
                }
            } else {
                if (!confirm("Stock de " + productNames + " incertain. Cela pourrait avoir un impact sur le délai de votre livraison. Voulez-vous quand même confirmer la livraison ?")) {
                    return;
                }
            }
        }

        navigate("/chose-pickup-point")
    }



    function displayProductOnReceipt(product, idx) {

        function DisplayButtons({ product }) {
            const AddToCart = () => {
                setCart(prev => ({
                    ...prev,
                    content: {
                        ...prev.content,
                        [product.id]: (prev.content[product.id] || 0) + 1,
                    }
                }));
                updateTotals()
            }

            const RemoveFromCart = () => {
                if (Object.keys(cart.content).includes(product.id)) {   // Should always be true when function is called
                    if (cart.content[product.id] <= 1) {
                        // Removing last item of this product from cart : product removed from cart
                        setCart(prevData => {
                            const newCart = { ...prevData };
                            delete newCart.content[product.id];
                            return newCart;
                        });
                    }
                    else {
                        setCart(prev => ({
                            ...prev,
                            content: {
                                ...prev.content,
                                [product.id]: prev.content[product.id] - 1,
                            }
                        }));
                    }
                }
                updateTotals()
            }

            if (cart.content[product.id] == 1) {
                return <div className="flex jusitfy-end">
                    {/* TRASH CAN BUTTON */}
                    <button type="button" className="text-white bg-[#FF8200] hover:bg-[#ff9800] rounded-full text-sm px-1 py-0.5 mb-2" onClick={RemoveFromCart}>
                        <svg viewBox="0 0 32 32" fill="currentColor" className="h-4 w-4">
                            <path fill="currentColor" d="M13.5 6.5V7h5v-.5a2.5 2.5 0 0 0-5 0Zm-2 .5v-.5a4.5 4.5 0 1 1 9 0V7H28a1 1 0 1 1 0 2h-1.508L24.6 25.568A5 5 0 0 1 19.63 30h-7.26a5 5 0 0 1-4.97-4.432L5.508 9H4a1 1 0 0 1 0-2h7.5Zm2.5 6.5a1 1 0 1 0-2 0v10a1 1 0 1 0 2 0v-10Zm5-1a1 1 0 0 0-1 1v10a1 1 0 1 0 2 0v-10a1 1 0 0 0-1-1Z" />
                        </svg>
                    </button>
                    <p className="text-[#3435FF] text-xl mr-1 ml-1 font-semibold">{cart.content[product.id]}</p>
                    <FunctionButton className="text-white bg-[#3435FF] hover:bg-[#5253ff] rounded-full text-sm px-2 py-0.5 mb-2 ml-0 text-right" buttonText="+" fun={AddToCart} />
                </div>
            }
            else if (cart.content[product.id] > 1) {
                return <div className="flex jusitfy-end">
                    {/* REGULAR MINUS BUTTON */}
                    <FunctionButton className="text-white bg-[#FF8200] hover:bg-[#ff9800] rounded-full text-sm px-2 py-0.5 mb-2" buttonText="-" fun={RemoveFromCart} />
                    <p className="text-[#3435FF] text-xl mr-1 ml-1 font-semibold">{cart.content[product.id]}</p>
                    <FunctionButton className="text-white bg-[#3435FF] hover:bg-[#5253ff] rounded-full text-sm px-2 py-0.5 mb-2 ml-0 text-right" buttonText="+" fun={AddToCart} />
                </div>
            }
        }

        if (Object.keys(cart.content).includes(product.id)) {
            return (
                <div key={idx} className="grid grid-cols-7 text-[#3435FF]">
                    <div className="col-span-1 col-start-1 content-center">
                        <img src={product.imageUrl || roundLogo} alt={product.name} className="lg:ml-2 flex-left w-[60%] object-contain" />
                    </div>
                    <div className="col-span-3 col-start-2 content-center">
                        <p className="text-xl lg:text-2xl font-semibold">{product.name}</p>
                        <p className="text-s">{product.weight}g, {product.category}</p>
                        <DisplayButtons product={product} />
                    </div>
                    <div className="col-span-2 col-start-6 lg:col-span-3 lg:col-start-5  content-center">
                        <p className="text-xl lg:text-2xl flex flex-line font-semibold text-right pl-2 whitespace-nowrap">
                            <span className='hidden lg:block mr-2'>{cart.content[product.id]} × {product.salePrice} = </span>{roundTwoDigits(cart.content[product.id] * product.salePrice)}€
                        </p>
                    </div>
                </div>

            )
        }
    }

    function displayInfoOnCart() {

        return (
            <>
                <PageButton buttonText={'Voir tous nos produits...'} page={'/catalog'} className={"mt-0 mb-5 mx-10 text-sm text-rayonorange"} />
                <div className="flex flex-col mx-10 w-[100%] text-rayonblue">
                    <div className='flex flex-line'>
                        <div className="w-[70%] my-2">
                            Total produits
                        </div>
                        <div className="w-[10%] my-2 font-bold">
                            {productsPriceTotal}€
                        </div>
                    </div>
                    <div className='flex flex-line'>
                        <div className="w-[70%] my-2">
                            Poids total du colis
                        </div>
                        <div className="w-[10%] my-2 font-bold">
                            {productsWeightTotal / 1000}kg
                        </div>
                    </div>
                    <div className='flex flex-line'>
                        <div className="w-[70%] my-2">
                            Participation solidaire aux frais de livraison
                        </div>
                        <div className="w-[10%] my-2 font-bold">
                            {shippingCost}€
                        </div>
                    </div>
                    <div className='flex flex-line'>
                        <div className="w-[70%] my-2">
                            Nombre de produits
                        </div>
                        <div className="w-[10%] my-2 font-bold">
                            {productsNumberTotal}
                        </div>
                    </div>
                    <div className='flex flex-line'>
                        <div className="mt-8 text-4xl font-extrabold col-span-2 col-start-1 row-span-3 row-start-5 content-right">
                            <div className=" relative">
                                <img className='hidden lg:block' src={orangeCircle}></img>
                                <div className="flex lg:absolute lg:top-4 lg:left-7">Total</div>
                            </div>
                        </div>
                        <span className='mx-2 text-4xl mt-8 font-semibold lg:hidden'>=</span>
                        <div className="mt-8 w-[20%] lg:mt-12 text-4xl font-extrabold col-span-1 col-start-3 row-span-3 row-start-5 content-right">
                            {roundTwoDigits(productsPriceTotal + shippingCost)}€
                        </div>
                    </div>
                </div>
                <FunctionButton
                    buttonText={'Valider ma commande'}
                    className={`mx-4 sm:mx-10 w-full mt-4 sm:mt-5 px-4 sm:px-8 py-2 sm:py-3 rounded-lg font-mono text-lg sm:text-xl md:text-2xl font-semibold shadow ${Object.keys(cart).filter(k => k !== "id").length === 0
                        ? 'bg-[#878787] text-white'
                        : 'bg-[#FF8200] text-white hover:bg-[#ff9800]'
                        }`}
                    fun={handleValidate}
                />
            </>
        )
    }

    return (
        <>
            {loading || authorLoading ? (
                <Loading />
            ) : (
                <>
                    {/* TITLE */}
                    <div className="ml-10 mb-50">
                        <h1 className="text-[#2E2EFF] text-5xl lg:text-7xl font-extrabold leading-tight">Panier</h1>
                        <img src={orangeLine}></img>
                    </div>

                    <div className='mb-10 lg:mb-0'>
                        <img className="hidden lg:block absolute top-28 right-20 w-[15%]" src={blueRayonShape}></img>
                        <img className="hidden lg:block absolute left-28 w-[15%]" src={orangeShape}></img>

                        <div
                            className="relative bg-no-repeat bg-cover lg:mx-auto aspect-[1/2] lg:w-[700px]"
                            style={{
                                backgroundImage: window.innerWidth >= 1024 ? `url(${receipt})` : 'none'
                            }}
                        >
                            {/* PRODUCTS IN CART */}
                            <div className="mx-5 mt-5 lg:m-10 p-0 border-2 border-rayonorange rounded-lg lg:border-0 lg:bg-[url('/path/to/ticket.png')] lg:bg-cover lg:bg-center">
                                <a className="text-[#3435FF] m-10"></a>
                                <div className="lg:overflow-y-auto lg:h-[700px] text-[#3435FF] mx-5">
                                    {productsInCart.map((product, idx) => (displayProductOnReceipt(product, idx)))}
                                </div>
                            </div>

                            {/* INFO ON CART */}
                            <div className="flex flex-col lg:block lg:absolute lg:inset-x-0 text-xl lg:h-16 lg:ml-10 mr-10 lg:mr-28 mb-10 lg:mb-0">
                                {displayInfoOnCart(productsInCart)}
                            </div>
                        </div>


                    </div>
                </>)}
        </>
    )
}

export default Cart