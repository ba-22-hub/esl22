// =============================================================================
// HISTORIQUE DES MODIFICATIONS
// =============================================================================
//
// Date          Auteur        Description
// ----------    ----------    -------------------------------------------------
// 2026-09-22    Louvel       Création : remonter en haut de page à chaque
//                            changement d'adresse.
//
// =============================================================================
//
// React Router conserve la position de défilement d'une page à l'autre : en
// cliquant sur un lien depuis le bas d'une page longue, on arrivait au milieu
// de la suivante. Ce composant, placé une fois dans App.jsx, corrige ce
// comportement pour l'ensemble du site.
//
// =============================================================================

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Défilement immédiat plutôt qu'animé : une page qui remonte en
        // douceur après un changement d'adresse donne l'impression d'un
        // mouvement parasite.
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [pathname]);

    return null;
}

export default ScrollToTop;
