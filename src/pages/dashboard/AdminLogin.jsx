// Importing dependencies
import { useContext, useState } from 'react';
import { supabase } from '@lib/supabaseClient.js';
import { useNavigate } from 'react-router-dom';
import { useAuthor } from '@context/AuthorContext';
import { displayNotification } from '@lib/displayNotification.jsx';

// Importing common components
import FormInput from "@common/FormInput.jsx";
import PageButton from "@common/PageButton.jsx";
import PasswrdInput from "@common/PasswrdInput.jsx"

/**
 * The AdminLogin page.
 * @returns {React.ReactElement} AdminLogin component.
 */
function AdminLogin() {
    const [formData, setFormData] = useState({
        mail: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate()
    const { checkIsAdmin } = useAuthor()

    function handleChange(e) {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setIsLoading(true);

        // 1. Auth Supabase
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: formData.mail,
            password: formData.password
        });

        if (loginError) {
            console.error("Erreur login:", loginError);
            displayNotification("Erreur lors de la connexion", loginError.message, "danger")
            setIsLoading(false);
            return;
        }

        const userId = loginData.user.id;
        displayNotification("ID de l'utilisateur :", userId, "info")

        // 2. Check if the user is an admin
        const [adminAnswer] = await Promise.all([
            checkIsAdmin(userId)
        ]);

        if (adminAnswer) {
            displayNotification("Connexion admin effectuée avec succès", "success", "top")
            navigate('/admin/users')
            return;
        } else {
            displayNotification("Accès refusé", "Ce compte n'est pas administrateur", "danger")
            setIsLoading(false);
            return;
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Carte de login */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* En-tête avec dégradé bleu */}
                    <div className="bg-gradient-to-r from-rayonblue to-blue-600 p-8 text-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="text-4xl font-bold text-rayonblue">R</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Administration
                        </h1>
                        <p className="text-blue-100 text-sm">
                            Rayon22 - Espace Admin
                        </p>
                    </div>

                    {/* Formulaire */}
                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-rayonblue mb-2">
                                    📧 Email
                                </label>
                                <input
                                    type="email"
                                    name="mail"
                                    value={formData.mail}
                                    onChange={handleChange}
                                    required
                                    placeholder="admin@rayon22.fr"
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-rayonblue focus:ring-2 focus:ring-rayonorange transition"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <PasswrdInput 
                                    labelClassName={"block text-sm font-medium text-rayonblue mb-2"}
                                    className={"w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-rayonblue focus:ring-2 focus:ring-rayonorange transition"}
                                    inputText={"🔒 Mot de passe"}
                                    name={"password"}
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-3 rounded-lg font-semibold text-white transition shadow-lg ${isLoading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-rayonorange to-orange-600 hover:from-orange-600 hover:to-rayonorange'
                                    }`}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Connexion en cours...
                                    </span>
                                ) : (
                                    '🔓 Se connecter'
                                )}
                            </button>
                        </form>

                        {/* Lien retour */}
                        <div className="mt-6 text-center">
                            <a
                                href="/"
                                className="text-sm text-gray-600 hover:text-rayonblue transition"
                            >
                                ← Retour au site Rayon22
                            </a>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-sm text-gray-600">
                    <p>© 2024 Rayon22 - Tous droits réservés</p>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;