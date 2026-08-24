// =============================================================================
// HISTORIQUE DES MODIFICATIONS
// =============================================================================
//
// Date          Auteur        Description
// ----------    ----------    -------------------------------------------------
// 2026-08-06    Louvel        Création : gestion des fiches bénéficiaires
//                             "colis urgent" par un compte MDS (CRUD complet)
//                             et consultation par un admin (lecture seule).
// 2026-08-22    Louvel        Étape 2 : octroi d'une autorisation à commander
//                             (colis urgent ou CAP), suivi du montant restant
//                             et annulation par le centre social.
//
// =============================================================================
//
// Accès :
//   - compte MDS  (User.accountType === 'mds') : CRUD complet sur SES fiches
//   - admin       (table Admins)               : lecture seule, toutes fiches
//   - tout autre                               : redirection
//
// L'étanchéité entre MDS n'est PAS assurée par ce composant mais par la RLS
// (policy mdsId = auth.uid()). Un simple select('*') ne remonte donc que les
// fiches du MDS connecté — inutile de filtrer manuellement ici.
//
// =============================================================================

import { useEffect, useState } from 'react';
import { supabase } from '@lib/supabaseClient.js';
import { useAuthor } from '@context/AuthorContext';
import { useCart } from '@context/CartContext.jsx';
import { useNavigate } from 'react-router-dom';
import { displayNotification } from '@lib/displayNotification.jsx';

import Loading from '@common/Loading.jsx';

const EMPTY_FORM = {
	firstName: '',
	lastName: '',
	phone: '',
	email: '',
	address: '',
	addAddress: '',
	city: '',
	postalCode: '',
	notes: '',
};

// Champs texte optionnels : une chaîne vide doit partir en NULL en base,
// sinon on stocke des '' impossibles à distinguer d'une absence de valeur.
const OPTIONAL_FIELDS = ['email', 'address', 'addAddress', 'city', 'postalCode', 'notes'];

// Dispositifs au titre desquels une autorisation peut être accordée. Ils ne
// diffèrent que par leurs paramètres : durée, nombre de commandes possibles et
// poids minimal exigé par colis.
const AUTH_TYPES = {
	colis_urgent: {
		label: 'Colis urgent',
		hint: 'Une seule commande, à passer sous 48 heures.',
		durationEditable: false,
	},
	cap: {
		label: "Chèque d'accompagnement (CAP)",
		hint: "Plusieurs commandes possibles jusqu'à épuisement du montant, avant la date d'échéance.",
		durationEditable: true,
	},
};

const AUTH_STATUS_LABELS = {
	active: 'en cours',
	exhausted: 'montant épuisé',
	expired: 'échue',
	cancelled: 'annulée',
};

function formatEuros(value) {
	return Number(value ?? 0).toFixed(2).replace('.', ',');
}

function toPayload(form) {
	const payload = {
		firstName: form.firstName.trim(),
		lastName: form.lastName.trim(),
		phone: form.phone.trim(),
	};
	OPTIONAL_FIELDS.forEach(field => {
		const value = (form[field] || '').trim();
		payload[field] = value === '' ? null : value;
	});
	return payload;
}

const UrgentBeneficiaryTable = () => {
	const [beneficiaries, setBeneficiaries] = useState([]);
	const [mdsNames, setMdsNames] = useState({});
	const [currentUserId, setCurrentUserId] = useState(null);
	const [isMds, setIsMds] = useState(false);
	const [search, setSearch] = useState('');
	const [expanded, setExpanded] = useState(null);
	const [editMode, setEditMode] = useState(null);
	const [editedForm, setEditedForm] = useState(EMPTY_FORM);
	const [modalOpen, setModalOpen] = useState(false);
	const [newForm, setNewForm] = useState(EMPTY_FORM);
	const [isSaving, setIsSaving] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [update, setUpdate] = useState(true);

	// Autorisations en cours, indexées par identifiant de fiche.
	const [authorizations, setAuthorizations] = useState({});
	const [authModalFor, setAuthModalFor] = useState(null);
	const [authForm, setAuthForm] = useState({ type: 'colis_urgent', spendingLimit: '', expiresAt: '' });
	const [capDefaultHours, setCapDefaultHours] = useState(720);
	const [urgentAuthHours, setUrgentAuthHours] = useState(48);

	const { isAdmin, loading } = useAuthor();
	const { cart, startUrgentOrder } = useCart();
	const navigate = useNavigate();

	// Un admin consulte mais ne modifie pas : la policy RLS ne lui accorde que
	// le SELECT, on masque donc les actions d'écriture côté UI par cohérence.
	const canEdit = isMds;

	const fetchBeneficiaries = async () => {
		const { data: authData } = await supabase.auth.getUser();
		const userId = authData?.user?.id ?? null;
		setCurrentUserId(userId);

		let mds = false;
		if (userId) {
			const { data: me } = await supabase
				.from('User')
				.select('accountType')
				.eq('id', userId)
				.single();
			mds = me?.accountType === 'mds';
			setIsMds(mds);
		}

		if (!mds && !isAdmin) {
			navigate('/');
			return;
		}

		// La RLS filtre : un MDS ne reçoit que ses fiches, un admin les reçoit
		// toutes (policy de supervision en lecture seule).
		const { data, error } = await supabase
			.from('UrgentBeneficiary')
			.select('*')
			.order('lastName', { ascending: true });

		if (error) {
			displayNotification('Erreur de chargement des bénéficiaires', error.message, 'danger');
		} else {
			setBeneficiaries(data || []);
		}

		// Autorisations non closes. La RLS restreint là aussi à ce que
		// l'utilisateur a le droit de voir.
		const { data: authData2 } = await supabase
			.from('UrgentAuthorization')
			.select('*')
			.in('status', ['active', 'exhausted'])
			.order('created_at', { ascending: false });

		if (authData2) {
			// Une seule autorisation ouverte par fiche : le premier trouvé fait foi.
			const byBeneficiary = {};
			authData2.forEach(a => {
				if (!byBeneficiary[a.urgentBeneficiaryId]) {
					byBeneficiary[a.urgentBeneficiaryId] = a;
				}
			});
			setAuthorizations(byBeneficiary);
		}

		// Durées par défaut, paramétrables côté administration.
		const { data: constants } = await supabase
			.from('constants')
			.select('name, value')
			.in('name', ['capDefaultHours', 'urgentAuthHours']);

		if (constants) {
			const cap = constants.find(c => c.name === 'capDefaultHours');
			const urgent = constants.find(c => c.name === 'urgentAuthHours');
			if (cap) setCapDefaultHours(Number(cap.value));
			if (urgent) setUrgentAuthHours(Number(urgent.value));
		}

		// Un admin voit les fiches de plusieurs centres sociaux : il faut donc
		// pouvoir afficher à quel MDS appartient chaque fiche.
		if (isAdmin) {
			const { data: mdsUsers } = await supabase
				.from('User')
				.select('id, firstName, lastName')
				.eq('accountType', 'mds');
			if (mdsUsers) {
				setMdsNames(Object.fromEntries(
					mdsUsers.map(u => [u.id, `${u.firstName} ${u.lastName}`])
				));
			}
		}

		setIsLoading(false);
	};

	useEffect(() => {
		if (loading) return;
		fetchBeneficiaries();
	}, [update, loading]);

	const filtered = beneficiaries.filter(b =>
		`${b.firstName} ${b.lastName} ${b.email || ''} ${b.phone || ''} ${b.city || ''}`
			.toLowerCase()
			.includes(search.toLowerCase())
	);

	const toggleExpand = (id) => {
		setExpanded(prev => (prev === id ? null : id));
		setEditMode(null);
	};

	const handleEdit = (b) => {
		setEditMode(b.id);
		setExpanded(b.id);
		setEditedForm({
			firstName: b.firstName || '',
			lastName: b.lastName || '',
			phone: b.phone || '',
			email: b.email || '',
			address: b.address || '',
			addAddress: b.addAddress || '',
			city: b.city || '',
			postalCode: b.postalCode || '',
			notes: b.notes || '',
		});
	};

	const handleEditChange = (e) => {
		const { name, value } = e.target;
		setEditedForm(prev => ({ ...prev, [name]: value }));
	};

	const handleNewChange = (e) => {
		const { name, value } = e.target;
		setNewForm(prev => ({ ...prev, [name]: value }));
	};

	// phone est NOT NULL en base : on valide ici pour afficher un message clair
	// plutôt que de laisser remonter une erreur Postgres.
	const validate = (form) => {
		if (!form.firstName.trim() || !form.lastName.trim()) {
			displayNotification('Champs obligatoires', 'Le nom et le prénom sont requis.', 'warning');
			return false;
		}
		if (!form.phone.trim()) {
			displayNotification(
				'Téléphone requis',
				'Le numéro de téléphone est obligatoire : il est utilisé par DPD pour la livraison.',
				'warning'
			);
			return false;
		}
		return true;
	};

	const handleCreate = async () => {
		if (!validate(newForm)) return;
		setIsSaving(true);

		// mdsId doit être renseigné explicitement : la policy WITH CHECK vérifie
		// la valeur mais ne la remplit pas à notre place.
		const { error } = await supabase
			.from('UrgentBeneficiary')
			.insert({ mdsId: currentUserId, ...toPayload(newForm) });

		setIsSaving(false);

		if (error) {
			displayNotification('Erreur lors de la création de la fiche', error.message, 'danger');
			return;
		}
		displayNotification('Fiche bénéficiaire créée', 'success');
		setNewForm(EMPTY_FORM);
		setModalOpen(false);
		setUpdate(!update);
	};

	const handleValidate = async (id) => {
		if (!validate(editedForm)) return;
		setIsSaving(true);

		const { error } = await supabase
			.from('UrgentBeneficiary')
			.update(toPayload(editedForm))
			.eq('id', id);

		setIsSaving(false);

		if (error) {
			displayNotification('Erreur lors de la modification', error.message, 'danger');
			return;
		}
		displayNotification('Fiche mise à jour', 'success');
		setEditMode(null);
		setUpdate(!update);
	};

	// Le panier est unique pour le compte connecté : s'il contient déjà des
	// articles, on demande explicitement quoi en faire plutôt que de les
	// écraser ou de les mélanger silencieusement à la commande urgente.
	const handleStartOrder = (b) => {
		const cartCount = Object.keys(cart?.content || {}).length;

		if (cartCount > 0) {
			const clearCart = window.confirm(
				`Votre panier contient déjà ${cartCount} produit${cartCount > 1 ? 's' : ''}.\n\n` +
				`OK   : vider le panier et repartir de zéro pour ${b.firstName} ${b.lastName}\n` +
				`Annuler : conserver les produits déjà sélectionnés`
			);
			startUrgentOrder(b, { clearCart });
		} else {
			startUrgentOrder(b);
		}

		displayNotification(
			'Commande urgente démarrée',
			`Les produits que vous ajoutez seront commandés pour ${b.firstName} ${b.lastName}.`,
			'success'
		);
		navigate('/catalog');
	};

	// --- Autorisations -------------------------------------------------------

	// L'échéance est proposée d'après le dispositif : imposée pour un colis
	// urgent, ajustable pour un chèque, dont la validité varie.
	const computeExpiry = (type) => {
		const hours = type === 'cap' ? capDefaultHours : urgentAuthHours;
		const date = new Date(Date.now() + hours * 3600 * 1000);
		// Format attendu par un champ datetime-local, en heure locale.
		const pad = (n) => String(n).padStart(2, '0');
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
			`T${pad(date.getHours())}:${pad(date.getMinutes())}`;
	};

	const openAuthModal = (b) => {
		setAuthModalFor(b);
		setAuthForm({
			type: 'colis_urgent',
			spendingLimit: '',
			expiresAt: computeExpiry('colis_urgent'),
		});
	};

	const handleAuthTypeChange = (e) => {
		const type = e.target.value;
		setAuthForm(prev => ({ ...prev, type, expiresAt: computeExpiry(type) }));
	};

	const handleAuthChange = (e) => {
		const { name, value } = e.target;
		setAuthForm(prev => ({ ...prev, [name]: value }));
	};

	const handleAuthorize = async () => {
		const b = authModalFor;
		if (!b) return;

		const limit = parseFloat(String(authForm.spendingLimit).replace(',', '.'));
		if (!Number.isFinite(limit) || limit <= 0) {
			displayNotification('Montant requis', 'Indiquez le montant accordé, supérieur à zéro.', 'warning');
			return;
		}
		if (!authForm.expiresAt) {
			displayNotification('Échéance requise', "Indiquez la date jusqu'à laquelle l'accès reste ouvert.", 'warning');
			return;
		}

		setIsSaving(true);
		const { data, error } = await supabase.functions.invoke('authorize-urgent-beneficiary', {
			body: {
				urgentBeneficiaryId: b.id,
				type: authForm.type,
				spendingLimit: limit,
				expiresAt: new Date(authForm.expiresAt).toISOString(),
			},
		});
		setIsSaving(false);

		if (error || !data?.success) {
			displayNotification(
				"Impossible d'accorder l'autorisation",
				data?.error || error?.message || 'Une erreur est survenue',
				'danger'
			);
			return;
		}

		// L'autorisation vaut même si le courriel n'est pas parti : la personne
		// pourra demander un lien depuis la page d'accès.
		if (data.mailSent === false) {
			displayNotification('Autorisation accordée', data.warning || "Le courriel n'a pas pu être envoyé.", 'warning');
		} else {
			displayNotification(
				'Autorisation accordée',
				`${b.firstName} ${b.lastName} a reçu un courriel pour composer son colis.`,
				'success'
			);
		}

		setAuthModalFor(null);
		setUpdate(!update);
	};

	const handleCancelAuthorization = async (b, authorization) => {
		if (!confirm(
			`Annuler l'autorisation de ${b.firstName} ${b.lastName} ?\n\n` +
			`Son accès sera fermé immédiatement. Vous pourrez ensuite commander ` +
			`à sa place, ou lui accorder une nouvelle autorisation.`
		)) return;

		const { error } = await supabase
			.from('UrgentAuthorization')
			.update({ status: 'cancelled' })
			.eq('id', authorization.id);

		if (error) {
			displayNotification("Erreur lors de l'annulation", error.message, 'danger');
			return;
		}
		displayNotification('Autorisation annulée', '', 'success');
		setUpdate(!update);
	};

	const handleDelete = async (b) => {
		if (!confirm(
			`Supprimer la fiche de ${b.firstName} ${b.lastName} ?\n\n` +
			`Les commandes déjà passées pour cette personne seront conservées, ` +
			`mais ne seront plus reliées à une fiche.`
		)) return;

		const { error } = await supabase
			.from('UrgentBeneficiary')
			.delete()
			.eq('id', b.id);

		if (error) {
			displayNotification('Erreur lors de la suppression', error.message, 'danger');
			return;
		}
		displayNotification('Fiche supprimée', 'success');
		setUpdate(!update);
	};

	function formatDate(datestr) {
		if (!datestr) return '—';
		const date = new Date(datestr.includes('T') ? datestr : datestr + 'T00:00:00');
		return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(date);
	}

	if (isLoading || loading) {
		return <Loading />;
	}

	const formFields = [
		['firstName', 'Prénom', true],
		['lastName', 'Nom', true],
		['phone', 'Téléphone', true],
		['email', 'Adresse mail', false],
		['address', 'Rue', false],
		['addAddress', "Complément d'adresse", false],
		['city', 'Commune', false],
		['postalCode', 'Code postal', false],
	];

	return (
		<div className="p-6 bg-gray-50 min-h-screen">
			<div className="max-w-7xl mx-auto">
				<h1 className="text-3xl font-bold mb-2 text-rayonblue">Bénéficiaires « colis urgent »</h1>
				<p className="text-sm text-gray-500 mb-6">
					{canEdit
						? "Fiches des personnes pour lesquelles votre centre social peut passer une commande urgente."
						: "Consultation de l'ensemble des fiches, tous centres sociaux confondus (lecture seule)."}
				</p>

				{canEdit && (
					<button
						className="text-white bg-rayonorange mb-3 w-full md:w-auto md:ml-auto md:block rounded-lg p-2 px-6"
						onClick={() => setModalOpen(true)}
					>Ajouter un bénéficiaire</button>
				)}

				<input
					type="text"
					placeholder="🔍 Rechercher par nom, email, téléphone, commune..."
					className="mb-6 p-3 border-2 border-rayonblue rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-rayonorange transition"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>

				<div className="space-y-4 mb-6">
					{filtered.map(b => (
						<div key={b.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
							<div className="p-4 bg-gradient-to-r from-blue-50 to-white border-b border-rayonblue">
								<div className="flex items-center justify-between">
									<div className="flex-1 grid grid-cols-12 gap-3 items-center">
										<div className="col-span-3 min-w-0">
											<p className="text-xs text-gray-500 mb-1">Prénom</p>
											<p className="text-lg font-semibold text-gray-800 truncate">{b.firstName}</p>
										</div>
										<div className="col-span-3 min-w-0">
											<p className="text-xs text-gray-500 mb-1">Nom</p>
											<p className="text-lg font-semibold text-gray-800 truncate">{b.lastName}</p>
										</div>
										<div className="col-span-3 min-w-0">
											<p className="text-xs text-gray-500 mb-1">Téléphone</p>
											<p className="text-gray-800 truncate">{b.phone}</p>
										</div>
										<div className="col-span-3 min-w-0">
											<p className="text-xs text-gray-500 mb-1">Commune</p>
											<p className="text-gray-800 truncate">{b.city || '—'}</p>
											{authorizations[b.id] && (
												<span className="inline-block mt-1 bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
													✉️ {formatEuros(authorizations[b.id].spendingLimit - authorizations[b.id].spentAmount)} € restants
												</span>
											)}
										</div>
									</div>

									<div className="flex items-center gap-2 ml-4">
										<button
											onClick={() => toggleExpand(b.id)}
											className="px-3 py-2 text-rayonblue hover:bg-blue-50 rounded-lg transition text-sm font-medium whitespace-nowrap"
										>{expanded === b.id ? '▲ Masquer' : '▼ Détails'}</button>

										{canEdit && editMode !== b.id && (
											<>
												<button
													onClick={() => handleStartOrder(b)}
													className="px-3 py-2 bg-rayonorange hover:opacity-90 text-white rounded-lg transition text-sm font-semibold whitespace-nowrap"
													title={`Composer un colis urgent pour ${b.firstName} ${b.lastName}`}
												>🛒 Commander</button>

												{/* Sans adresse électronique, aucun lien d'accès ne peut être
												    transmis : seul le centre social peut alors commander. */}
												{!authorizations[b.id] && (
													<button
														onClick={() => openAuthModal(b)}
														disabled={!b.email}
														className="px-3 py-2 bg-emerald-600 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition text-sm font-semibold whitespace-nowrap"
														title={b.email
															? `Autoriser ${b.firstName} ${b.lastName} à composer son colis`
															: "Adresse électronique manquante : impossible d'envoyer un lien d'accès"}
													>✉️ Autoriser</button>
												)}
											</>
										)}

										{canEdit && (
											editMode === b.id ? (
												<div className="flex gap-2">
													<button
														onClick={() => handleValidate(b.id)}
														disabled={isSaving}
														className="w-10 h-10 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg transition flex items-center justify-center text-xl"
														title="Valider"
													>✓</button>
													<button
														onClick={() => setEditMode(null)}
														className="w-10 h-10 bg-red-400 hover:bg-red-600 text-white rounded-lg transition flex items-center justify-center text-xl"
														title="Annuler"
													>✕</button>
												</div>
											) : (
												<div className="flex gap-2">
													<button
														onClick={() => handleEdit(b)}
														className="w-10 h-10 bg-rayonblue hover:opacity-90 text-white rounded-lg transition flex items-center justify-center text-lg"
														title="Modifier"
													>✎</button>
													<button
														onClick={() => handleDelete(b)}
														className="w-10 h-10 bg-red-400 hover:bg-red-600 text-white rounded-lg transition flex items-center justify-center text-xl"
														title="Supprimer"
													>✕</button>
												</div>
											)
										)}
									</div>
								</div>
							</div>

							{expanded === b.id && (
								<div className="p-4 bg-gray-50 border-t">
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
										{formFields.map(([field, label, required]) => (
											<div key={field} className="bg-white p-3 rounded-lg border border-gray-200">
												<label className="text-xs font-medium text-rayonblue block mb-1">
													{label}{required && <span className="text-red-500"> *</span>}
												</label>
												{editMode === b.id ? (
													<input
														name={field}
														value={editedForm[field]}
														onChange={handleEditChange}
														className="w-full border-2 border-rayonblue rounded px-2 py-1"
													/>
												) : (
													<p className="text-gray-800">{b[field] || '—'}</p>
												)}
											</div>
										))}

										<div className="bg-white p-3 rounded-lg border border-gray-200 md:col-span-2">
											<label className="text-xs font-medium text-rayonblue block mb-1">Notes</label>
											{editMode === b.id ? (
												<textarea
													name="notes"
													value={editedForm.notes}
													onChange={handleEditChange}
													rows={2}
													className="w-full border-2 border-rayonblue rounded px-2 py-1"
												/>
											) : (
												<p className="text-gray-800 whitespace-pre-wrap">{b.notes || '—'}</p>
											)}
										</div>

										<div className="bg-white p-3 rounded-lg border border-gray-200">
											<label className="text-xs font-medium text-rayonblue block mb-1">Fiche créée le</label>
											<p className="text-gray-800">{formatDate(b.created_at)}</p>
											{b.updated_at !== b.created_at && (
												<p className="text-[11px] text-gray-400">
													modifiée le {formatDate(b.updated_at)}
												</p>
											)}
										</div>

										{isAdmin && !canEdit && (
											<div className="bg-white p-3 rounded-lg border border-gray-200">
												<label className="text-xs font-medium text-rayonblue block mb-1">Centre social (MDS)</label>
												<p className="text-gray-800">{mdsNames[b.mdsId] || '—'}</p>
											</div>
										)}
									</div>

									{authorizations[b.id] && (
										<div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
											<div className="flex flex-wrap items-start justify-between gap-3">
												<div>
													<p className="text-sm font-bold text-emerald-800 mb-1">
														✉️ {AUTH_TYPES[authorizations[b.id].type]?.label || authorizations[b.id].type}
														{' — '}
														{AUTH_STATUS_LABELS[authorizations[b.id].status] || authorizations[b.id].status}
													</p>
													<p className="text-sm text-gray-700">
														<strong>{formatEuros(authorizations[b.id].spendingLimit - authorizations[b.id].spentAmount)} €</strong>
														{' restants sur '}
														{formatEuros(authorizations[b.id].spendingLimit)} €
														{authorizations[b.id].spentAmount > 0 && (
															<span className="text-gray-500">
																{' '}({formatEuros(authorizations[b.id].spentAmount)} € déjà dépensés)
															</span>
														)}
													</p>
													<p className="text-xs text-gray-500 mt-1">
														Accès ouvert jusqu'au {formatDate(authorizations[b.id].expiresAt)}
														{authorizations[b.id].openedAt
															? ` — lien ouvert le ${formatDate(authorizations[b.id].openedAt)}`
															: " — lien pas encore ouvert"}
													</p>
												</div>

												{canEdit && (
													<button
														onClick={() => handleCancelAuthorization(b, authorizations[b.id])}
														className="px-3 py-2 bg-white border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-semibold whitespace-nowrap"
														title="Fermer l'accès et reprendre la main"
													>Annuler l'autorisation</button>
												)}
											</div>
										</div>
									)}

									{isAdmin && !canEdit && (
										<p className="text-xs text-gray-400 italic mt-3">
											Consultation seule : la modification des fiches relève du centre social propriétaire.
										</p>
									)}
								</div>
							)}
						</div>
					))}

					{filtered.length === 0 && (
						<div className="text-center py-12 text-gray-500 bg-white rounded-lg">
							<p className="text-lg">Aucun bénéficiaire trouvé</p>
							{canEdit && beneficiaries.length === 0 && (
								<p className="text-sm mt-2">
									Créez une première fiche pour pouvoir passer une commande urgente.
								</p>
							)}
						</div>
					)}
				</div>
			</div>

			{authModalFor && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
					onClick={() => setAuthModalFor(null)}
				>
					<div
						className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-start justify-between py-3 px-6 border-b border-gray-200">
							<div>
								<h2 className="text-2xl font-bold text-gray-900">Autoriser à commander</h2>
								<p className="text-sm text-gray-500">
									{authModalFor.firstName} {authModalFor.lastName} — {authModalFor.email}
								</p>
							</div>
							<button
								onClick={() => setAuthModalFor(null)}
								className="w-10 h-10 bg-red-400 hover:bg-red-600 text-white rounded-lg transition flex items-center justify-center text-xl"
								title="Annuler"
							>✕</button>
						</div>

						<div className="flex-1 overflow-y-auto p-6">
							<label className="text-sm text-rayonblue block mb-2 font-semibold">Motif de l'aide</label>
							<div className="space-y-2 mb-5">
								{Object.entries(AUTH_TYPES).map(([value, cfg]) => (
									<label key={value} className="flex items-start gap-2 cursor-pointer">
										<input
											type="radio"
											name="type"
											value={value}
											checked={authForm.type === value}
											onChange={handleAuthTypeChange}
											className="mt-1"
										/>
										<span>
											<span className="text-rayonblue font-medium">{cfg.label}</span>
											<span className="block text-xs text-gray-500">{cfg.hint}</span>
										</span>
									</label>
								))}
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="text-sm text-rayonblue block mb-1">
										Montant accordé (€) <span className="text-red-500">*</span>
									</label>
									<input
										name="spendingLimit"
										type="number"
										min="0"
										step="0.01"
										value={authForm.spendingLimit}
										onChange={handleAuthChange}
										className="w-full h-[2.3rem] rounded-lg border border-rayonblue px-2"
									/>
								</div>
								<div>
									<label className="text-sm text-rayonblue block mb-1">
										Accès ouvert jusqu'au <span className="text-red-500">*</span>
									</label>
									<input
										name="expiresAt"
										type="datetime-local"
										value={authForm.expiresAt}
										onChange={handleAuthChange}
										disabled={!AUTH_TYPES[authForm.type]?.durationEditable}
										className="w-full h-[2.3rem] rounded-lg border border-rayonblue px-2 disabled:bg-gray-100 disabled:text-gray-500"
									/>
									{!AUTH_TYPES[authForm.type]?.durationEditable && (
										<p className="text-[11px] text-gray-500 mt-1">
											Durée imposée pour un colis urgent ({urgentAuthHours} h).
										</p>
									)}
								</div>
							</div>

							<div className="mt-5 bg-amber-50 border border-amber-200 rounded-lg p-3">
								<p className="text-xs text-gray-700 leading-relaxed">
									💡 Le montant accordé couvre les produits <strong>et</strong> la participation
									aux frais de livraison. Si la personne passe plusieurs commandes, ces frais
									sont décomptés à chaque envoi.
								</p>
							</div>

							<p className="text-xs text-gray-500 mt-3">
								Un courriel sera envoyé à {authModalFor.email} avec un lien d'accès.
								Vous pourrez suivre l'état de la démarche depuis sa fiche, et reprendre
								la main à tout moment.
							</p>

							<button
								onClick={handleAuthorize}
								disabled={isSaving}
								className="text-white bg-emerald-600 w-[80%] ml-[10%] lg:w-[50%] lg:ml-[25%] mb-3 mt-8 h-[2.3rem] rounded-lg disabled:opacity-50"
							>{isSaving ? 'Envoi en cours…' : "Autoriser et envoyer le lien"}</button>
						</div>
					</div>
				</div>
			)}

			{modalOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
					onClick={() => setModalOpen(false)}
				>
					<div
						className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-start justify-between py-3 px-6 border-b border-gray-200">
							<h2 className="text-2xl font-bold text-gray-900">Ajouter un bénéficiaire</h2>
							<button
								onClick={() => setModalOpen(false)}
								className="w-10 h-10 bg-red-400 hover:bg-red-600 text-white rounded-lg transition flex items-center justify-center text-xl"
								title="Annuler"
							>✕</button>
						</div>

						<div className="flex-1 overflow-y-auto p-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{formFields.map(([field, label, required]) => (
									<div key={field}>
										<label className="text-sm text-rayonblue block mb-1">
											{label}{required && <span className="text-red-500"> *</span>}
										</label>
										<input
											name={field}
											value={newForm[field]}
											onChange={handleNewChange}
											className="w-full h-[2.3rem] rounded-lg border border-rayonblue px-2"
										/>
									</div>
								))}
							</div>

							<div className="mt-4">
								<label className="text-sm text-rayonblue block mb-1">Notes</label>
								<textarea
									name="notes"
									value={newForm.notes}
									onChange={handleNewChange}
									rows={3}
									className="w-full rounded-lg border border-rayonblue px-2 py-1"
								/>
							</div>

							<p className="text-xs text-gray-500 mt-3">
								💡 Le téléphone est obligatoire : DPD l'utilise pour la notification de
								livraison. L'adresse mail reste facultative.
							</p>

							<button
								onClick={handleCreate}
								disabled={isSaving}
								className="text-white bg-rayonorange w-[80%] ml-[10%] lg:w-[50%] lg:ml-[25%] mb-3 mt-8 h-[2.3rem] rounded-lg disabled:opacity-50"
							>{isSaving ? 'Enregistrement…' : 'Ajouter'}</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default UrgentBeneficiaryTable;
