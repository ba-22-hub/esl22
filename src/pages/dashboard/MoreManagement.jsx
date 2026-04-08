// Importing dependencies
import { useEffect, useState, useRef } from 'react';
import { useAuthor } from '@context/AuthorContext';
import { useActionData, useNavigate } from 'react-router-dom';
import { displayNotification } from '@lib/displayNotification.jsx';

import { supabase } from '@lib/supabaseClient';

// Importing common components
import Loading from '@common/Loading.jsx';
import FormInput from '@common/FormInput.jsx';
import FormTextArea from '@common/FormTextArea.jsx';
import ArticleModal from '@common/ArticleModal';


function MoreManagment() {

    const { isAdmin, loading } = useAuthor()
    const navigate = useNavigate()
    const [newArticle, setNewArticle] = useState({
        title: '',
        content: '',
        file: null,
        image: null
    })
    const [articles, setArticles] = useState([])
    const [submitting, setSubmitting] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedArticle, setSelectedArticle] = useState(null)
    const [expandedArticle, setExpandedArticle] = useState(null)
    const [showForm, setShowForm] = useState(false)

    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);

    useEffect(() => {
        if (loading) return;
        if (!isAdmin) {
            navigate('/admin')
            return;
        }
        fetchArticles()
    }, [loading]);

    useEffect(() => {
        fetchArticles()
    }, [submitting])

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

    function handleChange(e) {
        const { name, value } = e.target;

        setNewArticle(prevData => ({
            ...prevData,
            [name]: value
        }));
    }

    function handleFileChange(e, name) {
        const file = e.target.files[0];
        setNewArticle(prevData => ({
            ...prevData,
            [name]: file
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!newArticle.title.trim()) {
            displayNotification("Erreur", "Le titre est obligatoire", "error");
            return;
        }

        if (!newArticle.content.trim()) {
            displayNotification("Erreur", "Le contenu est obligatoire", "error");
            return;
        }

        setSubmitting(true);

        try {
            let imageName = null;
            let fileName = null;

            if (newArticle.image) {
                imageName = `${Date.now()}_${newArticle.image.name}`
                const imagePath = `images/${imageName}`;

                const { data: imageData, error: imageError } = await supabase.storage
                    .from('articles')
                    .upload(imagePath, newArticle.image);

                if (imageError) throw imageError;
            }

            if (newArticle.file) {
                fileName = `${Date.now()}_${newArticle.file.name}`
                const filePath = `files/${fileName}`;

                const { data: fileData, error: fileError } = await supabase.storage
                    .from('articles')
                    .upload(filePath, newArticle.file);

                if (fileError) throw fileError;
            }

            const { data, error } = await supabase
                .from('Articles')
                .insert([
                    {
                        title: newArticle.title,
                        content: newArticle.content,
                        image: imageName,
                        file: fileName,
                    }
                ])
                .select();

            if (error) throw error;

            displayNotification("Succès", "Article publié avec succès !", "success");

            setNewArticle({
                title: '',
                content: '',
                file: null,
                image: null
            });

            if (fileInputRef.current) fileInputRef.current.value = '';
            if (imageInputRef.current) imageInputRef.current.value = '';
            setShowForm(false);

        } catch (error) {
            console.error('Erreur lors de la publication:', error);
            displayNotification("Erreur", error.message || "Une erreur est survenue", "error");
        } finally {
            setSubmitting(false);
        }
    }

    function truncateContent(text, maxLength = 100) {
        if (!text) return '';
        const firstNewlineIndex = text.indexOf('\n');

        if (firstNewlineIndex !== -1 && firstNewlineIndex < maxLength) {
            return text.substring(0, firstNewlineIndex) + '...';
        }
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }

        return text;
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

    const handleDelete = async (article) => {
        const confirmDelete = window.confirm(
            `Êtes-vous sûr de vouloir supprimer l'article "${article.title}" ?\n\nCette action est irréversible.`
        );

        if (!confirmDelete) return;

        setSubmitting(true);

        try {
            if (article.image) {
                const imagePath = `images/${article.image}`;
                const { error: imageError } = await supabase.storage
                    .from('articles')
                    .remove([imagePath]);

                if (imageError) {
                    console.error('Erreur lors de la suppression de l\'image:', imageError);
                }
            }

            if (article.file) {
                const filePath = `files/${article.file}`;
                const { error: fileError } = await supabase.storage
                    .from('articles')
                    .remove([filePath]);

                if (fileError) {
                    console.error('Erreur lors de la suppression du fichier:', fileError);
                }
            }

            const { error: deleteError } = await supabase
                .from('Articles')
                .delete()
                .eq('id', article.id);

            if (deleteError) throw deleteError;

            displayNotification("Succès", "Article supprimé avec succès !", "success");

            fetchArticles();

        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            displayNotification("Erreur", error.message || "Une erreur est survenue lors de la suppression", "error");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            {loading || submitting ? (
                <Loading text={submitting ? "Publication de l'article..." : undefined} />
            ) : (
                <div className="p-6 bg-gray-50 min-h-screen">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-3xl font-bold mb-6 text-rayonblue">Gestion des Articles</h1>

                        {/* Bouton Ajouter un article */}
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-rayonorange w-full md:w-auto text-white px-8 py-3 rounded-lg mb-6 hover:opacity-90 transition font-semibold"
                        >
                            {showForm ? '✕ Annuler' : '➕ Ajouter un article'}
                        </button>

                        {/* Formulaire d'ajout */}
                        {showForm && (
                            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                                <h2 className="text-xl font-semibold mb-4 text-rayonblue">Nouvel article</h2>
                                <form onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Colonne gauche */}
                                        <div className="space-y-4">
                                            <FormInput
                                                className="w-full h-10 px-3 rounded-lg border-2 border-rayonblue focus:ring-2 focus:ring-rayonorange"
                                                inputText="Titre"
                                                name='title'
                                                value={newArticle.title}
                                                onChange={handleChange}
                                                isStarred={true}
                                            />
                                            <div>
                                                <label className="text-rayonblue mb-2 block font-medium">
                                                    Contenu <span className="text-red-500">*</span>
                                                </label>
                                                <textarea
                                                    name="content"
                                                    value={newArticle.content}
                                                    onChange={handleChange}
                                                    className="w-full h-64 border-2 border-rayonblue rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rayonorange"
                                                    placeholder="Écrivez le contenu de l'article..."
                                                />
                                            </div>
                                        </div>

                                        {/* Colonne droite */}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-rayonblue mb-2 block font-medium">
                                                    Fichier PDF (optionnel)
                                                </label>
                                                <input
                                                    type='file'
                                                    accept='.pdf'
                                                    name='file'
                                                    onChange={(e) => {
                                                        if (e.target.files[0]) {
                                                            displayNotification("Fichier sélectionné :", e.target.files[0].name, "info")
                                                            handleFileChange(e, 'file');
                                                        }
                                                    }}
                                                    ref={fileInputRef}
                                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-rayonblue file:text-white hover:file:opacity-90 file:cursor-pointer"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-rayonblue mb-2 block font-medium">
                                                    Image (optionnel)
                                                </label>
                                                <input
                                                    type='file'
                                                    accept='.png,.svg,.jpg,.jpeg'
                                                    name='image'
                                                    onChange={(e) => {
                                                        if (e.target.files[0]) {
                                                            displayNotification("Image sélectionnée :", e.target.files[0].name, "info")
                                                            handleFileChange(e, 'image');
                                                        }
                                                    }}
                                                    ref={imageInputRef}
                                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-rayonblue file:text-white hover:file:opacity-90 file:cursor-pointer"
                                                />
                                            </div>

                                            {/* Preview des fichiers sélectionnés */}
                                            {(newArticle.file || newArticle.image) && (
                                                <div className="bg-blue-50 border border-rayonblue rounded-lg p-4">
                                                    <p className="text-sm font-medium text-rayonblue mb-2">Fichiers sélectionnés :</p>
                                                    {newArticle.file && (
                                                        <p className="text-sm text-gray-700">📄 {newArticle.file.name}</p>
                                                    )}
                                                    {newArticle.image && (
                                                        <p className="text-sm text-gray-700">🖼️ {newArticle.image.name}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="mt-6 w-full md:w-auto px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
                                    >
                                        ✓ Publier l'article
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Liste des articles */}
                        <div className="space-y-4 mb-6">
                            {articles.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
                                    <p className="text-lg">Aucun article publié</p>
                                </div>
                            ) : (
                                articles.map((article) => (
                                    <div key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                                        {/* En-tête de l'article */}
                                        <div className="p-4 bg-gradient-to-r from-blue-50 to-white border-b border-rayonblue">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                                        {article.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        {truncateContent(article.content)}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        <span>{new Date(article.edited_at).toLocaleDateString('fr-FR')} à {new Date(article.edited_at).toLocaleTimeString('fr-FR')}</span>
                                                        {article.file && <span>📎 PDF</span>}
                                                        {article.image && <span>🖼️ Image</span>}
                                                    </div>
                                                </div>

                                                {/* Boutons d'action */}
                                                <div className="flex items-center gap-2 ml-4">
                                                    <button
                                                        onClick={() => handleArticleClick(article)}
                                                        className="px-3 py-2 bg-rayonblue hover:opacity-90 text-white rounded-lg transition text-sm font-medium"
                                                        title="Voir l'article"
                                                    >
                                                        👁️ Voir
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDelete(article)
                                                        }}
                                                        className="w-10 h-10 bg-red hover:bg-red-600 text-white rounded-lg transition flex items-center justify-center text-xl"
                                                        title="Supprimer"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <ArticleModal
                            article={selectedArticle}
                            isOpen={isModalOpen}
                            onClose={handleCloseModal}
                        />
                    </div>
                </div>
            )}
        </>
    );
}

export default MoreManagment;