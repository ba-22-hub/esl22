import { useEffect, useState } from 'react';

/**
 * Saisie « Code postal » + « Commune », validée par geo.api.gouv.fr.
 * - Le code postal doit faire 5 chiffres et exister.
 * - La commune est choisie dans la liste des communes de ce code postal :
 *   orthographe officielle, en majuscules, acceptée par DPD.
 * - Si l'API ne répond pas, repli sur une saisie libre (on ne bloque pas).
 *
 * Rend deux champs (fragment) pour s'insérer dans la grille du formulaire parent.
 *
 * Props :
 *   postalCode, city                 valeurs actuelles
 *   onChange({ postalCode, city, isValid })
 *   required                         affiche l'astérisque
 *   fieldClassName, labelClassName, inputClassName   classes Tailwind du parent
 *   messageClassName                 classes des messages sous les champs (marge…)
 */
export default function PostalCodeCityInput({
	postalCode: rawPostalCode = '',
	city: rawCity = '',
	onChange,
	required = false,
	fieldClassName = '',
	labelClassName = '',
	inputClassName = '',
	messageClassName = '',
}) {
	// La base peut renvoyer null ou un nombre : on travaille toujours en texte.
	const postalCode = rawPostalCode == null ? '' : String(rawPostalCode);
	const city = rawCity == null ? '' : String(rawCity);

	const [communes, setCommunes] = useState([]);
	const [status, setStatus] = useState('idle'); // idle | loading | ok | unknown | error

	useEffect(() => {
		if (!/^\d{5}$/.test(postalCode)) {
			setCommunes([]);
			setStatus('idle');
			onChange({ postalCode, city, isValid: false });
			return;
		}
		const controller = new AbortController();
		setStatus('loading');
		fetch(`https://geo.api.gouv.fr/communes?codePostal=${postalCode}&fields=nom`, {
			signal: controller.signal,
		})
			.then(r => r.json())
			.then(data => {
				const noms = [...new Set(data.map(c => c.nom.toUpperCase()))].sort();
				setCommunes(noms);
				if (noms.length === 0) {
					setStatus('unknown');
					onChange({ postalCode, city: '', isValid: false });
					return;
				}
				setStatus('ok');
				// Une seule commune : sélection d'office.
				// Commune déjà connue (fiche existante) et présente dans la liste : on la garde.
				const current = (city || '').trim().toUpperCase();
				const next = noms.length === 1 ? noms[0] : noms.includes(current) ? current : '';
				onChange({ postalCode, city: next, isValid: next !== '' });
			})
			.catch(err => {
				if (err.name === 'AbortError') return;
				setStatus('error');
				onChange({ postalCode, city, isValid: (city || '').trim() !== '' });
			});
		return () => controller.abort();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [postalCode]);

	const handlePostalCode = e => {
		const value = e.target.value.replace(/\D/g, '').slice(0, 5);
		onChange({ postalCode: value, city: '', isValid: false });
	};

	const handleCity = e => {
		const value = e.target.value;
		onChange({ postalCode, city: value, isValid: value.trim() !== '' });
	};

	const star = required && <span className="text-red-500"> *</span>;

	return (
		<>
			<div className={fieldClassName}>
				<label className={labelClassName}>Code postal{star}</label>
				<input
					type="text"
					inputMode="numeric"
					autoComplete="postal-code"
					value={postalCode}
					onChange={handlePostalCode}
					placeholder="5 chiffres"
					className={inputClassName}
				/>
				{status === 'loading' && <p className={`text-xs text-gray-500 mt-1 ${messageClassName}`}>Recherche des communes…</p>}
				{status === 'unknown' && (
					<p role="alert" className={`text-xs text-red-600 mt-1 ${messageClassName}`}>
						Code postal inconnu : vérifiez les 5 chiffres.
					</p>
				)}
			</div>

			<div className={fieldClassName}>
				<label className={labelClassName}>Commune{star}</label>
				{status === 'error' ? (
					<>
						<input type="text" value={city} onChange={handleCity} className={inputClassName} />
						<p className={`text-xs text-amber-700 mt-1 ${messageClassName}`}>
							Vérification indisponible : contrôlez la commune et le code postal.
						</p>
					</>
				) : (
					<select
						value={city}
						onChange={handleCity}
						disabled={communes.length === 0}
						className={`${inputClassName} bg-white disabled:bg-gray-100 disabled:text-gray-400`}
					>
						<option value="">
							{communes.length === 0 ? "Saisissez d'abord le code postal" : 'Choisissez la commune'}
						</option>
						{communes.map(nom => (
							<option key={nom} value={nom}>{nom}</option>
						))}
					</select>
				)}
			</div>
		</>
	);
}
