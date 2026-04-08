import React from "react";
import { Link, useNavigate } from "react-router-dom";

import rayonLogo from "../assets/logos/logo.png";
import banqueLogo from "../assets/logos/banquesAlimentaires.png";

const Footer = () => {
    const  navigate  = useNavigate()

    return (
        <footer className="bg-[#3435FF] mt-20">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-14">

                <div className="grid md:grid-cols-4 gap-12 items-start">

                    {/* Logos + baseline */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-8">
                            <Link to="/" className="flex items-center">
                                <img
                                    src={rayonLogo}
                                    alt="Rayon22 logo"
                                    className="h-12 w-auto object-contain"
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
                                    className="h-11 w-auto object-contain"
                                />
                            </a>
                        </div>

                        <p className="text-sm text-blue-100 leading-relaxed max-w-xs">
                            Le <span className="font-semibold text-white">RAYON</span> est une initiative des Banques Alimentaires.
                        </p>
                    </div>

                    {/* Colonne 1 */}
                    <div className="space-y-4">
                        <h4 className="text-white font-semibold text-base tracking-wide">
                            Informations
                        </h4>

                        <a
                            onClick={() => navigate("/legal-mentions")}
                            className="block text-sm text-blue-100 hover:text-rayonorange transition-colors duration-200 cursor-pointer"
                        >
                            Mentions légales
                        </a>

                        <a
                            onClick={() => navigate("/confidentiality")}
                            className="block text-sm text-blue-100 hover:text-rayonorange transition-colors duration-200 cursor-pointer"
                        >
                            Politique de confidentialité
                        </a>

                        <a
                            onClick={() => navigate("/operationg-charter")}
                            className="block text-sm text-blue-100 hover:text-rayonorange transition-colors duration-200 cursor-pointer"
                        >
                            Charte de fonctionnement
                        </a>
                        <a
                            onClick={() => navigate("/cgu")}
                            className="block text-sm text-blue-100 hover:text-rayonorange transition-colors duration-200 cursor-pointer"
                        >
                            CGU
                        </a>
                    </div>

                    {/* Colonne 2 */}
                    <div className="space-y-4">
                        <h4 className="text-white font-semibold text-base tracking-wide">
                            Navigation
                        </h4>

                        <Link
                            to="/catalog"
                            className="block text-sm text-blue-100 hover:text-rayonorange transition-colors duration-200"
                        >
                            Nos produits
                        </Link>

                        <Link
                            to="/how-it-works"
                            className="block text-sm text-blue-100 hover:text-rayonorange transition-colors duration-200"
                        >
                            Comment ça marche ?
                        </Link>

                        <Link
                            to="/contact"
                            className="block text-sm text-blue-100 hover:text-rayonorange transition-colors duration-200"
                        >
                            Nous contacter
                        </Link>
                    </div>

                    {/* Colonne 3 */}
                    <div className="space-y-4">
                        <h4 className="text-white font-semibold text-base tracking-wide">
                            Contact
                        </h4>

                        <a
                            href="mailto:ba220@banquealimentaire.org"
                            className="block text-sm text-blue-100 hover:text-rayonorange transition-colors duration-200"
                        >
                            ba220.epicerie@banquealimentaire.org
                        </a>

                        <a
                            href="https://www.instagram.com/banque.alimentaire22/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm text-blue-100 hover:text-rayonorange transition-colors duration-200"
                        >
                            Instagram
                        </a>
                    </div>

                </div>

                {/* Barre basse */}
                <div className="border-t border-blue-400/30 mt-14 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-blue-200">
                        © {new Date().getFullYear()} Rayon22 — Tous droits réservés
                    </p>

                    <div className="flex items-center gap-3">
                        <span className="text-sm text-blue-200">
                            Une initiative des
                        </span>
                        <img
                            src={banqueLogo}
                            alt="Banques Alimentaires"
                            className="h-7 w-auto object-contain"
                        />
                    </div>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
