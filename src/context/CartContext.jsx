// =============================================================================
// HISTORIQUE DES MODIFICATIONS
// =============================================================================
//
// Date          Auteur        Description
// ----------    ----------    -------------------------------------------------
// 2026-08-12    Louvel       colis urgent : contexte de commande pour un
//                            bénéficiaire (sessionStorage)
// 2026-10-28    Louvel       totaux du panier (poids, prix) calculés dans le
//                            contexte pour le bandeau mobile CartSummaryBar
//
// =============================================================================
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@lib/supabaseClient";

const CartContext = createContext();

// Clé de stockage du bénéficiaire "colis urgent" en cours. Volontairement
// séparée du panier et placée dans sessionStorage : le panier est conservé
// d'une session à l'autre (localStorage), alors qu'une commande urgente est
// un contexte de travail ponctuel qui ne doit pas survivre à la fermeture du
// navigateur. Le sessionStorage permet néanmoins de ne pas perdre le contexte
// si la page est rafraîchie en pleine composition du panier.
const URGENT_KEY = "urgentBeneficiary";

// Constantes utiles au calcul des totaux, lues dans la table "constants".
// Les valeurs par défaut ne servent que tant que la lecture n'a pas abouti.
const CART_CONSTANT_NAMES = ["packagingWeight", "minCartWeight", "urgentWeightMin", "maxCartWeight"];

export function CartProvider({ children }) {
    const [cart, setCart] = useState({ content: {} });
    const [isLoaded, setIsLoaded] = useState(false);
    const [urgentBeneficiary, setUrgentBeneficiary] = useState(null);

    // Prix et poids des produits présents dans le panier : { [id]: { salePrice, weight } }.
    // cart.content ne contient que les quantités ; ces informations sont lues
    // en base et gardées en mémoire seulement (jamais en localStorage), pour
    // repartir de prix à jour à chaque chargement du site.
    const [productInfo, setProductInfo] = useState({});
    const [cartConstants, setCartConstants] = useState({
        packagingWeight: 300,
        minCartWeight: null,
        urgentWeightMin: null,
        maxCartWeight: null,
    });

    // 🔄 Charger le panier depuis localStorage au montage
    useEffect(() => {
        const storedCart = localStorage.getItem("cart");

        if (storedCart) {
            try {
                const parsed = JSON.parse(storedCart);

                if (parsed && typeof parsed === "object" && parsed.content) {
                    setCart(parsed);
                }
            } catch (err) {
            }
        }

        // 🔄 Recharger le bénéficiaire urgent éventuellement en cours
        const storedUrgent = sessionStorage.getItem(URGENT_KEY);
        if (storedUrgent) {
            try {
                const parsed = JSON.parse(storedUrgent);
                if (parsed && parsed.id) {
                    setUrgentBeneficiary(parsed);
                }
            } catch (err) {
            }
        }

        setIsLoaded(true);
    }, []);

    // 💾 Sauvegarder le panier à chaque modification (après chargement initial)
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem("cart", JSON.stringify(cart));
    }, [cart, isLoaded]);

    // 💾 Idem pour le bénéficiaire urgent
    useEffect(() => {
        if (!isLoaded) return;
        if (urgentBeneficiary) {
            sessionStorage.setItem(URGENT_KEY, JSON.stringify(urgentBeneficiary));
        } else {
            sessionStorage.removeItem(URGENT_KEY);
        }
    }, [urgentBeneficiary, isLoaded]);

    // 🔄 Constantes de poids (une seule requête au montage). En cas d'échec
    // (RLS, réseau), le bandeau affiche quand même poids et prix, sans alerte.
    useEffect(() => {
        const fetchConstants = async () => {
            const { data, error } = await supabase
                .from("constants")
                .select("name, value")
                .in("name", CART_CONSTANT_NAMES);
            if (error || !data) return;

            const values = {};
            data.forEach(row => {
                const v = parseFloat(row.value);
                if (!Number.isNaN(v)) values[row.name] = v;
            });
            setCartConstants(prev => ({ ...prev, ...values }));
        };
        fetchConstants();
    }, []);

    // 🔄 Prix et poids des produits ajoutés au panier. Seuls les produits
    // encore inconnus sont demandés : un ajout de quantité ne déclenche
    // aucune requête, un nouveau produit en déclenche une seule, très légère.
    useEffect(() => {
        if (!isLoaded || !cart?.content) return;

        const missingIds = Object.keys(cart.content).filter(id => !productInfo[id]);
        if (missingIds.length === 0) return;

        const fetchProductInfo = async () => {
            const { data, error } = await supabase
                .from("products")
                .select("id, salePrice, weight")
                .in("id", missingIds);
            if (error || !data) return;

            setProductInfo(prev => {
                const next = { ...prev };
                data.forEach(p => {
                    next[String(p.id)] = {
                        salePrice: parseFloat(p.salePrice) || 0,
                        weight: parseFloat(p.weight) || 0,
                    };
                });
                return next;
            });
        };
        fetchProductInfo();
        // productInfo volontairement absent des dépendances : on ne relance la
        // recherche que lorsque le panier change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cart?.content, isLoaded]);

    const isUrgentOrder = urgentBeneficiary !== null;

    // 🧮 Totaux du panier, même formule que Cart.jsx : somme prix × quantité,
    // et poids des produits + emballage (l'emballage n'est compté que si le
    // panier contient quelque chose).
    const cartTotals = useMemo(() => {
        const content = cart?.content || {};
        const ids = Object.keys(content);

        let price = 0;
        let weight = 0;
        let count = 0;

        ids.forEach(id => {
            const qty = Number(content[id]) || 0;
            count += qty;
            const info = productInfo[id];
            if (!info) return;
            price += info.salePrice * qty;
            weight += info.weight * qty;
        });

        if (count > 0) weight += cartConstants.packagingWeight;

        return {
            price: Math.round(price * 100) / 100,
            weight: Math.round(weight * 100) / 100,
            count,
            // Seuil bas spécifique quand un centre social compose un colis urgent.
            minWeight: isUrgentOrder ? cartConstants.urgentWeightMin : cartConstants.minCartWeight,
            maxWeight: cartConstants.maxCartWeight,
            // Faux tant que les infos d'un produit ajouté n'ont pas été reçues :
            // évite d'afficher un total partiel ou une alerte erronée.
            ready: ids.every(id => productInfo[id]),
        };
    }, [cart?.content, productInfo, cartConstants, isUrgentOrder]);

    /**
     * Démarre une commande "colis urgent" pour une fiche bénéficiaire.
     * On ne conserve que les champs utiles au parcours de commande (identité
     * pour l'affichage, adresse pour la livraison) plutôt que la fiche
     * entière, afin de ne pas laisser traîner de données inutiles dans le
     * stockage du navigateur.
     *
     * @param {object} beneficiary Fiche issue de la table UrgentBeneficiary.
     * @param {object} [options]
     * @param {boolean} [options.clearCart] Vider le panier en cours.
     */
    const startUrgentOrder = (beneficiary, options = {}) => {
        if (options.clearCart) {
            setCart(prev => ({ ...prev, content: {} }));
        }
        setUrgentBeneficiary({
            id: beneficiary.id,
            firstName: beneficiary.firstName,
            lastName: beneficiary.lastName,
            phone: beneficiary.phone,
            email: beneficiary.email ?? null,
            address: beneficiary.address ?? null,
            addAddress: beneficiary.addAddress ?? null,
            city: beneficiary.city ?? null,
            postalCode: beneficiary.postalCode ?? null,
        });
    };

    /**
     * Sort du mode "colis urgent". Le panier n'est vidé que si demandé : le
     * centre social peut vouloir conserver sa sélection.
     *
     * @param {object} [options]
     * @param {boolean} [options.clearCart] Vider le panier en cours.
     */
    const clearUrgentOrder = (options = {}) => {
        if (options.clearCart) {
            setCart(prev => ({ ...prev, content: {} }));
        }
        setUrgentBeneficiary(null);
    };

    return (
        <CartContext.Provider value={{
            cart,
            setCart,
            isLoaded,
            urgentBeneficiary,
            isUrgentOrder,
            startUrgentOrder,
            clearUrgentOrder,
            cartTotals,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
