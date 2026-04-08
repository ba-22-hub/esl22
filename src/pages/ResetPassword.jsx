// Importing dependencies
import { useState } from 'react';
import { displayNotification } from '@lib/displayNotification.jsx';
import { supabase } from '@lib/supabaseClient.js';
import { useNavigate } from 'react-router-dom';

// Importing common components
import FormInput from "@common/FormInput";
import PasswrdInput from "@common/PasswrdInput.jsx"

// Importing assets
import illustration from "@assets/logos/password.png"

/**
 * The Login page.
 * @returns {React.ReactElement} Login component.
 */
function ResetPassword() {
    // useState init to store the form data in a JSON format
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        password: '',
        passwordConfirm: ''
    });

    const [criteriaPassword, setCriteriaPassword] = useState({
        'minLength': false,
        'hasUppercase': false,
        'hasLowercase': false,
        'hasNumber': false
    })

    // function to set the new formData value whenever the inputs are changed
    function handleChange(e) {
        const pass = e.target.value
        const field = e.target.name
        // we set the formData value to the current input value
        setFormData({
            ...formData,
            [field]: pass
        });


        if (field == "password") {
            // check if the password respect some instructions
            setCriteriaPassword({
                "minLength": pass.length >= 8,
                "hasLowercase": /[a-z]/.test(pass),
                "hasUppercase": /[A-Z]/.test(pass),
                "hasNumber": /[0-9]/.test(pass)

            })
        }
    }

    // function to hadle the form submit
    async function handleSubmit(e) {
        e.preventDefault();

        // checking if the 2 password are identical 
        if (formData.password != formData.passwordConfirm) {
            //alert("Les mots de passe renseignés sont différents")
            displayNotification("Les mots de passe renseignés sont différents", "", "danger")
        } else if (criteriaPassword.minLength && criteriaPassword.hasLowercase && criteriaPassword.hasUppercase && criteriaPassword.hasNumber) {
            // resseting the password
            await supabase.auth.updateUser({ password: formData.password })
                .then((response) => {
                    if (response.error) {
                        displayNotification("Erreur lors de la réinitialisation du mot de passe : " + response.error.message, "", "danger")
                    } else {
                        displayNotification("Mot de passe réinitialisé avec succès ! Vous pouvez maintenant vous connecter.", "", "success")
                        navigate('/login')
                    }
                })
        } else {
            // if not, alert the client
            //alert("Le mot de passe ne respecte pas les consignes")
            displayNotification("Le mot de passe ne respecte pas les consignes", "", "danger")
        }
    }

    return (
        <>
            <div className="bg-[#ffffff] mx-auto mt-2 mb-10 flex flex-col items-center justify-start py-10 px-4">
                {/* Illustration */}
                <img src={illustration} alt="Illustration" className="w-64 mt-3 mb-6" />

                {/* Sous-titre */}
                <h2 className="text-[#2E2EFF] text-4xl font-bold mb-6">Réinitialisation du mot de passe</h2>

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
                    <PasswrdInput
                        inputText={<span>Mot de passe</span>}
                        name="password"
                        onChange={handleChange}
                        className="border border-[#2E2EFF] rounded-md text-sm px-4 py-2 w-full"
                        isStarred={true}
                    />
                    <PasswrdInput
                        inputText={<span>Confirmation du mot de passe</span>}
                        name="passwordConfirm"
                        onChange={handleChange}
                        className="border border-[#2E2EFF] rounded-md text-sm px-4 py-2 w-full"
                        isStarred={true}
                    />

                    {/* Bloc règles */}
                    <div className="bg-[#F0F0F0] rounded-lg px-6 py-4 text-sm text-[#2E2EFF] font-medium leading-relaxed mt-6">
                        <p className="mb-1 font-bold">Règles pour définir le mot de passe</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li className={criteriaPassword.minLength ? 'text-green' : 'text-red'}>Doit contenir au moins 8 caractères</li>
                            <li className={criteriaPassword.hasUppercase ? 'text-green' : 'text-red'}>Doit contenir au moins un caractère en majuscule</li>
                            <li className={criteriaPassword.hasLowercase ? 'text-green' : 'text-red'}>Doit contenir au moins un caractère en minuscule</li>
                            <li className={criteriaPassword.hasNumber ? 'text-green' : 'text-red'}>Doit contenir au moins un nombre</li>
                        </ul>
                    </div>

                    {/* Bouton */}
                    <button
                        type="submit"
                        className="w-full bg-[#FF8200] text-white py-2 rounded-md text-sm font-medium hover:bg-orange-600 transition"
                    >
                        Créer mon mot de passe
                    </button>
                </form>
            </div>
        </>
    )

}

export default ResetPassword