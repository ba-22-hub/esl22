// =============================================================================
// HISTORIQUE DES MODIFICATIONS
// =============================================================================
//
// Date          Auteur        Description
// ----------    ----------    -------------------------------------------------
// 2026-08-06    Louvel        Création : gestion des fiches bénéficiaires
//                             "colis urgent" par un compte MDS (CRUD complet)
//                             et consultation par un admin (lecture seule).
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

	const { isAdmin, loading } = useAuthor();
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
										</div>
									</div>

									<div className="flex items-center gap-2 ml-4">
										<button
											onClick={() => toggleExpand(b.id)}
											className="px-3 py-2 text-rayonblue hover:bg-blue-50 rounded-lg transition text-sm font-medium whitespace-nowrap"
										>{expanded === b.id ? '▲ Masquer' : '▼ Détails'}</button>

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
