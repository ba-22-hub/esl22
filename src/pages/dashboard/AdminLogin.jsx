// Importing dependencies
import { useContext, useState } from 'react';
import { supabase } from '@lib/supabaseClient.js';
import { useNavigate } from 'react-router-dom';
import { useAuthor } from '@context/AuthorContext';
import { displayNotification } from '@lib/displayNotification.jsx';

// Importing common components
import FormInput from "@common/FormInput.jsx";
import PageButton from "@common/PageButton.jsx";

/**
 * The AdminLogin page.
 * @returns {React.ReactElement} AdminLogin component.
 */
function AdminLogin() {
    const [formData, setFormData] = useState({
        mail: '',
        password: ''
    });

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

        // 1. Auth Supabase
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: formData.mail,
            password: formData.password
        });

        if (loginError) {
            console.error("Erreur login:", loginError);
            displayNotification("Erreur lors de la connexion", loginError.message, "danger")
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
            alert("Ce compte n'est pas administrateur")
            return;
        }





    }

    return (
        <div className="bg-[#ffffff] w-[65.56vw] mx-auto mt-32 mb-10 rounded-2xl shadow-sm py-12 px-6">
            <div className="admin-login">
                <h1 className="text-[#2E2EFF] text-7xl font-extrabold text-center leading-tight mb-2">Admin Login</h1>
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Email */}
                    <div className="w-[65%] mx-auto">
                        <FormInput
                            type="email"
                            name="mail"
                            value={formData.mail}
                            onChange={handleChange}
                            label="Email"
                            required
                            className="border border-[#2E2EFF] rounded-md text-sm px-4 py-2 w-full"
                        />
                    </div>

                    {/* Password */}
                    <div className="w-[65%] mx-auto">
                        <PasswrdInput
                            inputText={<span className="text-rayonblue">Mot de passe</span>}
                            name={'password'}
                            value={formData.password}
                            onChange={handleChange}
                            isStarred={true}
                            className="border border-[#2E2EFF] rounded-md text-sm px-4 py-2 w-full"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="w-full flex justify-center">
                        <PageButton
                            buttonText={'Je me connecte'}
                            type="submit"
                            className="w-[400px] h-10 bg-[#FF8200] text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
                        />
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AdminLogin;
