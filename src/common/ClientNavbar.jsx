import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuthor } from "@context/AuthorContext.jsx";
import rayonLogo from "@assets/logos/roundLogo.png"
import avatar from "@assets/Assets/avatar2.png"

function ClientNavbar() {
    const { user } = useAuthor()
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="bg-white shadow-lg border-b-2 border-[#FF8200]">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                {/* Première ligne : Logo + Boutons utilisateur */}
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="flex items-center gap-3">
                            <img src={rayonLogo} alt="RAYON logo" className="h-12 w-12" />
                            <span className="hidden md:block text-2xl font-bold text-[#3435FF]">Rayon22</span>
                        </Link>
                    </div>

                    {/* Right side - visible à partir de lg */}
                    <div className="hidden lg:flex items-center space-x-4">
                        <Link to={`${user ? '/account' : '/login'}`} className="flex-shrink-0">
                            <div className="bg-[#FF8200] hover:bg-[#ff9800] p-1 rounded-lg h-11 w-40 flex items-center justify-center shadow-md hover:shadow-lg transition-all text-white font-semibold">
                                {user ? "Mon compte" : "Connexion"}
                            </div>
                        </Link>
                    </div>

                    {/* Mobile (< lg) : Avatar + Burger */}
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

                {/* Deuxième ligne : Navigation - visible à partir de lg */}
                <div className="hidden lg:block border-t border-gray-100 py-3">
                    <div className="flex justify-center items-center space-x-2">
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