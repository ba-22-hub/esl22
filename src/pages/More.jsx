import { useState, useEffect } from "react"
import { supabase } from '@lib/supabaseClient.js'
import { displayNotification } from '@lib/displayNotification.jsx';

// Importing common components
import PageButton from "@common/PageButton"
import ArticleCard from "../common/ArticleCard"
import ArticleModal from "../common/ArticleModal"


// Importing assets
import student from "@assets/Photos/etudiante_1.jpg"
import ministere from "@assets/Assets/logo_ministere.png"

/**
 * The More page.
 * @returns {React.ReactElement} More component.
 */
function More() {
    const [articles, setArticles] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedArticle, setSelectedArticle] = useState(null)


    useEffect(() => {
        fetchArticles()
    }, [])

    const fetchArticles = async () => {
        const { data, error } = await supabase
            .from('Articles')
            .select(`
              id,
              edited_at, 
              title, 
              content, 
              image, 
              file
            `)
            .order('edited_at', { ascending: false });

        if (error) {
            displayNotification("Erreur de chargement des articles", error.message, "danger")
        } else {
            setArticles(data);
        }
    }

    const handleArticleClick = async (article) => {
        let imageUrl = null;
        let fileUrl = null;

        if (article.image) {
            const { data } = supabase.storage
                .from('articles')
                .getPublicUrl(`images/${article.image}`);
            imageUrl = data?.publicUrl;
        }

        if (article.file) {
            const { data } = supabase.storage
                .from('articles')
                .getPublicUrl(`files/${article.file}`);
            fileUrl = data?.publicUrl;
        }

        const articleWithUrls = {
            ...article,
            image: imageUrl,
            file_url: fileUrl
        };

        setSelectedArticle(articleWithUrls);
        setIsModalOpen(true);
    }

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedArticle(null);
    }
    return (
        <>
            {/* Hero section with blue background */}
            {/* L'image passe en fond du bloc plutôt qu'en bande pleine : la page
                se resserre, et la photographie reste présente sans occuper
                quatre cents pixels de hauteur. */}
            <div className="relative overflow-hidden bg-gradient-to-b from-[#2872E0] to-[#0B3878] text-white">

                <img
                    src={student}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity pointer-events-none"
                />

                <div className="relative z-10">
                    <h1 className="text-center pt-12 pb-6 text-5xl lg:text-7xl font-bold drop-shadow-lg">Toujours plus !</h1>

                    {/* Carte Bons gestes, bonne assiette + Bouton Se Connecter */}
                    <div className="flex flex-col gap-6 px-6 pb-12 max-w-md mx-auto">
                        {/* Texte d'introduction */}
                        <p className="text-white text-center text-lg font-medium leading-relaxed drop-shadow">
                            Découvrez nos ressources pour vous aider au quotidien 👇
                        </p>
                        <div className="bg-white bg-opacity-10 border border-white border-opacity-30 rounded-xl p-4 backdrop-blur-sm">
                            <div className="flex items-start gap-4">
                                <span className="text-3xl">🥗</span>
                                <div>
                                    <h4 className="text-white font-bold text-xl mb-1">
                                        Bons gestes, bonne assiette
                                    </h4>
                                    <p className="text-blue-100 text-sm leading-relaxed mb-3">
                                        Un programme des Banques Alimentaires pour <span className="font-semibold text-white">mieux manger à petit budget</span>.
                                        Ateliers cuisine et recettes accessibles à tous.
                                    </p>
                                    <a
                                        href="https://bonsgestes-bonneassiette.org/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-[#FF8200] hover:text-white text-sm font-semibold transition-colors duration-200"
                                    >
                                        Découvrir les recettes →
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info pratique section */}
            {/* Même dégradé que la page « Qui sommes-nous » : les blocs blancs
                s'y détachent, et la transition rappelle la ligne claire du
                drapeau des Côtes-d'Armor. */}
            <div className="bg-gradient-to-b from-white via-[#3DA46A] to-[#0F8140] pb-12">
                <div className="pt-20 max-w-3xl mx-auto px-6">
                <h2 className="text-5xl text-[#1B62D4] font-semibold mb-10 text-center">Infos pratiques</h2>

                <div className="flex flex-col gap-4">

                    {/* Numéros utiles */}
                    <a href="https://solidarites.gouv.fr/tous-les-contacts-utiles"
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-200 hover:border-[#1B62D4] hover:shadow-md transition-all duration-200 group"
                    >
                        <span className="text-3xl">📞</span>
                        <div className="flex-1">
                            <p className="font-semibold text-[#1B62D4] group-hover:text-[#FF8200] transition-colors duration-200">Numéros utiles</p>
                            <p className="text-sm text-gray-500">Tous les contacts essentiels en cas de besoin</p>
                        </div>
                        <span className="text-gray-300 group-hover:text-[#FF8200] text-xl transition-colors duration-200">→</span>
                    </a>

                    {/* Soliguide */}
                    <a href="https://soliguide.fr/fr"
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-200 hover:border-[#1B62D4] hover:shadow-md transition-all duration-200 group"
                    >
                        <span className="text-3xl">🗺️</span>
                        <div className="flex-1">
                            <p className="font-semibold text-[#1B62D4] group-hover:text-[#FF8200] transition-colors duration-200">Soliguide</p>
                            <p className="text-sm text-gray-500">Accès aux services solidaires gratuits près de chez vous</p>
                        </div>
                        <span className="text-gray-300 group-hover:text-[#FF8200] text-xl transition-colors duration-200">→</span>
                    </a>

                    {/* Simulateur droits sociaux */}
                    <a href="https://www.mesdroitssociaux.gouv.fr/votre-simulateur/accueil"
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-200 hover:border-[#1B62D4] hover:shadow-md transition-all duration-200 group"
                    >
                        <span className="text-3xl">🧮</span>
                        <div className="flex-1">
                            <p className="font-semibold text-[#1B62D4] group-hover:text-[#FF8200] transition-colors duration-200">Simulateur de droits sociaux</p>
                            <p className="text-sm text-gray-500">Découvrez les aides auxquelles vous avez droit</p>
                        </div>
                        <span className="text-gray-300 group-hover:text-[#FF8200] text-xl transition-colors duration-200">→</span>
                    </a>

                    {/* Contact */}
                    <a href="/contact"
                        className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-200 hover:border-[#1B62D4] hover:shadow-md transition-all duration-200 group"
                    >
                        <span className="text-3xl">✉️</span>
                        <div className="flex-1">
                            <p className="font-semibold text-[#1B62D4] group-hover:text-[#FF8200] transition-colors duration-200">Une question ? Un message ?</p>
                            <p className="text-sm text-gray-500">Contactez-nous, nous vous répondrons rapidement</p>
                        </div>
                        <span className="text-gray-300 group-hover:text-[#FF8200] text-xl transition-colors duration-200">→</span>
                    </a>

                </div>

                {/* Texte + logo ministère */}
                <div className="flex flex-col items-center gap-4 mt-10 bg-white rounded-xl shadow-md p-6">
                    <p className="text-rayonblue font-semibold text-center">
                        Notre Épicerie Sociale et Solidaire distribue
                        des denrées alimentaires dont l'achat est
                        financé par l'État français.
                    </p>
                    <img src={ministere} alt="logo du ministère des solidarités et de la santé" className="w-[20em] mt-2" />
                </div>
                </div>
            </div>


            {/* Retours presse section */}
            <div className="pt-10">

                {/* Header sur fond vert clair, en écho à la palette du site */}
                <div className="bg-gradient-to-b from-white to-[#E8F3EC] py-10 px-6 mb-10 border-t border-b border-[#3DA46A]/30">
                    <h2 className="text-4xl text-[#FF8200] font-semibold text-center">
                        Actualités de la Banque Alimentaire des Côtes d'Armor
                    </h2>
                </div>

                {/* Grille articles */}
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 p-2">
                        {articles.map((article) => (
                            <ArticleCard
                                key={article.id}
                                article={article}
                                onClick={() => handleArticleClick(article)}
                            />
                        ))}
                    </div>
                </div>

            </div>

            <ArticleModal
                article={selectedArticle}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </>
    )
}

export default More
