// =============================================================================
// HISTORIQUE DES MODIFICATIONS
// =============================================================================
//
// Date          Auteur        Description
// ----------    ----------    -------------------------------------------------
// 2026-06-14    Louvel       Ajout d'un filtre pourafficher les users selon le status
// 2026-06-14    Louvel		  Ajout de la caractéristique "admin" dans la présentation des users
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
import AddUserModal from '@common/AddUserModal';
import sendMail from '@lib/sendMail';


const UserTable = () => {
	const [users, setUsers] = useState([]);
	const [search, setSearch] = useState('');
	const [expanded, setExpanded] = useState(null);
	const [editMode, setEditMode] = useState(null);
	const [editedUser, setEditedUser] = useState({});
	const [update, setUpdate] = useState(true)
	const [isLoading, setIsLoading] = useState(true);
	const [modalOpen, setModalOpen] = useState(false)
	const [statusFilter, setStatusFilter] = useState('');
	const [adminIds, setAdminIds] = useState([]);


	const { isAdmin, loading } = useAuthor()
	const navigate = useNavigate()

	const selectStatus = ["Enregistré", "Validé", "Actif", "Suspendu", "Résilié", "En attente", "Inactif"]

	let isNotifying = false;

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

		setIsLoading(false);
		};

	useEffect(() => {
		if (loading) return;
		if (!isAdmin) {
			navigate('/admin')
			return;
		}
		const notifyUsers = async () => {
			if (isNotifying) return;
			isNotifying = true;

			const { data, error } = await supabase
				.from('User')
				.select('id, email, firstName')
				.eq('should_notify', true)
				.eq('notified', false);

			if (error) {
				displayNotification("Erreur lors de la récupération des utilisateurs à notifier", error.message, "danger")
				return;
			}

			for (const user of data) {
				try {
					await sendMail({
						email: user.email,
						templateId: 3,
						params: {
							FIRSTNAME: user.firstName
						}
					});

					const { error: updateError } = await supabase
						.from('User')
						.update({ should_notify: false, notified: true })
						.eq('id', user.id);

					if (updateError) {
						displayNotification("Erreur lors de la mise à jour de l'utilisateur " + user.id, updateError.message, "danger")
					} else {
						displayNotification("Notification envoyée à " + user.email, "", "success")
					}
				} catch (err) {
					displayNotification("Erreur inattendue lors de l'envoi de la notification à " + user.email, err.message, "danger")
				}
			}
		};
		notifyUsers();
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
		setEditedUser(user);
		setExpanded(user.id);
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		if (name == "status") {
			setEditedUser(prev => ({ ...prev, ["has_right"]: value == "Actif" }));
		} else if (name == "end_right") {
			const endDate = new Date(value);
			const now = new Date();

			if (!isNaN(endDate) && endDate < now) {
				updatedUser.status = "Résilié";
				updatedUser.has_right = false;
			}
		}
		setEditedUser(prev => ({ ...prev, [name]: value }));
	}

	const handleValidate = () => {
		patchUser(editMode, editedUser)
			.then(() => setUpdate(!update))
			.then(() => setEditMode(null))
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
											['city', 'Ville'],
											['postalCode', 'Code postal'],
											['situation', 'Situation'],
											['quotient', 'Quotient'],
											['wageType', 'Type de revenu'],
											['otherWage', 'Autres revenus'],
										].map(([field, label]) => (
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
										))}

										<div className="bg-white p-3 rounded-lg border border-gray-200">
											<label className="text-xs font-medium text-rayonblue block mb-1">Poids maximum autorisé par mois (en grammes)</label>
											{editMode === user.id ? (
												<input name="weight_limit" type="number" min="0" value={editedUser.weight_limit ?? ''} onChange={handleChange} className="w-full border-2 border-rayonblue rounded px-2 py-1" />
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
											{editMode === user.id ? (
												<input name="price_limit" type="number" min="0" step="0.01" value={editedUser.price_limit ?? ''} onChange={handleChange} className="w-full border-2 border-rayonblue rounded px-2 py-1" />
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
											{editMode === user.id ? (
												<input name="order_limit" type="number" min="0" value={editedUser.order_limit ?? ''} onChange={handleChange} className="w-full border-2 border-rayonblue rounded px-2 py-1" />
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
											{editMode === user.id ? (
												<input
													type="date"
													name="start_right"
													value={editedUser["start_right"]?.slice(0, 10) || ''}
													onChange={handleChange}
													className="w-full border-2 border-rayonblue rounded px-2 py-1"
												/>
											) : (
												<p className="text-gray-800">{formatDate(user["start_right"])}</p>
											)}
										</div>

										<div className="bg-white p-3 rounded-lg border border-gray-200">
											<label className="text-xs font-medium text-rayonblue block mb-1">Fin des droits</label>
											{editMode === user.id ? (
												<input
													type="date"
													name="end_right"
													value={editedUser["end_right"]?.slice(0, 10) || ''}
													min={editedUser["start_right"]?.slice(0, 10) || ''}
													onChange={handleChange}
													className="w-full border-2 border-rayonblue rounded px-2 py-1"
												/>
											) : (
												<p className="text-gray-800">{formatDate(user["end_right"])}</p>
											)}
										</div>

										<div className="bg-white p-3 rounded-lg border border-gray-200">
											<label className="text-xs font-medium text-rayonblue block mb-1">Statut du compte</label>
											{editMode === user.id ? (
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
									</div>
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
