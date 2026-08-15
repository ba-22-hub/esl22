// =============================================================================
// HISTORIQUE DES MODIFICATIONS
// =============================================================================
//
// Date          Auteur        Description
// ----------    ----------    -------------------------------------------------
// 2026-08-12    Louvel       colis urgent : contexte de commande pour un
//                            bénéficiaire (sessionStorage)
//
// =============================================================================
import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

// Clé de stockage du bénéficiaire "colis urgent" en cours. Volontairement
// séparée du panier et placée dans sessionStorage : le panier est conservé
// d'une session à l'autre (localStorage), alors qu'une commande urgente est
// un contexte de travail ponctuel qui ne doit pas survivre à la fermeture du
// navigateur. Le sessionStorage permet néanmoins de ne pas perdre le contexte
// si la page est rafraîchie en pleine composition du panier.
const URGENT_KEY = "urgentBeneficiary";

export function CartProvider({ children }) {
    const [cart, setCart] = useState({ content: {} });
    const [isLoaded, setIsLoaded] = useState(false);
    const [urgentBeneficiary, setUrgentBeneficiary] = useState(null);

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
            isUrgentOrder: urgentBeneficiary !== null,
            startUrgentOrder,
            clearUrgentOrder,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
