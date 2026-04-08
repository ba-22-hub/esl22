// Importing dependencies
import { useState } from 'react';
import { displayNotification } from '@lib/displayNotification.jsx';
import { supabase } from '@lib/supabaseClient.js';
import { useNavigate } from 'react-router-dom';
import { useAuthor } from '@context/AuthorContext.jsx'

// Importing common components

import PasswrdInput from "@common/PasswrdInput.jsx"
import Loading from "@common/Loading.jsx"
// Importing assets
import illustration from "@assets/logos/password.png"

/**
 * The Login page.
 * @returns {React.ReactElement} Login component.
 */
function FirstConnection() {
    // useState init to store the form data in a JSON format
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        password: '',
        passwordConfirm: '',
        acceptTerms: false

    });
    const [dbLoading, setDbLoading] = useState(false)

    const [criteriaPassword, setCriteriaPassword] = useState({
        'minLength': false,
        'hasUppercase': false,
        'hasLowercase': false,
        'hasNumber': false,
        'hasNotRayon22': true
    })

    const { user } = useAuthor()

    // function to set the new formData value whenever the inputs are changed
    function handleChange(e) {
        const { name, value, type, checked } = e.target;

        const pass = value
        const field = name
        // we set the formData value to the current input value
        if (type === "checkbox") {
            setFormData({
                ...formData,
                [name]: checked
            });
        }
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
                "hasNumber": /[0-9]/.test(pass),
                "hasNotRayon22": !(/rayon22/i.test(pass))

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

            setDbLoading(true);

            try {
                // update password
                const { data: authData, error: authError } = await supabase.auth.updateUser({
                    password: formData.password
                });

                if (authError) {
                    displayNotification("Erreur lors de la réinitialisation : " + authError.message, "", "danger");
                    setDbLoading(false);
                    return;
                }

                // update db user
                const { error: dbError } = await supabase
                    .from('User')
                    .update({ status: "Actif", has_right: true})
                    .eq('id', user.id);

                if (dbError) {
                    displayNotification('Une erreur est survenue : ' + dbError.message, "", "danger");
                    setDbLoading(false);
                    return;
                }

                // 3. Succès final
                displayNotification("Mot de passe réinitialisé avec succès !", "", "success");
                navigate('/account');

            } catch (err) {
                // Gestion des erreurs inattendues (ex: coupure réseau)
                displayNotification("Une erreur critique est survenue", "", "danger");
            } finally {
                setDbLoading(false);
            }
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
                <h2 className="text-[#2E2EFF] text-4xl font-bold mb-6">Bienvenue sur le Rayon 22</h2>
                <p className='text-base text-center mb-10 mt-4'>Avant de continuer, merci de créer un nouveau mot de passe personnalisé <br />
                    Pour plus de sécurité, merci de ne pas intégrer <b className='text-rayonorange'>"rayon22"</b> dans votre mot de passe</p>

                {/* Formulaire */}
                {dbLoading ? (
                    <div className='w-100 h-100'>
                        <Loading />
                    </div>
                ) : (
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
                                <li className={criteriaPassword.hasNotRayon22 ? 'text-green' : 'text-red'}>Ne doit pas contenir "Rayon22"</li>
                            </ul>
                        </div>
                        <div className="ml-[5%] lg:ml-[8%] pl-4 flex items-center">
                            <input
                                className="w-[1.4rem] h-[1.4rem] rounded-lg border border-rayonblue"

                                type="checkbox"
                                name="acceptTerms"
                                checked={formData.acceptTerms}
                                onChange={handleChange}
                                required
                            />
                            <label className="text-rayonblue ml-2">J’ai lu et j'accepte les conditions d’utilisation.    </label>
                        </div>                        
                        <span onClick={() => navigate('/cgu')} className='text-rayonlightblue text-sm ml-[20%] cursor-pointer'>Lire les conditions d'utilisation</span>
                        {/* Bouton */}
                        <button
                            type="submit"
                            className="w-full bg-[#FF8200] text-white py-2 rounded-md text-sm font-medium hover:bg-orange-600 transition"
                        >
                            Créer mon mot de passe
                        </button>
                    </form>)}
            </div >
        </>
    )

}

export default FirstConnection