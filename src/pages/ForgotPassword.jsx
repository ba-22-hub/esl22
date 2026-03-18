// Importing dependencies
import { useState } from 'react';
import { supabase } from '@lib/supabaseClient.js';
import {displayNotification} from '@lib/displayNotification.jsx'

// Importing common components
import FormInput from "@common/FormInput";

// Importing assets
import illustration from "@assets/logos/password.png"

/**
 * The Login page.
 * @returns {React.ReactElement} Login component.
 */
function Login() {
  // useState init to store the form data in a JSON format
  const [formData, setFormData] = useState('');
  const [mailSent, setMailSent] = useState(false);

  // function to set the new formData value whenever the inputs are changed
  function handleChange(e) {
    // we set the formData value to the current input value
    setFormData(e.target.value);
  }

  // function to hadle the form submit
  async function handleSubmit(e) {
    e.preventDefault();
    console.log(formData);

    const { data, error } = await supabase.functions.invoke("retrieve-password", {
            body: {email: formData}
        })
    if (error){
      displayNotification('erreur : ' + error.message)
    } else {
      displayNotification('Un mail vous a été envoyé')
    }
  }

  return (
    <>
      <div className="bg-[#ffffff] lg:w-[70vw] mx-auto lg:mt-32 lg:mb-10 rounded-2xl shadow-sm flex flex-col items-center justify-start py-5 lg:py-16 px-4">
        {/* Titre principal */}
        <div className="text-center">
          <h1 className="text-[#2E2EFF] text-5xl lg:text-7xl font-extrabold leading-tight mb-5 lg:mb0">
            Changement de mot de passe
          </h1>
        </div>

        {/* Illustration */}
        <img src={illustration} alt="Illustration" className="hidden lg:block w-64 mt-10 mb-6" />


        {mailSent ?( 
          <p className='text-[#2E2EFF] text-2xl lg:text-4xl font-bold leading-tight'>Un email à été envoyé à l'addresse indiquée : <span className='text-rayonorange'>{formData}</span></p>
        ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          <FormInput
            inputText={<span className="text-rayonblue">Addresse mail liée au compte</span>}
            name="email"
            value={formData.password}
            onChange={handleChange}
            className="border border-[#2E2EFF] rounded-md text-sm px-4 py-2 w-full"
            isStarred={true}
          />
          {/* Bouton */}
          <button
            type="submit"
            className="w-full bg-[#FF8200] text-white py-2 rounded-md text-sm font-medium hover:bg-orange-600 transition"
          >
            Envoyer un mail
          </button>
        </form>)}
      </div>
    </>
  )

}

export default Login