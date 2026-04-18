import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState({ content: {} });
    const [isLoaded, setIsLoaded] = useState(false);

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

        setIsLoaded(true);
    }, []);

    // 💾 Sauvegarder le panier à chaque modification (après chargement initial)
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem("cart", JSON.stringify(cart));
    }, [cart, isLoaded]);

    return (
        <CartContext.Provider value={{ cart, setCart, isLoaded }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
