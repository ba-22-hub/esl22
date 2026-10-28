// =============================================================================
// HISTORIQUE DES MODIFICATIONS
// =============================================================================
//
// Date          Auteur        Description
// ----------    ----------    -------------------------------------------------
// 2026-10-28    Louvel       bandeau mobile récapitulant poids et prix du
//                            panier, avec alerte de poids hors limites
//
// =============================================================================
import { useNavigate } from "react-router-dom";
import { useCart } from "@context/CartContext.jsx";
import { formatKg, formatEuro } from "@lib/format";
import { useEffect } from "react";

/**
 * Bandeau collant affiché sous le menu principal, sur mobile uniquement.
 * Il suit le panier au fil des ajouts et signale tout de suite un poids
 * insuffisant ou excessif, sans que l'utilisateur ait à remonter la page.
 * Un appui ouvre le panier.
 */
export default function CartSummaryBar() {
    const { cartTotals } = useCart();
    const navigate = useNavigate();

    // Mesure la hauteur réelle du menu principal (collé en haut de l'écran)
    // pour que le bandeau se place juste en dessous, et la remet à jour si
    // le menu change de taille (rotation du téléphone, menu ouvert…).
    useEffect(() => {
        const nav = document.querySelector("nav");
        if (!nav) return;
        const update = () =>
            document.documentElement.style.setProperty("--header-height", `${nav.offsetHeight}px`);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(nav);
        return () => observer.disconnect();
    }, []);

    if (!cartTotals || cartTotals.count === 0) return null;

    const { price, weight, count, minWeight, maxWeight, ready } = cartTotals;
    const tooLight = ready && minWeight && weight < minWeight;
    const tooHeavy = ready && maxWeight && weight > maxWeight;
    const warning = tooLight || tooHeavy;

    return (
        <button
            type="button"
            onClick={() => navigate("/cart")}
            style={{ top: "var(--header-height, 0px)" }}
            className={`lg:hidden sticky z-40 w-full text-left px-4 py-2 border-b
                ${warning
                    ? "bg-orange-50 border-[#FF8200]"
                    : "bg-white border-gray-200"}`}
        >
            <div className="flex items-center justify-between gap-3 font-semibold text-[#3435FF]">
                <span>🛒 {count} {count > 1 ? "produits" : "produit"}</span>
                <span>{ready ? formatKg(weight) : "…"}</span>
                <span className="text-[#FF8200]">{ready ? formatEuro(price) : "…"}</span>
            </div>

            {tooLight && (
                <p role="alert" className="mt-1 text-sm font-medium text-[#c25e00]">
                    Ajoutez encore {formatKg(minWeight - weight)} pour pouvoir valider
                    (minimum {formatKg(minWeight)}).
                </p>
            )}
            {tooHeavy && (
                <p role="alert" className="mt-1 text-sm font-medium text-red-700">
                    Retirez {formatKg(weight - maxWeight)} pour pouvoir valider
                    (maximum {formatKg(maxWeight)}).
                </p>
            )}
        </button>
    );
}
