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
import content from "../content/home_content.json"

function Home() {
    const [products, setProducts] = useState([])
    const [counters, setCounters] = useState({ ccas: 0, meals: 0, shops: 0 });
    const [hasAnimated, setHasAnimated] = useState(false);

    // Mapping des icônes
    const iconMap = {
        file: file,
        avatar: avatar,
        cart: cart
    };

    // Mapping des logos partenaires
    const logoMap = {
        "DPD": dpd,
        "Mondial Relay": mondialRelay,
        "Pickup": pickup
    };

    const { hero, howToOrder, instagram: instagramContent, partners } = content.home;

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
                                {hero.title.main} <span className="text-[#FF8200]">{hero.title.highlight}</span> {hero.title.end}
                            </h1>
                            <div className="space-y-6 text-white text-lg leading-relaxed mb-8">
                                {hero.description.map((para, index) => (
                                    <p key={index} className={para.isBold ? 'font-semibold' : ''}>
                                        {para.text && para.text}
                                        {para.bold && <strong>{` ${para.bold}`}</strong>}
                                        {para.textAfter && ` ${para.textAfter}`}
                                    </p>
                                ))}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => window.location.href = hero.buttons.primary.link}
                                    className="bg-[#FF8200] hover:bg-[#ff9800] text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                                >
                                    {hero.buttons.primary.text}
                                </button>
                                <a
                                    href={hero.buttons.secondary.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block text-center bg-white text-[#3435FF] px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                                >
                                    {hero.buttons.secondary.text}
                                </a>
                            </div>
                        </div>
                        <div className="hidden lg:flex relative">
                            <div className="relative z-10 transform hover:scale-105 transition-transform duration-500">
                                <img
                                    src={orangeWoman}
                                    className="w-full h-auto max-w-lg xl:max-w-xl mx-auto drop-shadow-2xl"
                                    alt={hero.image.alt}
                                />
                                {console.log(orangeWoman)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comment commander avec design amélioré */}
            <div className="py-20 bg-gradient-to-b from-white to-gray-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <h2 className="text-center text-[#3435FF] text-4xl lg:text-5xl font-bold mb-16">
                        {howToOrder.title}
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Ligne de connexion décorative */}
                        <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-1 bg-gradient-to-r from-[#3435FF] via-[#FF8200] to-[#3435FF] opacity-20"></div>

                        {howToOrder.steps.map((step, index) => (
                            <div 
                                key={index}
                                className={`relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 group`}
                                style={{ borderColor: step.color }}
                            >
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                                    <div 
                                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform"
                                        style={{ backgroundColor: step.color }}
                                    >
                                        {step.number}
                                    </div>
                                </div>
                                <div className="mt-8 text-center">
                                    <h3 
                                        className="text-2xl font-bold mb-6"
                                        style={{ color: step.color }}
                                    >
                                        {step.title}
                                    </h3>
                                    <div 
                                        className={`flex justify-center my-6 rounded-full p-6 w-32 h-32 mx-auto`}
                                        style={{ backgroundColor: step.color === '#FF8200' ? '#fff7ed' : '#eff6ff' }}
                                    >
                                        <img 
                                            src={iconMap[step.icon]} 
                                            alt={step.title} 
                                            className={`w-16 h-16 object-contain ${step.icon === 'cart' ? 'translate-y-2' : ''}`}
                                        />
                                    </div>
                                    <p className="text-gray-700 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>                    
                </div>
            </div>
            
             {/* Instagram et Partenaires avec cartes modernes */}
            <div className="grid md:grid-cols-2 gap-0 -mt-8 max-w-6xl mx-auto px-6 lg:px-12 relative z-20">
                {/* Instagram Card */}
                <div className="bg-white p-8 rounded-l-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-[#3435FF]">
                    <div className="flex flex-col items-center justify-center h-full">
                        <img src={instagram} alt={instagramContent.alt} className="w-20 h-20 mb-6" />
                        <h3 className="text-xl font-bold text-[#3435FF] mb-4">{instagramContent.title}</h3>
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href={instagramContent.url}
                            className="bg-[#3435FF] hover:bg-[#2526B7] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                            {instagramContent.buttonText}
                        </a>
                    </div>
                </div>

                {/* Partenaires Card */}
                <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-r-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-[#FF8200]">
                    <div className="flex flex-col h-full justify-between">
                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-[#3435FF] mb-2">{partners.title}</h3>
                            <div className="flex justify-center text-[#FF8200] text-2xl">
                                <span>{partners.rating}</span>
                            </div>
                        </div>
                        <div className="flex justify-around items-center gap-4">
                            {partners.logos.map((logo, index) => (
                                logo.url ? (
                                    <a 
                                        key={index}
                                        href={logo.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block"
                                    >
                                        <img 
                                            src={logoMap[logo.name]} 
                                            alt={logo.alt} 
                                            className="h-16 object-contain hover:scale-110 transition-transform duration-300 grayscale hover:grayscale-0" 
                                        />
                                    </a>
                                ) : (
                                    <img 
                                        key={index}
                                        src={logoMap[logo.name]} 
                                        alt={logo.alt} 
                                        className="h-16 object-contain hover:scale-110 transition-transform duration-300 grayscale hover:grayscale-0" 
                                    />
                                )
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Home