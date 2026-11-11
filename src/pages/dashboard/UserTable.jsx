// =============================================================================
// HISTORIQUE DES MODIFICATIONS
// =============================================================================
//
// Date          Auteur        Description
// ----------    ----------    -------------------------------------------------
// 2026-06-14    Louvel       Ajout d'un filtre pourafficher les users selon le status
// 2026-06-14    Louvel       Ajout de la caractéristique "admin" dans la présentation des users
// 2026-08-03    Louvel       Suppression de notifyUsers - (le useEffect ne fait plus que fetchUsers())
//                            Fix handleChange sur end_right : réactivation automatique de has_right/status
//                            quand la date est repoussée dans le futur, avec la notification explicative.
// 2026-11-10    Louvel       Demande du président : masquage des déclarations (situation, quotient,
//                            type de revenu, autres revenus) via SHOW_DECLARATIONS ; ajout du bloc
//                            « Information Bénéficiaire » (origine de la validation : organisation +
//                            personne, message utilisateur, message administrateur → user_admin_note).
//
// =============================================================================

// Importing dependencies
import { useEffect, useState } from 'react';
import { supabase } from '@lib/supabaseClient.js';
import { deleteUser } from '@lib/deleteUser';
import { patchUser } from '@lib/patchUser';
import { useAuthor } from '@context/AuthorContext';
import { useNavigate } from 'react-router-dom';
import { displayNotification } from '@lib/displayNotification.jsx';

// Importing common components
import Loading from '@common/Loading.jsx';
import PostalCodeCityInput from '@common/PostalCodeCityInput.jsx';
import AddUserModal from '@common/AddUserModal';

// Bloc « Déclarations » masqué à la demande du président (nov. 2026).
// Les colonnes restent en base ; repasser à true pour réafficher.
const SHOW_DECLARATIONS = false;
const DECLARATION_FIELDS = ['situation', 'quotient', 'wageType', 'otherWage'];

const UserTable = () => {
	const [users, setUsers] = useState([]);
	const [search, setSearch] = useState('');
	const [expanded, setExpanded] = useState(null);
	const [editMode, setEditMode] = useState(null);
	const [editedUser, setEditedUser] = useState({});
	const [editAddrValid, setEditAddrValid] = useState(false);
	const [update, setUpdate] = useState(true)
	const [isLoading, setIsLoading] = useState(true);
	const [modalOpen, setModalOpen] = useState(false)
	const [statusFilter, setStatusFilter] = useState('');
	const [adminIds, setAdminIds] = useState([]);
	const [adminNotes, setAdminNotes] = useState({}); // { [user_id]: admin_message }


	const { isAdmin, loading } = useAuthor()
	const navigate = useNavigate()

	const selectStatus = ["Enregistré", "Validé", "Actif", "Suspendu", "Résilié", "En attente", "Inactif"]

	const fetchUsers = async () => {
		const { data, error } = await supabase.from('User').select('*');
		if (error) {
			displayNotification("Erreur de chargement des utilisateurs", error.message, "danger")
		} else {
			setUsers(data);
		}

		// Récupérer les ids admins
		const { data: admins } = await supabase.from('Admins').select('id');
		if (admins) setAdminIds(admins.map(a => a.id));

		// Messages administrateur (table séparée, lisible par les admins uniquement)
		const { data: notes } = await supabase.from('user_admin_note').select('user_id, admin_message');
		if (notes) setAdminNotes(Object.fromEntries(notes.map(n => [n.user_id, n.admin_message])));

		setIsLoading(false);
		};

	useEffect(() => {
		if (loading) return;
		if (!isAdmin) {
			navigate('/admin')
			return;
		}
		fetchUsers();
	}, [update, loading]);

	const filteredUsers = users.filter(user =>
	`${user.firstName} ${user.lastName} ${user.email} ${user.phone}`
		.toLowerCase()
		.includes(search.toLowerCase())
	&& (statusFilter === '' || user.status === statusFilter)
	);

	const toggleExpand = (id) => {
		setExpanded(prev => (prev === id ? null : id));
		setEditMode(null);
	};

	const handleEdit = (user) => {
		setEditMode(user.id);
		setEditedUser({ ...user, admin_message: adminNotes[user.id] ?? '' });
		setEditAddrValid(false);
		setExpanded(user.id);
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		// Garde défensive : un compte MDS n'entre jamais dans le cycle de droits
		// (has_right toujours true, non affecté par status/end_right). Même si
		// ces champs ne sont normalement plus édités pour ce type de compte,
		// on bloque ici pour ne jamais casser has_right par erreur.
		if (editedUser.accountType === 'mds' && (name === "status" || name === "end_right")) {
			return;
		}
		if (name == "status") {
			setEditedUser(prev => ({ ...prev, ["has_right"]: value == "Actif" }));
		} else if (name == "end_right") {
			const endDate = new Date(value);
			const now = new Date();

			if (!isNaN(endDate)) {
				const isActive = endDate >= now;
				setEditedUser(prev => ({
					...prev,
					end_right: value,
					has_right: isActive,
					status: isActive ? "Actif" : "Résilié",
					reminder_sent_at: null,
				}));
				displayNotification(
					"Statut mis à jour automatiquement",
					`Suite au changement de date, le statut a été basculé sur "${isActive ? "Actif" : "Résilié"}". Vous pouvez le corriger manuellement avant de valider.`,
					"info"
				);
				return;
			}
		}
		setEditedUser(prev => ({ ...prev, [name]: value }));
	}

	const handleValidate = () => {
		// DPD refuse tout couple code postal / commune inconnu
		if (!editAddrValid) {
			displayNotification(
				'Adresse incomplète',
				'Saisissez un code postal valide et choisissez la commune : DPD refuse les adresses inconnues.',
				'warning'
			);
			return;
		}
		// admin_message n'est pas une colonne de "User" : on le retire du patch
		const { admin_message, ...userPatch } = editedUser;
		const clean = (s) => (typeof s === 'string' && s.trim() !== '' ? s.trim() : null);
		const noteChanged = (admin_message ?? '') !== (adminNotes[editMode] ?? '');

		patchUser(editMode, userPatch)
			.then(async () => {
				if (!noteChanged) return;
				const { error } = await supabase.from('user_admin_note').upsert({
					user_id: editMode,
					admin_message: clean(admin_message),
					updated_at: new Date().toISOString(),
				});
				if (error) displayNotification("Message administrateur non enregistré", error.message, "danger");
			})
			.then(() => setUpdate(!update))
			.then(() => setEditMode(null))
	};

	// Champ du bloc « Information Bénéficiaire » (affichage ou édition)
	const renderInfoField = (user, field, label, { multiline = false, maxLength, placeholder, hint, shownValue, className = '' } = {}) => {
		const isEditing = editMode === user.id;
		const value = shownValue !== undefined ? shownValue : user[field];
		const inputProps = {
			name: field,
			value: editedUser[field] || '',
			onChange: handleChange,
			maxLength,
			placeholder,
			className: "w-full border-2 border-rayonblue rounded px-2 py-1",
		};
		return (
			<div className={`bg-white p-3 rounded-lg border border-gray-200 ${className}`}>
				<label className="text-xs font-medium text-rayonblue block mb-1">
					{label} {hint && <span className="text-gray-400 font-normal">({hint})</span>}
				</label>
				{isEditing ? (
					multiline ? <textarea rows={2} {...inputProps} /> : <input {...inputProps} />
				) : (
					<p className="text-gray-800 whitespace-pre-line">{value || '—'}</p>
				)}
			</div>
		);
	};

	const handleDelete = (id) => {
		if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

		deleteUser(id)
			.then(() => setUpdate(!update))
			.catch((e) => {
				displayNotification("Erreur inattendue", e.message, "danger")
			})
	};

	function formatDate(datestr) {
		if (!datestr) return '—';
		const date = new Date(datestr.includes('T') ? datestr : datestr + 'T00:00:00');
		return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(date);
	}

	if (isLoading || loading) {
		return <Loading />;
	}

	return (
		<div className="p-6 bg-gray-50 min-h-screen">
			<div className="max-w-7xl mx-auto">
				<h1 className="text-3xl font-bold mb-6 text-rayonblue">Gestion des Utilisateurs</h1>
				<button
					className='text-white bg-rayonorange ml-[77%] mb-3 w-[23%] rounded-lg p-2'
					onClick={() => setModalOpen(true)}
				>Inscrire un utilisateur</button>
				<input
					type="text"
					placeholder="🔍 Rechercher par nom, email, téléphone..."
					className="mb-6 p-3 border-2 border-rayonblue rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-rayonorange transition"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
				<select
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value)}
					className="mb-6 p-3 border-2 border-rayonblue rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-rayonorange transition"
					>
					<option value="">Tous les statuts</option>
					{selectStatus.map(s => (
						<option key={s} value={s}>{s}</option>
					))}
				</select>

				<div className="space-y-4 mb-6">
					{filteredUsers.map(user => (
						<div key={user.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
							<div className="p-4 bg-gradient-to-r from-blue-50 to-white border-b border-rayonblue">
								<div className="flex items-center justify-between">
									<div className="flex-1 grid grid-cols-12 gap-3 items-center">
										<div className="col-span-2 min-w-0">
											<p className="text-xs text-gray-500 mb-1">Prénom</p>
											{editMode === user.id ? (
												<input
													name="firstName"
													value={editedUser.firstName || ''}
													onChange={handleChange}
													className="w-full border-2 border-rayonblue rounded px-2 py-1 text-lg font-semibold"
												/>
											) : (
												<p className="text-lg font-semibold text-gray-800 truncate">{user.firstName}</p>
											)}
										</div>

										<div className="col-span-2 min-w-0">
											<p className="text-xs text-gray-500 mb-1">Nom</p>
											{editMode === user.id ? (
												<input
												name="lastName"
												value={editedUser.lastName || ''}
												onChange={handleChange}
												className="w-full border-2 border-rayonblue rounded px-2 py-1 text-lg font-semibold"
												/>
											) : (
												<div className="flex items-center gap-2">
												<p className="text-lg font-semibold text-gray-800 truncate">{user.lastName}</p>
												{adminIds.includes(user.id) && (
													<span className="bg-rayonblue text-white text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
													👑 Admin
													</span>
												)}
												{user.accountType === 'mds' && (
													<span className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
													🏢 MDS
													</span>
												)}
												</div>
											)}
										</div>

										<div className="col-span-5 min-w-0">
											<p className="text-xs text-gray-500 mb-1">Email</p>
											{editMode === user.id ? (
												<input
													name="email"
													value={editedUser.email || ''}
													onChange={handleChange}
													className="w-full border-2 border-rayonblue rounded px-2 py-1 text-lg font-semibold"
												/>
											) : (
												<p className="text-lg font-semibold text-gray-800 truncate" title={user.email}>{user.email}</p>
											)}
										</div>

										<div className="col-span-3 min-w-0">
											<p className="text-xs text-gray-500 mb-1">Téléphone</p>
											{editMode === user.id ? (
												<input
													name="phone"
													value={editedUser.phone || ''}
													onChange={handleChange}
													className="w-full border-2 border-rayonblue rounded px-2 py-1 text-lg font-semibold"
												/>
											) : (
												<p className="text-lg font-semibold text-gray-800">{user.phone}</p>
											)}
										</div>
									</div>

									<div className="flex items-center gap-2 ml-4">
										<button
											onClick={() => toggleExpand(user.id)}
											className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm font-medium text-rayonblue"
											title="Voir détails"
										>
											{expanded === user.id ? "▲ Masquer" : "▼ Détails"}
										</button>

										{editMode === user.id ? (
											<div className="flex gap-2">
												<button
													onClick={handleValidate}
													className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-lg transition flex items-center justify-center text-xl"
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
													onClick={() => handleEdit(user)}
													className="w-10 h-10 bg-rayonblue hover:opacity-90 text-white rounded-lg transition flex items-center justify-center text-lg"
													title="Modifier"
												>✎</button>
												<button
													onClick={() => handleDelete(user.id)}
													className="w-10 h-10 bg-red-400 hover:bg-red-600 text-white rounded-lg transition flex items-center justify-center text-xl"
													title="Supprimer"
												>✕</button>
											</div>
										)}
									</div>
								</div>
							</div>

							{expanded === user.id && (
								<div className="p-4 bg-gray-50 border-t">
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
										{[
											['gender', 'Sexe'],
											['birthday', 'Date de naissance'],
											['address', 'Adresse'],
											['addAddress', "Complément d'adresse"],
											['postalCode', 'Code postal'],
											['city', 'Ville'],
											['situation', 'Situation'],
											['quotient', 'Quotient'],
											['wageType', 'Type de revenu'],
											['otherWage', 'Autres revenus'],
										]
										.filter(([field]) => SHOW_DECLARATIONS || !DECLARATION_FIELDS.includes(field))
										.map(([field, label]) => {
											// En édition, code postal + ville passent par le composant validé
											if (editMode === user.id && field === 'city') return null;
											if (editMode === user.id && field === 'postalCode') return (
												<PostalCodeCityInput
													key="postal-city"
													postalCode={editedUser.postalCode}
													city={editedUser.city}
													required
													onChange={({ postalCode, city, isValid }) => {
														setEditedUser(prev => ({ ...prev, postalCode, city }));
														setEditAddrValid(isValid);
													}}
													fieldClassName="bg-white p-3 rounded-lg border border-gray-200"
													labelClassName="text-xs font-medium text-rayonblue block mb-1"
													inputClassName="w-full border-2 border-rayonblue rounded px-2 py-1"
												/>
											);
											return (
											<div key={field} className="bg-white p-3 rounded-lg border border-gray-200">
												<label className="text-xs font-medium text-rayonblue block mb-1">{label}</label>
												{editMode === user.id ? (
													<input
														name={field}
														value={editedUser[field] || ''}
														onChange={handleChange}
														className="w-full border-2 border-rayonblue rounded px-2 py-1"
													/>
												) : (
													<p className="text-gray-800">{user[field] || '—'}</p>
												)}
											</div>
											);
										})}

										<div className="bg-white p-3 rounded-lg border border-gray-200">
											<label className="text-xs font-medium text-rayonblue block mb-1">Poids maximum autorisé par mois (en grammes)</label>
											{editMode === user.id && editedUser.accountType !== 'mds' ? (
												<input name="weight_limit" type="number" min="0" value={editedUser.weight_limit ?? ''} onChange={handleChange} className="w-full border-2 border-rayonblue rounded px-2 py-1" />
											) : user.accountType === 'mds' ? (
												<p className="text-gray-500 italic">Illimité (compte MDS)</p>
											) : (
												<>
													<p className="text-gray-800">{user.current_weight} / {user.weight_limit ?? '∞'} g</p>
													<p className="text-[11px] text-gray-400">
														consommé / limite{user.weight_limit === null ? " (pas de limite)" : ` — reste ${user.weight_limit - user.current_weight} g`}
													</p>
												</>
											)}
										</div>

										<div className="bg-white p-3 rounded-lg border border-gray-200">
											<label className="text-xs font-medium text-rayonblue block mb-1">Limite de prix</label>
											{editMode === user.id && editedUser.accountType !== 'mds' ? (
												<input name="price_limit" type="number" min="0" step="0.01" value={editedUser.price_limit ?? ''} onChange={handleChange} className="w-full border-2 border-rayonblue rounded px-2 py-1" />
											) : user.accountType === 'mds' ? (
												<p className="text-gray-500 italic">Illimité (compte MDS)</p>
											) : (
												<>
													<p className="text-gray-800">{user.current_price}€ / {user.price_limit ?? '∞'}€</p>
													<p className="text-[11px] text-gray-400">
														consommé / limite{user.price_limit === null ? " (pas de limite)" : ` — reste ${(user.price_limit - user.current_price).toFixed(2)}€`}
													</p>
												</>
											)}
										</div>

										<div className="bg-white p-3 rounded-lg border border-gray-200">
											<label className="text-xs font-medium text-rayonblue block mb-1">Limite de commandes</label>
											{editMode === user.id && editedUser.accountType !== 'mds' ? (
												<input name="order_limit" type="number" min="0" value={editedUser.order_limit ?? ''} onChange={handleChange} className="w-full border-2 border-rayonblue rounded px-2 py-1" />
											) : user.accountType === 'mds' ? (
												<p className="text-gray-500 italic">Illimité (compte MDS)</p>
											) : (
												<>
													<p className="text-gray-800">{user.current_order} / {user.order_limit ?? '∞'}</p>
													<p className="text-[11px] text-gray-400">
														consommé / limite{user.order_limit === null ? " (pas de limite)" : ` — reste ${user.order_limit - user.current_order}`}
													</p>
												</>
											)}
										</div>

										<div className="bg-white p-3 rounded-lg border border-gray-200">
											<label className="text-xs font-medium text-rayonblue block mb-1">Début des droits</label>
											{editMode === user.id && editedUser.accountType !== 'mds' ? (
												<input
													type="date"
													name="start_right"
													value={editedUser["start_right"]?.slice(0, 10) || ''}
													onChange={handleChange}
													className="w-full border-2 border-rayonblue rounded px-2 py-1"
												/>
											) : user.accountType === 'mds' ? (
												<p className="text-gray-500 italic">Sans objet (compte MDS)</p>
											) : (
												<p className="text-gray-800">{formatDate(user["start_right"])}</p>
											)}
										</div>

										<div className="bg-white p-3 rounded-lg border border-gray-200">
											<label className="text-xs font-medium text-rayonblue block mb-1">Fin des droits</label>
											{editMode === user.id && editedUser.accountType !== 'mds' ? (
												<input
													type="date"
													name="end_right"
													value={editedUser["end_right"]?.slice(0, 10) || ''}
													min={editedUser["start_right"]?.slice(0, 10) || ''}
													onChange={handleChange}
													className="w-full border-2 border-rayonblue rounded px-2 py-1"
												/>
											) : user.accountType === 'mds' ? (
												<p className="text-gray-500 italic">Sans objet (compte MDS, accès permanent)</p>
											) : (
												<p className="text-gray-800">{formatDate(user["end_right"])}</p>
											)}
										</div>

										<div className="bg-white p-3 rounded-lg border border-gray-200">
											<label className="text-xs font-medium text-rayonblue block mb-1">Statut du compte</label>
											{editMode === user.id && editedUser.accountType !== 'mds' ? (
												<select
													className="w-full px-3 py-2 border border-gray-200 rounded-md text-rayonblue bg-white focus:outline-none focus:ring-2 focus:ring-rayonblue"
													name="status"
													value={editedUser["status"]}
													onChange={handleChange}
												>
													<option value="">Sélectionner...</option>
													{selectStatus.map((option) => (
														<option key={option} value={option}>{option}</option>
													))}
												</select>
											) : user.accountType === 'mds' ? (
												<p className="text-gray-500 italic">Toujours actif (compte MDS)</p>
											) : (
												<p className="text-gray-800">{user["status"] || '—'}</p>
											)}
										</div>
										{adminIds.includes(user.id) && (
										<div className="mb-4">
											<span className="bg-rayonblue text-white text-xs font-bold px-3 py-1 rounded-full">
											👑 Administrateur
											</span>
										</div>
										)}
										{user.accountType === 'mds' && (
										<div className="mb-4">
											<span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
											🏢 Centre social (MDS) — accès illimité, sans expiration
											</span>
										</div>
										)}
									</div>

									{user.accountType !== 'mds' && (
										<div className="mt-6">
											<h3 className="text-lg font-bold text-rayonorange mb-2">Information Bénéficiaire</h3>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												{renderInfoField(user, 'validation_org', 'Origine de la validation — Organisation', {
													maxLength: 150, placeholder: 'Ex : CCAS de Lannion',
												})}
												{renderInfoField(user, 'validation_person', 'Origine de la validation — Nom de la personne', {
													maxLength: 150, placeholder: 'Ex : Ginette Durand, AS',
												})}
												{renderInfoField(user, 'user_message', 'Message utilisateur', {
													multiline: true, maxLength: 500, hint: 'visible par le bénéficiaire',
													placeholder: 'Ex : rendez-vous MDD reporté au 15 août pour prolonger la date de validité',
													className: 'md:col-span-2',
												})}
												{renderInfoField(user, 'admin_message', 'Message administrateur', {
													multiline: true, maxLength: 1000, hint: 'interne, jamais visible par le bénéficiaire',
													placeholder: 'Ex : ajouter un paquet de riz sur la prochaine commande',
													shownValue: adminNotes[user.id],
													className: 'md:col-span-2 !bg-amber-50 !border-amber-300',
												})}
											</div>
										</div>
									)}
								</div>
							)}
						</div>
					))}

					{filteredUsers.length === 0 && (
						<div className="text-center py-12 text-gray-500 bg-white rounded-lg">
							<p className="text-lg">Aucun utilisateur trouvé</p>
						</div>
					)}
				</div>
			</div>

			<AddUserModal
				isOpen={modalOpen}
				onClose={() => {
					setModalOpen(false);
					fetchUsers();
				}}
			/>
		</div>
	);
};

export default UserTable;
