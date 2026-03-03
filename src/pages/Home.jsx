import { useEffect, useState } from 'react';
import { supabase } from '@lib/supabaseClient.js';
import { displayNotification } from '@lib/displayNotification.jsx';

// Importing common components
import PageButton from "@common/PageButton"
import ShapeNumber from "@common/ShapeNumber"
import ProductCarousel from "@common/ProductCarouselHome"

// Importing assets
import orangeWoman from "@assets/Photos/giletorange2.png"
import instagram from "@assets/logos/instagram.png"
import dpd from "@assets/logos/dpd.png"
import mondialRelay from "@assets/logos/mondialRelay.png"
import pickup from "@assets/logos/pickup.png"
import avatar from "@assets/Assets/avatar.png"
import file from "@assets/Assets/file.png"
import cart from "@assets/Assets/cart.png"
import phoneApp from "@assets/Photos/phoneApp.png"

function Home() {
    const [products, setProducts] = useState([])
    const [counters, setCounters] = useState({ ccas: 0, meals: 0, shops: 0 });
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            const { data, error } = await supabase
                .from("products")
                .select("*")
            if (error) {
                displayNotification("Erreur lors du téléchargement des produits", error.message, "danger")
            } else {
                const productsWithImages = await Promise.all(
                    data.map(async product => {
                        const { data: imgData, error: imgError } = await supabase
                            .storage
                            .from("images")
                            .download(product.image_name);

                        if (imgError) {
                            displayNotification("Erreur lors du téléchargement de l'image " + product.image_name, imgError.message, "warning")
                        } else {
                            product.imageUrl = URL.createObjectURL(imgData);
                        }
                        return product;
                    })
                );
                setProducts(productsWithImages)
            }
        };
        fetchProducts();
    }, []);

    // Animation des compteurs
    useEffect(() => {
        const handleScroll = () => {
            const statsSection = document.getElementById('stats-section');
            if (statsSection && !hasAnimated) {
                const rect = statsSection.getBoundingClientRect();
                if (rect.top < window.innerHeight * 0.8) {
                    setHasAnimated(true);
                    animateCounters();
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasAnimated]);

    const animateCounters = () => {
        const duration = 2000;
        const targets = { ccas: 67, meals: 1400000, shops: 6 };
        const steps = 60;
        const interval = duration / steps;

        let step = 0;
        const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            setCounters({
                ccas: Math.floor(targets.ccas * progress),
                meals: Math.floor(targets.meals * progress),
                shops: Math.floor(targets.shops * progress)
            });

            if (step >= steps) {
                clearInterval(timer);
                setCounters(targets);
            }
        }, interval);
    };

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
                            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                                Pour <span className="text-[#FF8200]">accéder</span> à notre épicerie en ligne
                            </h1>
                            <div className="space-y-6 text-white text-lg leading-relaxed mb-8">
                                <p>
                                    Le <strong>Rayon 22</strong> est une épicerie sociale et solidaire dont l'objectif est d'accompagner les personnes pour qui une aide alimentaire représente un soutien non négligeable pour leurs quotidiens, en leur donnant accès à des produits alimentaires à petits prix, partout sur le territoire des Côtes-d'Armor.
                                </p>
                                <p>
                                    Le <strong>Rayon 22</strong> permet aussi de donner accès à l'aide alimentaire aux personnes qui ne peuvent se rendre aux distributions de nos partenaires.
                                </p>
                                <p className="font-semibold">
                                    Afin de pouvoir commander des produits, il vous faut vous connecter à un compte.
                                </p>
                            </div>
                            <button
                                onClick={() => window.location.href = '/login'}
                                className="bg-[#FF8200] hover:bg-[#ff9800] text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                            >
                                Se Connecter
                            </button>
                        </div>
                        <div className="lg:flex-1 relative">
                            <div className="relative z-10 transform hover:scale-105 transition-transform duration-500">
                                <img
                                    src={orangeWoman}
                                    className="w-full h-auto max-w-lg xl:max-w-xl mx-auto drop-shadow-2xl"
                                    alt="Woman in orange"
                                />
                                {console.log(orangeWoman)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Instagram et Partenaires avec cartes modernes */}
            <div className="grid md:grid-cols-2 gap-0 -mt-8 max-w-6xl mx-auto px-6 lg:px-12 relative z-20">
                {/* Instagram Card */}
                <div className="bg-white p-8 lg:rounded-l-2xl rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-[#3435FF]">
                    <div className="flex flex-col items-center justify-center h-full">
                        <img src={instagram} alt="Instagram" className="w-20 h-20 mb-6" />
                        <h3 className="text-xl font-bold text-[#3435FF] mb-4">Suivez notre actualité</h3>
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href="https://www.instagram.com/banque.alimentaire22/"
                            className="bg-[#3435FF] hover:bg-[#2526B7] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                            Instagram
                        </a>
                    </div>
                </div>

                {/* Partenaires Card */}
                <div className="bg-gradient-to-br from-gray-50 to-white p-8 lg:rounded-r-2xl rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-[#FF8200] mt-2 lg:mt-0">
                    <div className="flex flex-col h-full justify-between">
                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-[#3435FF] mb-2">Nos partenaires de confiance</h3>
                            <div className="flex justify-center text-[#FF8200] text-2xl">
                                <span>★★★★★</span>
                            </div>
                        </div>
                        <div className="flex justify-around items-center gap-4">
                            <img src={dpd} alt="DPD" className="h-16 object-contain hover:scale-110 transition-transform duration-300 grayscale hover:grayscale-0" />
                            <img src={mondialRelay} alt="Mondial Relay" className="h-16 object-contain hover:scale-110 transition-transform duration-300 grayscale hover:grayscale-0" />
                            <img src={pickup} alt="Pickup" className="h-16 object-contain hover:scale-110 transition-transform duration-300 grayscale hover:grayscale-0" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Comment commander avec design amélioré */}
            <div className="py-20 bg-gradient-to-b from-white to-gray-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <h2 className="text-center text-[#3435FF] text-4xl lg:text-5xl font-bold mb-16">Comment commander ?</h2>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Ligne de connexion décorative */}
                        <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-1 bg-gradient-to-r from-[#3435FF] via-[#FF8200] to-[#3435FF] opacity-20"></div>

                        {/* Étape 1 */}
                        <div className="relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 border-[#3435FF] group">
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                                <div className="w-12 h-12 bg-[#3435FF] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                                    1
                                </div>
                            </div>
                            <div className="mt-8 text-center">
                                <h3 className="text-[#3435FF] text-2xl font-bold mb-6">Inscription</h3>
                                <div className="flex justify-center my-6 bg-blue-50 rounded-full p-6 w-32 h-32 mx-auto">
                                    <img src={avatar} alt="Avatar" className="w-16 h-16 object-contain" />
                                </div>
                                <p className="text-gray-700 leading-relaxed">
                                    Créez votre espace personnel et remplissez le formulaire d'inscription en ligne.
                                </p>
                            </div>
                        </div>

                        {/* Étape 2 */}
                        <div className="relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 border-[#FF8200] group">
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                                <div className="w-12 h-12 bg-[#FF8200] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                                    2
                                </div>
                            </div>
                            <div className="mt-8 text-center">
                                <h3 className="text-[#FF8200] text-2xl font-bold mb-6">Étude de dossier</h3>
                                <div className="flex justify-center my-6 bg-orange-50 rounded-full p-6 w-32 h-32 mx-auto">
                                    <img src={file} alt="File" className="w-16 h-16 object-contain" />
                                </div>
                                <p className="text-gray-700 leading-relaxed">
                                    Votre dossier est étudié par notre équipe. Une validation des conditions de ressources sera réalisée.
                                </p>
                            </div>
                        </div>

                        {/* Étape 3 */}
                        <div className="relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 border-[#3435FF] group">
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                                <div className="w-12 h-12 bg-[#3435FF] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                                    3
                                </div>
                            </div>
                            <div className="mt-8 text-center">
                                <h3 className="text-[#3435FF] text-2xl font-bold mb-6">À vos courses !</h3>
                                <div className="flex justify-center my-6 bg-blue-50 rounded-full p-6 w-32 h-32 mx-auto">
                                    <img src={cart} alt="Cart" className="w-16 h-16 object-contain translate-y-2" />
                                </div>
                                <p className="text-gray-700 leading-relaxed">
                                    Dossier admis ? Commandez et faites vos courses à petit prix !
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bouton CTA */}
                    <div className="flex justify-center mt-16">
                        <button
                            onClick={() => window.location.href = '/register'}
                            className="bg-[#FF8200] hover:bg-[#ff9800] text-white px-10 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                        >
                            Je m'inscris maintenant
                        </button>
                    </div>
                </div>
            </div>

            {/* Nos Produits */}
            <div className="py-5 lg:py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <h2 className="text-center text-[#3435FF] text-4xl lg:text-5xl font-bold mb-4">Nos produits</h2>
                    <p className="text-center text-gray-600 text-lg mb-12">Découvrez notre sélection de produits de qualité à petits prix</p>
                    <ProductCarousel data={products} />
                </div>
            </div>

            {/* Chiffres clés avec animations */}
            <div id="stats-section" className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
                {/* Motif décoratif */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 left-0 w-full h-full" style={{
                        backgroundImage: `repeating-linear-gradient(45deg, #3435FF 0, #3435FF 1px, transparent 0, transparent 50%)`,
                        backgroundSize: '20px 20px'
                    }}></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
                    <h2 className="text-center text-[#3435FF] text-4xl lg:text-5xl font-bold mb-4">Chiffres clés</h2>
                    <p className="text-center text-gray-600 text-lg mb-16">Notre impact sur le territoire</p>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Stat 1 */}
                        <div className="bg-white p-7 rounded-2xl shadow-xl text-center transform hover:scale-105 transition-transform duration-300 border-b-4 border-[#3435FF]">
                            <div className="text-6xl lg:text-7xl font-bold bg-gradient-to-r from-[#3435FF] to-[#5253ff] bg-clip-text text-transparent mb-4">
                                {counters.ccas}
                            </div>
                            <div className="text-xl font-semibold text-gray-800">CCAS partenaires</div>
                        </div>

                        {/* Stat 2 */}
                        <div className="bg-white p-7 rounded-2xl shadow-xl text-center transform hover:scale-105 transition-transform duration-300 border-b-4 border-[#FF8200]">
                            <div className="text-6xl lg:text-7xl font-bold bg-gradient-to-r from-[#FF8200] to-[#ff9800] bg-clip-text text-transparent mb-4">
                                {counters.meals.toLocaleString()}
                            </div>
                            <div className="text-xl font-semibold text-gray-800">Repas distribués par an</div>
                        </div>

                        {/* Stat 3 */}
                        <div className="bg-white p-7 rounded-2xl shadow-xl text-center transform hover:scale-105 transition-transform duration-300 border-b-4 border-[#3435FF]">
                            <div className="text-6xl lg:text-7xl font-bold bg-gradient-to-r from-[#3435FF] to-[#5253ff] bg-clip-text text-transparent mb-4">
                                {counters.shops}
                            </div>
                            <div className="text-xl font-semibold text-gray-800">Épiceries solidaires</div>
                        </div>
                    </div>

                    <div className="text-center mt-8">
                        <p className="text-sm text-gray-500">CCAS : Centre Communaux d'Action Sociale, Associations et épiceries solidaires</p>
                    </div>
                </div>
            </div>

            {/* Section Initiative avec design moderne */}
            <div className="py-20 bg-gradient-to-br from-[#3435FF] to-[#2526B7] text-white relative overflow-hidden">
                {/* Formes décoratives */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF8200] opacity-10 rounded-full blur-3xl"></div>

                <div className="lg:max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Phone mockup */}
                        <div className="hidden lg:flex justify-center">
                            <div className="relative transform hover:scale-105 transition-transform duration-500">
                                <div className="absolute inset-0 bg-[#FF8200] blur-3xl opacity-30 rounded-full"></div>
                                <img
                                    src={phoneApp}
                                    alt="Phone App"
                                    className="relative z-10 max-w-md lg:max-w-lg mx-auto drop-shadow-2xl"
                                />

                            </div>
                        </div>

                        {/* Contenu */}
                        <div>
                            <h2 className="text-3xl lg:text-4xl font-bold mb-8 leading-tight">
                                Le Rayon est une initiative des <span className="text-[#FF8200]">banques alimentaires</span>
                            </h2>

                            <div className="space-y-6 mb-10">
                                <div className="flex items-start gap-4 bg-white bg-opacity-10 p-6 rounded-xl backdrop-blur-sm">
                                    <div className="flex-shrink-0 w-16 h-16 bg-[#FF8200] rounded-full flex items-center justify-center font-bold text-2xl shadow-lg">

                                        85%
                                    </div>
                                    <p className="text-lg leading-relaxed translate-y-3">
                                        des personnes aidées vivent avec moins de 200€ par mois
                                    </p>
                                </div>

                                <div className="flex items-start gap-4 bg-white bg-opacity-10 p-6 rounded-xl backdrop-blur-sm">
                                    <div className="flex-shrink-0 w-16 h-16 bg-[#FF8200] rounded-full flex items-center justify-center font-bold text-2xl shadow-lg">
                                        1/5
                                    </div>
                                    <p className="text-lg leading-relaxed translate-y-4">
                                        est en insécurité alimentaire
                                    </p>
                                </div>

                                <div className="flex items-start gap-4 bg-white bg-opacity-10 p-6 rounded-xl backdrop-blur-sm">
                                    <div className="flex-shrink-0 w-16 h-16 bg-[#FF8200] rounded-full flex items-center justify-center font-bold text-2xl shadow-lg">

                                        47%
                                    </div>
                                    <p className="text-lg leading-relaxed translate-y-4">
                                        ont dû renoncer à des soins de santé
                                    </p>
                                </div>
                            </div>

                            <p className="text-sm italic mb-6 opacity-80">Source : La Fage</p>

                            <button
                                onClick={() => window.location.href = '/more'}
                                className="bg-[#FF8200] hover:bg-[#ff9800] text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                            >
                                En savoir plus
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Home