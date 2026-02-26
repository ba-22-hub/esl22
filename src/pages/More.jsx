import { useState, useEffect } from "react"
import { supabase } from '@lib/supabaseClient.js'
import { displayNotification } from '@lib/displayNotification.jsx';

// Importing common components
import PageButton from "@common/PageButton"
import ArticleCard from "../common/ArticleCard"
import ArticleModal from "../common/ArticleModal"


// Importing assets
import student from "@assets/Photos/etudiante1.png"
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
            console.error('Erreur de chargement des articles:', error);
            displayNotification("Erreur de chargement des articles", error.message, "danger")
        } else {
            console.log(data)
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
            <div className="bg-gradient-to-b from-[#3435FF] via-[#2526B7] to-[#1F2099] lg:h-[527px] text-white">
                <h1 className="ml-12 lg:ml-[480px] py-10  mb-120  text-5xl lg:text-7xl font-bold">Toujours plus !</h1>
                <img src={student} className="hidden lg:flex w-full h-[411px] object-cover" alt="Student" />
            </div>

            {/* Info pratique section */}
            <div className="pt-20">
                <h2 className="ml-20 text-4xl text-[#3435FF] font-semibold mb-4">Infos pratique</h2>
                <p className="text-rayonblue pl-10">Des <a className="text-rayonorange underline" href="https://solidarites.gouv.fr/tous-les-contacts-utiles">numéros utiles</a></p><br />
                <p className="text-rayonblue pl-10"><a className="text-rayonorange underline" href="https://soliguide.fr/fr">Soliguide</a> accès aux services solidaires gratuits</p><br />
                <p className="text-rayonblue pl-10">Le<a className="text-rayonorange underline" href="https://www.mesdroitssociaux.gouv.fr/votre-simulateur/accueil"> simulateur </a>des droits sociaux</p><br />
                <PageButton
                    className="text-rayonorange underline pl-10"
                    buttonText="Une question ? Un message ?"
                    page="/contact"
                />
                <p className="text-rayonblue pl-10 mt-4 font-semibold">
                    Notre Épicerie Sociale et Solidaire distribue
                    des denrées alimentaires dont l’achat est
                    financé par l’État français.
                </p>
                <img src={ministere} alt="logo du ministère des solidarités et de la santé" className="hidden lg:flex w-[40em] mt-5 ml-10 " />
            </div>

            {/* Retours presse section */}
            <div className="pt-36 lg:w-[90%] lg:ml-[5%]">
                <h2 className="ml-20 text-4xl text-[#3435FF] font-semibold mb-4">Retours presse</h2>
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
            <ArticleModal
                article={selectedArticle}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </>
    )
}

export default More