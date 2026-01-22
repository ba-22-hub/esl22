import { createContext, useContext, useState, useEffect } from 'react'
import { useAuthor } from './AuthorContext'
import { displayNotification } from '../lib/displayNotification'

/*
HOW TO USE THE CONTEXT ?? 
1. import : import { useCart } from '../context/CartContext.jsx';
2. declare what you need at the begining of the component
    => const {cart, setCart, clearCart } = useCart()

cart : current cart : {idCart: _,
                        content: {id1: nb1, id2: nb2, ...}
                        trackingUrl: _,
                        orderReference: _},
setCart : to update the cart
*/


const CartContext = createContext()

function CartProvider({ children }) {
    const { user, loading } = useAuthor()
    const [cart, setCart] = useState({ "content": {} })

    // Retrieving old cart
    useEffect(() => {
        if (!loading) {
            if (user?.id) {
                try {
                    const saved = localStorage.getItem(user.id)
                    setCart(saved ? JSON.parse(saved) : { "content": {} })
                } catch (e) {
                    displayNotification("Erreur de récupération du panier", "", "danger")
                    setCart({ "content": {} })
                }
            } else {
                setCart({ "content": {} })
            }
        }
    }, [user, loading])

    // Updating cart
    useEffect(() => {
        if (user?.id && cart !== null) {
            localStorage.setItem(user.id, JSON.stringify(cart))
        }
    }, [cart, user])

    function clearCart() {
        if (user?.id) {
            localStorage.setItem(user.id, JSON.stringify({ "content": {} }))
            setCart({ "content": {} })
        }
    }

    return (
        <CartContext.Provider value={{ cart, setCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );

}


const useCart = () => useContext(CartContext)

export { CartProvider, useCart }