// Importing common components
import PageButton from "@common/PageButton"
import ShapeNumber from "@common/ShapeNumber"

// Importing assets
import mosaique from "@assets/Photos/mosaique.png"
import bigRoundLogo from "@assets/logos/bigRoundLogo.png"
import holdingApple from "@assets/Photos/holdingApple.jpg"
import beams from "@assets/Assets/Rayons-traits bleus.png"

/**
 * The How It Works page.
 * @returns {React.ReactElement} HowItWorks component.
 */
function HowItWorks() {
    return (
        <>
            {/* Hero section avec design moderne */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#3435FF] via-[#2526B7] to-[#1F2099]">
                {/* Formes géométriques décoratives */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF8200] opacity-10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl"></div>

                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="flex-1">
                            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-8 leading-tight">
                                Faites vos <span className="text-[#FF8200]">courses</span> à petit prix en ligne et recevez-les près de <span className="text-[#FF8200]">chez vous !</span>
                            </h1>

                            <div className="space-y-6 text-white text-lg leading-relaxed">
                                <p>
                                    <strong>Je commande</strong> par internet quand je veux à mon épicerie solidaire et je me fais livrer où je veux en <strong>point relais</strong> près de chez moi ou de mon lieu d'étude.
                                </p>

                                <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
                                    <p className="text-xl font-bold text-[#FF8200] mb-2">
                                        Un accès équitable à l'essentiel
                                    </p>
                                    <p className="text-lg">
                                        Payez moins et choisissez mieux
                                    </p>
                                </div>

                                <p>
                                    Les prix sont encadrés entre <strong className="text-[#FF8200]">10% et 30%</strong> de leur valeur en magasin. J'ai le choix de produits variés en alimentaire (produits secs) ou d'hygiène et d'entretien avec toutefois une <strong>limitation mensuelle</strong>.
                                </p>

                                <p>
                                    Une contribution aux frais d'envoi de <strong className="text-[#FF8200]">1,35€</strong> soit le prix d'un timbre.
                                </p>

                                <p className="font-semibold bg-[#FF8200] bg-opacity-20 p-4 rounded-lg border-l-4 border-[#FF8200]">
                                    L'inscription est indispensable car l'accès à l'épicerie en ligne est sous conditions de ressources.
                                </p>
                            </div>

                            <div className="mt-8">
                                <button
                                    onClick={() => window.location.href = '/login'}
                                    className="bg-[#FF8200] hover:bg-[#ff9800] text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                                >
                                    Se Connecter
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 relative lg:flex-[1.2]">
                            <div className="relative z-10 transform hover:scale-105 transition-transform duration-500">
                                <img src={mosaique} className="w-full h-auto max-w-2xl mx-auto drop-shadow-2xl" alt="Mosaique" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Infos livraison avec design moderne */}
            <div className="py-20 bg-gradient-to-b from-white to-gray-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <h2 className="text-center text-[#3435FF] text-4xl lg:text-5xl font-bold mb-4">Infos livraison</h2>
                    <p className="text-center text-gray-600 text-lg mb-16">Comment récupérer votre commande en 4 étapes simples</p>

                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Image avec effet */}
                        <div className="flex justify-center lg:justify-start order-2 lg:order-1">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#3435FF] blur-2xl opacity-20 rounded-full transform scale-110"></div>
                                <img
                                    src={holdingApple}
                                    className="relative z-10 w-full max-w-md h-auto object-cover rounded-2xl shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-500"
                                    alt="Holding Apple"
                                />
                            </div>
                        </div>

                        {/* Étapes avec cartes */}
                        <div className="space-y-6 order-1 lg:order-2">
                            {/* Step 01 */}
                            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-l-4 border-[#3435FF]">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-[#3435FF] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            1
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-[#3435FF] text-xl font-bold mb-2">Confirmation et Notification</h3>
                                        <p className="text-gray-700 leading-relaxed">
                                            Une fois la commande effectuée, je suis notifié par e-mail de la disponibilité de mon colis au relais Pickup (il y <span className="font-semibold text-[#FF8200]">sera disponible pendant 9 jours</span>).
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Step 02 */}
                            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-l-4 border-[#FF8200]">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-[#FF8200] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            2
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-[#FF8200] text-xl font-bold mb-2">Retrait sans contact</h3>
                                        <p className="text-gray-700 leading-relaxed">
                                            Un QR code m'est transmis dans cette notification e-mail pour effectuer un retrait sans contact auprès de mon commerçant.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Step 03 */}
                            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-l-4 border-[#3435FF]">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-[#3435FF] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            3
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-[#3435FF] text-xl font-bold mb-2">Relance en cas d'oubli</h3>
                                        <p className="text-gray-700 leading-relaxed">
                                            Je suis relancé à J+3 par SMS et e-mail si je n'ai pas encore retiré mon colis au relais Pickup.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Step 04 */}
                            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-l-4 border-[#FF8200]">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-[#FF8200] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            4
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-[#FF8200] text-xl font-bold mb-2">Retrait du colis</h3>
                                        <p className="text-gray-700 leading-relaxed">
                                            Je récupère mon colis au relais Pickup choisi grâce au QR code. Je présente également ma pièce d'identité.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Contact et plus avec design moderne */}
            <div className="py-20 bg-white">
                <div className="lg:max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="grid lg:grid-cols-2 gap-16 items-start">
                        {/* Colonne gauche - Contenu */}
                        <div className="space-y-12">
                            {/* Un contact si besoin */}
                            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl shadow-xl border-t-4 border-[#3435FF]">
                                <h2 className="text-[#3435FF] text-3xl lg:text-4xl font-bold mb-6">Un contact si besoin</h2>

                                <div className="space-y-4 text-gray-700 leading-relaxed mb-8">
                                    <p className="flex items-start gap-3">
                                        <span className="text-[#FF8200] text-2xl font-bold flex-shrink-0">→</span>
                                        <span>Lors de l'inscription, je serai rappelé pour formaliser mon dossier.</span>
                                    </p>
                                    <p className="flex items-start gap-3">
                                        <span className="text-[#FF8200] text-2xl font-bold flex-shrink-0">→</span>
                                        <span>Si nécessaire un rendez-vous avec une assistante sociale de proximité sera pris.</span>
                                    </p>
                                    <p className="flex items-start gap-3">
                                        <span className="text-[#FF8200] text-2xl font-bold flex-shrink-0">→</span>
                                        <span>À tout moment, je peux contacter la Banque Alimentaire par mail pour un problème de fonctionnement ou concernant ma situation personnelle.</span>
                                    </p>
                                </div>
                                <div className="flex-c lg:flex-l">
                                    <button
                                        onClick={() => window.location.href = '/contact'}
                                        className="w-[225px] bg-[#FF8200] hover:bg-[#ff9800] text-white px-8 py-3 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                                    >
                                        Contactez-nous
                                    </button>
                                    <button
                                        onClick={() => window.location.href = '/Faq'}
                                        className="w-[225px] mt-2 lg:mt-0 bg-[#FF8200] hover:bg-[#ff9800] text-white lg:mx-4 py-3 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                                    >
                                        FAQ
                                    </button>
                                </div>
                            </div>

                            {/* Et beaucoup plus */}
                            <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-2xl shadow-xl border-t-4 border-[#FF8200] relative overflow-hidden">
                                {/* Image décorative en arrière-plan */}
                                <div className="hidden lg:block absolute top-0 right-0 opacity-10">
                                    <img src={beams} className="w-40 h-40 object-contain" alt="Background beams" />
                                </div>

                                <div className="lg:relative lg:z-10">
                                    <h2 className="text-[#3435FF] text-3xl lg:text-4xl font-bold mb-6">Et beaucoup plus...</h2>

                                    <p className="text-gray-700 text-lg leading-relaxed mb-8">
                                        Nous mettons à votre disposition des recettes de cuisine, des informations pratiques, des promos, des animations...
                                    </p>

                                    <button
                                        onClick={() => window.location.href = '/more'}
                                        className="bg-[#3435FF] hover:bg-[#5253ff] text-white px-8 py-3 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                                    >
                                        Toujours plus
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Colonne droite - Logo */}
                        <div className="hidden lg:flex justify-center items-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#3435FF] to-[#FF8200] blur-3xl opacity-20 rounded-full"></div>
                                <img
                                    src={bigRoundLogo}
                                    className="relative z-10 w-full max-w-lg h-auto object-contain transform hover:scale-105 transition-transform duration-500"
                                    alt="RAYON 22 en ligne logo"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default HowItWorks