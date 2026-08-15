import { useCart } from "@context/CartContext.jsx";
import { useNavigate } from "react-router-dom";

/**
 * Bandeau affiché en permanence tant qu'une commande "colis urgent" est en
 * cours. Il évite au centre social de perdre de vue pour qui il compose le
 * panier, la composition pouvant s'étaler sur plusieurs pages et plusieurs
 * minutes.
 *
 * @returns {React.ReactElement|null} Le bandeau, ou rien hors mode urgent.
 */
function UrgentOrderBanner() {
    const { urgentBeneficiary, clearUrgentOrder, cart } = useCart();
    const navigate = useNavigate();

    if (!urgentBeneficiary) return null;

    const handleCancel = () => {
        const cartCount = Object.keys(cart?.content || {}).length;

        if (cartCount > 0) {
            const clearCart = window.confirm(
                `Abandonner la commande urgente pour ${urgentBeneficiary.firstName} ${urgentBeneficiary.lastName} ?\n\n` +
                `OK   : vider également le panier (${cartCount} produit${cartCount > 1 ? 's' : ''})\n` +
                `Annuler : conserver les produits pour une commande ordinaire`
            );
            clearUrgentOrder({ clearCart });
        } else {
            clearUrgentOrder();
        }
    };

    return (
        <div className="bg-[#FF8200] text-white sticky top-0 z-40 shadow-md">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">
                    🆘 Colis urgent en cours pour{' '}
                    <span className="underline underline-offset-2">
                        {urgentBeneficiary.firstName} {urgentBeneficiary.lastName}
                    </span>
                    {urgentBeneficiary.city && (
                        <span className="font-normal opacity-90"> — livraison à {urgentBeneficiary.city}</span>
                    )}
                </p>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/urgent-beneficiaries')}
                        className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition"
                    >Changer de bénéficiaire</button>
                    <button
                        onClick={handleCancel}
                        className="px-3 py-1 bg-white text-[#FF8200] hover:opacity-90 rounded-lg text-xs font-bold transition"
                    >Annuler</button>
                </div>
            </div>
        </div>
    );
}

export default UrgentOrderBanner;
