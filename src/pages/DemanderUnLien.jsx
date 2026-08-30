// =============================================================================
// HISTORIQUE DES MODIFICATIONS
// =============================================================================
//
// Date          Auteur        Description
// ----------    ----------    -------------------------------------------------
// 2026-08-28    Louvel       Création : demande d'un nouveau lien d'accès par
//                            un bénéficiaire dont l'autorisation court encore.
//
// =============================================================================
//
// Le lien reçu par courriel ne vaut que quelques heures, alors qu'une aide peut
// courir plusieurs semaines. Cette page permet d'en obtenir un nouveau.
//
// Le message affiché est le même que l'adresse soit connue ou non : indiquer
// qu'une adresse est inconnue permettrait de savoir, par essais successifs, qui
// bénéficie de l'aide alimentaire.
//
// =============================================================================

import { useState } from 'react';
import { supabase } from '@lib/supabaseClient.js';

function DemanderUnLien() {
	const [email, setEmail] = useState('');
	const [isSending, setIsSending] = useState(false);
	const [sent, setSent] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!email.trim()) return;

		setIsSending(true);
		// La fonction répond toujours favorablement : le résultat réel n'est
		// pas exploitable côté navigateur, et c'est voulu.
		await supabase.functions.invoke('request-urgent-link', {
			body: { email: email.trim() },
		});
		setIsSending(false);
		setSent(true);
	};

	return (
		<div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
			<div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border-t-4 border-[#FF8200] p-8">

				{sent ? (
					<>
						<h1 className="text-2xl font-bold text-rayonblue mb-4">
							Vérifiez votre boîte aux lettres
						</h1>
						<p className="text-gray-700 mb-3">
							Si un accès est ouvert pour cette adresse, un lien vient de
							vous être envoyé. Il vous suffit de cliquer dessus pour
							composer votre colis.
						</p>
						<p className="text-gray-700 mb-6">
							Le message peut mettre quelques minutes à arriver. Pensez à
							regarder dans vos courriers indésirables.
						</p>
						<button
							onClick={() => { setSent(false); setEmail(''); }}
							className="text-sm text-rayonblue underline"
						>Essayer avec une autre adresse</button>
					</>
				) : (
					<>
						<h1 className="text-2xl font-bold text-rayonblue mb-4">
							Recevoir un lien pour composer votre colis
						</h1>
						<p className="text-gray-700 mb-6">
							Indiquez l'adresse électronique que vous avez communiquée au
							service social qui vous accompagne. Vous recevrez aussitôt un
							lien pour accéder à vos produits.
						</p>

						<form onSubmit={handleSubmit}>
							<label className="block text-sm font-medium text-rayonblue mb-1">
								Votre adresse électronique
							</label>
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="exemple@courriel.fr"
								required
								className="w-full h-12 rounded-lg border-2 border-rayonblue px-3 mb-5"
							/>

							<button
								type="submit"
								disabled={isSending || !email.trim()}
								className="w-full bg-[#FF8200] hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-lg py-3 transition"
							>{isSending ? 'Envoi en cours…' : 'Recevoir mon lien'}</button>
						</form>

						<p className="text-xs text-gray-500 mt-6 leading-relaxed">
							Cette page s'adresse aux personnes à qui un service social a
							ouvert un accès. Si vous êtes inscrit à l'épicerie solidaire,
							connectez-vous avec votre mot de passe habituel.
						</p>
					</>
				)}

			</div>
		</div>
	);
}

export default DemanderUnLien;
