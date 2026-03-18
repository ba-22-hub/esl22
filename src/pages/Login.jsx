// Importing dependencies
import { useState } from 'react';
import { supabase } from '@lib/supabaseClient.js';
import { useAuthor } from '@context/AuthorContext.jsx';
import { useNavigate } from 'react-router-dom';
import { displayNotification } from '@lib/displayNotification.jsx';

// Importing common components
import FormInput from "@common/FormInput";
import PageButton from "@common/PageButton";
import PasswrdInput from '../common/PasswrdInput';

/**
 * The Login page.
 * @returns {React.ReactElement} Login component.
 */
function Login() {
	// useState init to store the form data in a JSON format
	const [formData, setFormData] = useState({
		mail: '',
		password: ''
	});
	const { setUser } = useAuthor()
	let navigate = useNavigate()

	// function to set the new formData value whenever the inputs are changed
	function handleChange(e) {
		// we set the formData value to the current input value
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		});
	}

	// function to hadle the form submit
	async function handleSubmit(e) {
		e.preventDefault();

		// Auth Supabase
		const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
			email: formData.mail,
			password: formData.password
		});

		const { data: sessionData } = await supabase.auth.getSession();


		if (loginError) {
			if (loginError.message == "Invalid login credentials") {
				displayNotification("Échec de connexion", "Adresse e-mail ou mot de passe incorrect", "danger")
			} else {
				displayNotification("Échec de la connexion", loginError.message, "danger")
			}
			return;
		}

		displayNotification("Connexion réussie", "", "success")

		// update session
		setUser(loginData.user)

		// verify si user status == "Enregistré"
            const { data: userdata, error: dberror } = await supabase
                .from('User')
                .select('*')
                .eq('id', loginData.user.id) // in theory we come from "Login" where we use setUser
                .single();

            if (dberror && dberror.code !== 'PGRST116') {
                displayNotification("Erreur lors de la vérification de l'utilisateur", dberror.message, "danger")
                return;
            }

            if (userdata.status != "Enregistré") {
                navigate('/account')
            } else {
				navigate('/first-connection')
			}

		
		

	}

	return (
		<>
			<div className="bg-[#ffffff] lg:w-[65.56vw] mx-auto mt-10 lg:mt-32 mb-10 rounded-2xl shadow-sm lg:py-12 px-6">
				<h1 className="text-[#2E2EFF] lg:text-7xl text-5xl font-extrabold text-center leading-tight mb-2">
					Bienvenue sur votre Espace Utilisateur
				</h1>
				<p className="text-black text-base text-center mb-10 mt-4">
					Connectez vous en utilisant le formulaire ci-dessous
				</p>
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="lg:w-[65%] w-[90%] mx-auto">
						<FormInput
							inputText={<span className="text-rayonblue">Adresse email</span>}
							name={'mail'}
							value={formData.mail}
							onChange={handleChange}
							isStarred={true}
							className="border border-[#2E2EFF] rounded-md text-sm px-4 py-2 w-full"
						/>
					</div>
					<div className="lg:w-[65%] w-[90%] mx-auto">
						<PasswrdInput
							inputText={<span className="text-rayonblue">Mot de passe</span>}
							name={'password'}
							value={formData.password}
							onChange={handleChange}
							isStarred={true}
							className="border border-[#2E2EFF] rounded-md text-sm px-4 py-2 w-full"
						/>
					</div>
					<div className="text-right w-[65%] mx-auto">
						<PageButton
							buttonText={'Mot de passe oublié ?'}
							page={'/forgot-password'}
							className="text-[#2E2EFF] text-sm font-medium underline hover:text-blue-600"
						/>
					</div>
					<div className="w-full flex justify-center">
						<PageButton
							buttonText={'Je me connecte'}
							type="submit"
							className="w-[90vw] lg:w-[400px] h-10 bg-[#FF8200] text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
						/>
					</div>
				</form>

				<div className="flex justify-center">
					<PageButton
						buttonText='Admin'
						page='/admin'
						className='w-[90vw] lg:w-[400px] h-10 bg-[#FF8200] text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition mt-4' />
				</div>
			</div>
		</>
	)

}

export default Login