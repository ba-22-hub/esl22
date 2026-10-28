// =============================================================================
// HISTORIQUE DES MODIFICATIONS
// =============================================================================
//
// Date          Auteur        Description
// ----------    ----------    -------------------------------------------------
// 2026-10-28    Louvel       message de confirmation enfin affiché (mailSent),
//                            champ email contrôlé, clavier email sur mobile,
//                            protection contre le double envoi, fautes
//                            corrigées (adresse, « a été envoyé »)
//
// =============================================================================
// Importing dependencies
import { useState } from 'react';
import { supabase } from '@lib/supabaseClient.js';
import { displayNotification } from '@lib/displayNotification.jsx'

// Importing common components
import FormInput from "@common/FormInput";

// Importing assets
import illustration from "@assets/logos/password.png"

/**
 * Page « mot de passe oublié » : envoie un lien de changement de mot de
 * passe à l'adresse liée au compte.
 * @returns {React.ReactElement} ForgotPassword component.
 */
function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [mailSent, setMailSent] = useState(false);
  const [sending, setSending] = useState(false);

  function handleChange(e) {
    setEmail(e.target.value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (sending) return;

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      displayNotification("Indiquez l'adresse mail liée à votre compte", "", "danger");
      return;
    }

    setSending(true);
    const { error } = await supabase.functions.invoke("retrieve-password", {
      body: { email: cleanEmail }
    });
    setSending(false);

    if (error) {
      displayNotification("L'envoi du mail a échoué", "Vérifiez l'adresse saisie puis réessayez.", "danger");
    } else {
      setMailSent(true);
    }
  }

  return (
    <>
      <div className="bg-[#ffffff] lg:w-[70vw] mx-auto lg:mt-32 lg:mb-10 rounded-2xl shadow-sm flex flex-col items-center justify-start py-5 lg:py-16 px-4">
        {/* Titre principal */}
        <div className="text-center">
          <h1 className="text-[#2E2EFF] text-4xl lg:text-7xl font-extrabold leading-tight mb-5 lg:mb-0">
            Changement de mot de passe
          </h1>
        </div>

        {/* Illustration */}
        <img src={illustration} alt="Illustration" className="hidden lg:block w-64 mt-10 mb-6" />

        {mailSent ? (
          <div className="w-full max-w-md text-center space-y-4">
            <p className="text-[#2E2EFF] text-2xl lg:text-3xl font-bold leading-tight">
              Un email a été envoyé à l'adresse indiquée :{" "}
              <span className="text-rayonorange break-all">{email.trim()}</span>
            </p>
            <p className="text-gray-600">
              Ouvrez-le et touchez le lien pour choisir votre nouveau mot de passe.
              Pensez à regarder dans les courriers indésirables (spams).
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
            <FormInput
              inputText={<span className="text-rayonblue">Adresse mail liée au compte</span>}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={handleChange}
              className="border border-[#2E2EFF] rounded-md text-sm px-4 py-2 w-full"
              isStarred={true}
            />
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-[#FF8200] text-white py-2 rounded-md text-sm font-medium hover:bg-orange-600 transition disabled:opacity-60"
            >
              {sending ? "Envoi en cours…" : "Envoyer un mail"}
            </button>
          </form>
        )}
      </div>
    </>
  )
}

export default ForgotPassword
