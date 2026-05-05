import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuthor } from "@context/AuthorContext.jsx";
import esl22Logo from "../assets/esl22/round_Logo_ESL22_circle_bleu.png";
import banqueLogo from "../assets/esl22/Logo_Banque_Alimentaire.jpg";
import avatar from "@assets/Assets/avatar2.png"

function ClientNavbar() {
    const { user } = useAuthor()
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="bg-white shadow-lg border-b-2 border-[#FF8200] sticky top-0 z-50">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                {/* Première ligne : Logo + Boutons utilisateur */}
                <div className="flex justify-between items-center h-28">
                     {/* Logos + baseline */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-8">
                            <Link to="/" className="flex items-center">
                                <img
                                    src={esl22Logo}
                                    alt="ESL22 logo"
                                    className="h-24 w-auto object-contain"
                                />
                            </Link>

                            <a
                                href="https://www.banquealimentaire.org"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center"
                            >
                                <img
                                    src={banqueLogo}
                                    alt="Banques Alimentaires"
                                    className="h-16 w-auto object-contain"
                                />
                            </a>
                        </div>
                    </div>

                    {/* Navigation centrale - visible à partir de lg */}
                    <div className="hidden lg:flex items-center space-x-2">
                        <Link to="/about" className="text-[#3435FF] hover:text-white hover:bg-[#3435FF] px-4 py-2 rounded-lg text-sm font-medium transition-all">
                            Qui sommes-nous ?
                        </Link>
                        <Link to="/how-it-works" className="text-[#3435FF] hover:text-white hover:bg-[#3435FF] px-4 py-2 rounded-lg text-sm font-medium transition-all">
                            Comment ça marche ?
                        </Link>
                        <Link to="/more" className="text-[#3435FF] hover:text-white hover:bg-[#3435FF] px-4 py-2 rounded-lg text-sm font-medium transition-all">
                            Toujours plus
                        </Link>
                        <Link to="/catalog" className="text-[#3435FF] hover:text-white hover:bg-[#3435FF] px-4 py-2 rounded-lg text-sm font-medium transition-all">
                            Nos produits
                        </Link>
                        <Link to="/cart" className="text-[#3435FF] hover:text-white hover:bg-[#3435FF] px-4 py-2 rounded-lg text-sm font-medium transition-all">
                            🛒 Mon panier
                        </Link>
                        <Link to="/delivery" className="text-[#3435FF] hover:text-white hover:bg-[#3435FF] px-4 py-2 rounded-lg text-sm font-medium transition-all">
                            📦 Mes livraisons
                        </Link>
                        <Link to="/contact" className="text-[#3435FF] hover:text-white hover:bg-[#3435FF] px-4 py-2 rounded-lg text-sm font-medium transition-all">
                            ✉️ Nous contacter
                        </Link>
                    </div>

                    {/* Bouton connexion - visible à partir de lg */}
                    <div className="hidden lg:flex items-center">
                        <Link to={`${user ? '/account' : '/login'}`} className="flex-shrink-0">
                            <div className="bg-[#FF8200] hover:bg-[#ff9800] p-1 rounded-lg h-11 w-40 flex items-center justify-center shadow-md hover:shadow-lg transition-all text-white font-semibold">
                                {user ? "Mon compte" : "Connexion"}
                            </div>
                        </Link>
                    </div>

                    {/* Mobile : Avatar + Burger */}
                    <div className="flex lg:hidden items-center space-x-4">
                        <Link to={`${user ? '/account' : '/login'}`} className="flex-shrink-0">
                            <div className="bg-[#FF8200] hover:bg-[#ff9800] p-1 rounded-lg h-11 w-11 flex items-center justify-center shadow-md transition-all">
                                <img src={avatar} alt="User avatar" className="h-9 w-9 rounded-lg" />
                            </div>
                        </Link>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-[#3435FF] text-2xl font-bold hover:text-[#5253ff] focus:outline-none transition-colors"
                        >
                            {isMenuOpen ? "✕" : "☰"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Menu mobile dépliable (< lg uniquement) */}
            <div
                className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden ${isMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="px-4 pt-2 pb-4 space-y-2 bg-gradient-to-b from-gray-50 to-white border-t border-gray-200">
                    <Link
                        to="/about"
                        onClick={() => setIsMenuOpen(false)}
                        className="block text-[#3435FF] hover:bg-[#3435FF] hover:text-white px-4 py-3 rounded-lg text-base font-medium transition-all"
                    >
                        Qui sommes-nous ?
                    </Link>
                    <Link
                        to="/how-it-works"
                        onClick={() => setIsMenuOpen(false)}
                        className="block text-[#3435FF] hover:bg-[#3435FF] hover:text-white px-4 py-3 rounded-lg text-base font-medium transition-all"
                    >
                        Comment ça marche ?
                    </Link>
                    <Link
                        to="/more"
                        onClick={() => setIsMenuOpen(false)}
                        className="block text-[#3435FF] hover:bg-[#3435FF] hover:text-white px-4 py-3 rounded-lg text-base font-medium transition-all"
                    >
                        Toujours plus
                    </Link>
                    <Link
                        to="/catalog"
                        onClick={() => setIsMenuOpen(false)}
                        className="block text-[#3435FF] hover:bg-[#3435FF] hover:text-white px-4 py-3 rounded-lg text-base font-medium transition-all"
                    >
                        Nos produits
                    </Link>
                    <Link
                        to="/cart"
                        onClick={() => setIsMenuOpen(false)}
                        className="block text-[#3435FF] hover:bg-[#3435FF] hover:text-white px-4 py-3 rounded-lg text-base font-medium transition-all"
                    >
                        🛒 Mon panier
                    </Link>
                    <Link
                        to="/delivery"
                        onClick={() => setIsMenuOpen(false)}
                        className="block text-[#3435FF] hover:bg-[#3435FF] hover:text-white px-4 py-3 rounded-lg text-base font-medium transition-all"
                    >
                        📦 Mes livraisons
                    </Link>
                    <Link
                        to="/contact"
                        onClick={() => setIsMenuOpen(false)}
                        className="block text-[#3435FF] hover:bg-[#3435FF] hover:text-white px-4 py-3 rounded-lg text-base font-medium transition-all"
                    >
                        ✉️ Nous contacter
                    </Link>
                </div>
            </div>
        </nav>
    );
}

export default ClientNavbar;
