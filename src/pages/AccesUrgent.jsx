// =============================================================================
// HISTORIQUE DES MODIFICATIONS
// =============================================================================
//
// Date          Auteur        Description
// ----------    ----------    -------------------------------------------------
// 2026-08-26    Louvel       Création : page d'atterrissage du lien d'accès
//                            adressé à un bénéficiaire autorisé à composer
//                            lui-même son colis.
// 2026-08-28    Louvel       Renvoi vers la page de demande d'un nouveau lien
//                            lorsque celui reçu n'est plus valable.
//
// =============================================================================
//
// Le lien reçu par courriel ouvre une session Supabase, puis renvoie ici. La
// page vérifie que l'accès est toujours ouvert, en informe la personne, et la
// conduit au catalogue.
//
// Elle est volontairement dépouillée et rédigée sans vocabulaire technique :
// elle s'adresse à des personnes en difficulté, pas nécessairement à l'aise
// avec les démarches en ligne, et constitue leur tout premier contact avec le
// site.
//
// =============================================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@lib/supabaseClient.js';

// Le jeton est déposé dans l'URL par Supabase, qui l'exploite au chargement.
// L'opération n'est pas instantanée : on laisse quelques instants à la session
// pour s'établir avant de conclure à un lien invalide.
const SESSION_TIMEOUT_MS = 8000;

function formatEuros(value) {
	return Number(value ?? 0).toFixed(2).replace('.', ',');
}

function formatDateLong(value) {
	return new Date(value).toLocaleDateString('fr-FR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});
}

function AccesUrgent() {
	const [state, setState] = useState('loading');
	const [authorization, setAuthorization] = useState(null);
	const [firstName, setFirstName] = useState('');
	const navigate = useNavigate();

	useEffect(() => {
		let cancelled = false;
		let listener = null;
		let timeoutId = null;

		async function proceed(session) {
			if (cancelled) return;

			const { data: userRow } = await supabase
				.from('User')
				.select('firstName, accountType')
				.eq('id', session.user.id)
				.single();

			if (cancelled) return;

			// Un bénéficiaire ordinaire ou un centre social n'a rien à faire ici :
			// il dispose de son propre parcours.
			if (userRow?.accountType !== 'urgent') {
				navigate('/');
				return;
			}

			setFirstName(userRow.firstName || '');

			// La fonction vérifie l'échéance, marque la première ouverture et
			// renvoie l'état de l'autorisation.
			const { data: result, error } = await supabase.rpc('mark_authorization_opened');

			if (cancelled) return;

			if (error) {
				console.error('Vérification de l\'autorisation :', error);
				setState('error');
				return;
			}

			if (!result?.ok) {
				setState(result?.reason === 'expired' ? 'expired' : 'no_authorization');
				return;
			}

			setAuthorization(result);
			setState('ready');
		}

		async function init() {
			const { data } = await supabase.auth.getSession();
			if (data?.session) {
				proceed(data.session);
				return;
			}

			// Session pas encore établie : on attend l'évènement plutôt que de
			// conclure trop vite à un lien invalide.
			const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
				if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
					if (timeoutId) clearTimeout(timeoutId);
					proceed(session);
				}
			});
			listener = sub;

			timeoutId = setTimeout(() => {
				if (!cancelled) setState('invalid_link');
			}, SESSION_TIMEOUT_MS);
		}

		init();

		return () => {
			cancelled = true;
			if (timeoutId) clearTimeout(timeoutId);
			if (listener) listener.subscription.unsubscribe();
		};
	}, [navigate]);

	const Frame = ({ children }) => (
		<div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
			<div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border-t-4 border-[#FF8200] p-8">
				{children}
			</div>
		</div>
	);

	if (state === 'loading') {
		return (
			<Frame>
				<p className="text-center text-lg text-rayonblue">Vérification de votre accès…</p>
			</Frame>
		);
	}

	if (state === 'invalid_link' || state === 'error') {
		return (
			<Frame>
				<h1 className="text-2xl font-bold text-rayonblue mb-4">Ce lien n'est plus valable</h1>
				<p className="text-gray-700 mb-3">
					Pour votre sécurité, le lien reçu par courriel ne fonctionne que
					quelques heures.
				</p>
				<p className="text-gray-700 mb-6">
					Vous pouvez en demander un nouveau : il vous sera envoyé
					immédiatement à la même adresse.
				</p>
				<button
					onClick={() => navigate('/demander-un-lien')}
					className="w-full bg-[#FF8200] hover:opacity-90 text-white font-semibold rounded-lg py-3 transition"
				>Recevoir un nouveau lien</button>
			</Frame>
		);
	}

	if (state === 'expired' || state === 'no_authorization') {
		return (
			<Frame>
				<h1 className="text-2xl font-bold text-rayonblue mb-4">
					Votre accès est terminé
				</h1>
				<p className="text-gray-700 mb-3">
					{state === 'expired'
						? "La date jusqu'à laquelle vous pouviez composer votre colis est passée."
						: "Vous n'avez pas d'aide en cours pour le moment."}
				</p>
				<p className="text-gray-700 mb-6">
					Rapprochez-vous du service social qui vous accompagne : lui seul
					peut vous ouvrir un nouvel accès.
				</p>
				{/* Une nouvelle aide a pu être accordée depuis l'envoi de ce
				    lien : la personne peut alors en demander un à jour. */}
				<button
					onClick={() => navigate('/demander-un-lien')}
					className="w-full bg-white border-2 border-[#FF8200] text-[#FF8200] hover:bg-orange-50 font-semibold rounded-lg py-3 transition"
				>J'ai reçu une nouvelle aide, recevoir un lien</button>
			</Frame>
		);
	}

	// state === 'ready'
	return (
		<Frame>
			<h1 className="text-2xl font-bold text-rayonblue mb-2">
				Bonjour{firstName ? ` ${firstName}` : ''},
			</h1>
			<p className="text-gray-700 mb-6">
				Vous pouvez choisir vous-même les produits de votre colis.
				Vous n'avez rien à payer.
			</p>

			<div className="bg-[#F7F7FA] border border-gray-200 rounded-xl p-5 mb-6 text-center">
				<p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
					Montant dont vous disposez
				</p>
				<p className="text-4xl font-bold text-[#FF8200] mb-2">
					{formatEuros(authorization.remaining)} €
				</p>
				<p className="text-sm text-gray-600">
					À utiliser avant le <strong>{formatDateLong(authorization.expiresAt)}</strong>
				</p>
				{authorization.spentAmount > 0 && (
					<p className="text-xs text-gray-500 mt-2">
						Vous avez déjà utilisé {formatEuros(authorization.spentAmount)} €
						sur {formatEuros(authorization.spendingLimit)} €.
					</p>
				)}
			</div>

			<button
				onClick={() => navigate('/catalog')}
				className="w-full bg-[#FF8200] hover:opacity-90 text-white font-semibold rounded-lg py-3 transition mb-4"
			>Choisir mes produits</button>

			<p className="text-xs text-gray-500 leading-relaxed">
				Ce montant comprend la participation aux frais de livraison.
				Une fois vos produits choisis, vous indiquerez le point relais où
				vous souhaitez retirer votre colis ; vous serez prévenu par SMS
				dès qu'il y sera disponible.
			</p>
		</Frame>
	);
}

export default AccesUrgent;
