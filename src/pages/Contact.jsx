// Importing dependencies
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@lib/supabaseClient.js';
import { uploadPDF } from '@lib/sendPDF.js';
import { useAuthor } from '@context/AuthorContext.jsx';
import { displayNotification } from '@lib/displayNotification.jsx';

// Importing common components
import Loading from '@common/Loading';

// Importing assets
import roundLogo from "@assets/logos/roundLogo.png"

function Contact() {
	const { user, loading } = useAuthor()

	const [formData, setFormData] = useState({
		message: '',
		file: null
	});

	const [submitting, setSubmitting] = useState(false);
	const isNotified = useRef(false)
	const fileInputRef = useRef(null);

	useEffect(() => {
		if (loading) return;
	}, [loading, user])

	function notify(message) {
		if (isNotified.current) return;
		isNotified.current = true
		displayNotification("Connexion requise", message, "warning")
	}

	function handleChange(e) {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		});
	}

	function handleFileChange(e) {
		const file = e.target.files[0];
		setFormData({
			...formData,
			file: file
		});
	}

	async function handleSubmit(e) {
		e.preventDefault();

		if (!formData.message.trim()) {
			displayNotification("Message requis", "Veuillez saisir un message", "warning");
			return;
		}

		setSubmitting(true);

		const name = formData.file ? `${Date.now()}_${formData.file.name}` : null;
		let uploadSuccess = true;

		// Upload the PDF file if it exists
		if (formData.file) {
			const { success, error } = await uploadPDF(formData.file, name, "messages")
			if (!success) {
				displayNotification("Échec de l'upload du fichier PDF", error.message, "danger")
				uploadSuccess = false;
			}
		}

		if (!uploadSuccess) {
			setSubmitting(false);
			return;
		}

		// Message insertion in the db
		let newMessage
		if (user) {
			newMessage = {
				user_id: user.id,
				message: formData.message,
				pdf_name: name,
			};
		} else {
			newMessage = {
				user_id: 0,
				message: formData.message,
				pdf_name: name,
			};
		}


		const { error: insertError } = await supabase
			.from('Messages')
			.insert([newMessage]);

		if (insertError) {
			displayNotification("Erreur lors de l'envoi du message", insertError.message, "danger")
			setSubmitting(false);
			return;
		}

		displayNotification("Message envoyé avec succès", "Nous vous répondrons dans les plus brefs délais", "success")

		// Reset form
		setFormData({ message: '', file: null });
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}

		setSubmitting(false);
	}

	return (
		<>
			{loading ? (
				<Loading text="Chargement en cours..." />
			) : (
				<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
					{/* Header Section */}
					<div className="bg-gradient-to-br from-[#3435FF] via-[#2526B7] to-[#1F2099] relative overflow-hidden">
						<div className="absolute top-0 right-0 w-96 h-96 bg-[#FF8200] opacity-10 rounded-full blur-3xl"></div>
						<div className="absolute bottom-0 left-0 w-72 h-72 bg-[#FF8200] opacity-5 rounded-full blur-3xl"></div>
						<div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 relative z-10">
							<div className="text-center">
								<h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">Contactez-nous</h1>
								<p className="text-blue-100 text-lg lg:text-xl max-w-2xl mx-auto">
									Une question ? Un problème ? Nous sommes là pour vous aider
								</p>
							</div>
						</div>
					</div>

					<div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
						<div className="grid lg:grid-cols-2 gap-12 items-start">
							{/* Left Information Section */}
							<div className="space-y-8">
								<div>
									<h2 className="text-3xl font-bold text-[#3435FF] mb-6">
										Comment pouvons-nous vous aider ?
									</h2>
									<div className="prose prose-lg text-gray-700 space-y-4">
										<p className="leading-relaxed">
											Quel que soit le sujet : une réclamation, un problème de livraison ou de délais,
											un contenu défectueux, ou toute question concernant votre situation personnelle,
											n'hésitez pas à nous contacter.
										</p>
										<p className="leading-relaxed">
											Pour un problème de commande, merci de préciser la date de commande dans votre message.
										</p>
										<p className="leading-relaxed font-semibold text-[#3435FF]">
											Nous vous recontacterons au numéro de téléphone ou à l'adresse mail fournie lors de votre inscription.
										</p>
									</div>
								</div>

								{/* Info Cards */}
								<div className="space-y-4">
									<div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-[#3435FF] hover:shadow-lg transition-all">
										<div className="flex items-start gap-4">
											<div className="bg-blue-50 p-3 rounded-lg">
												<svg className="w-6 h-6 text-[#3435FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
											</div>
											<div>
												<h3 className="font-bold text-gray-800 mb-1">Réponse rapide</h3>
												<p className="text-gray-600 text-sm">
													Nous nous engageons à répondre dans les 48 heures ouvrées
												</p>
											</div>
										</div>
									</div>

									<div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-[#FF8200] hover:shadow-lg transition-all">
										<div className="flex items-start gap-4">
											<div className="bg-orange-50 p-3 rounded-lg">
												<svg className="w-6 h-6 text-[#FF8200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
												</svg>
											</div>
											<div>
												<h3 className="font-bold text-gray-800 mb-1">Confidentialité assurée</h3>
												<p className="text-gray-600 text-sm">
													Vos informations sont traitées en toute confidentialité
												</p>
											</div>
										</div>
									</div>
								</div>

								{/* Logo decoration - hidden on mobile */}
								<div className="hidden lg:block mt-12">
									<img
										src={roundLogo}
										alt="Logo"
										className="w-64 opacity-20 -rotate-12 mx-auto"
									/>
								</div>
							</div>

							{/* Right Form Section */}
							<div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
								<div className="bg-gradient-to-r from-[#3435FF] to-[#5253ff] px-8 py-6">
									<h2 className="text-2xl font-bold text-white flex items-center gap-3">
										<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
										</svg>
										Formulaire de contact
									</h2>
								</div>

								<form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
									{/* Message Field */}
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">
											Votre message <span className="text-red-500">*</span>
										</label>
										<textarea
											name="message"
											value={formData.message}
											onChange={handleChange}
											required
											rows={8}
											placeholder="Décrivez votre demande en détail..."
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3435FF] focus:border-transparent transition-all resize-none"
										/>
										<p className="text-xs text-gray-500 mt-2">
											{formData.message.length} caractères
										</p>
									</div>

									{/* File Upload */}
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">
											Document joint (optionnel)
										</label>
										<div className="relative">
											<input
												type='file'
												accept='.pdf'
												name='file'
												onChange={(e) => {
													if (e.target.files[0]) {
														displayNotification("Fichier sélectionné", e.target.files[0].name, "info")
														handleFileChange(e);
													}
												}}
												ref={fileInputRef}
												className="hidden"
												id="file-upload"
											/>
											<label
												htmlFor="file-upload"
												className="flex items-center justify-center w-full px-4 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#3435FF] hover:bg-blue-50 transition-all cursor-pointer group"
											>
												<div className="text-center">
													<svg className="w-10 h-10 text-gray-400 group-hover:text-[#3435FF] mx-auto mb-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
													</svg>
													{formData.file ? (
														<>
															<p className="text-sm font-medium text-[#3435FF]">
																📄 {formData.file.name}
															</p>
															<p className="text-xs text-gray-500 mt-1">
																Cliquez pour changer le fichier
															</p>
														</>
													) : (
														<>
															<p className="text-sm font-medium text-gray-700">
																Cliquez pour sélectionner un fichier PDF
															</p>
															<p className="text-xs text-gray-500 mt-1">
																Format accepté : PDF uniquement
															</p>
														</>
													)}
												</div>
											</label>
										</div>
									</div>

									{/* Submit Button */}
									<button
										type="submit"
										disabled={submitting || !formData.message.trim()}
										className={`w-full py-4 rounded-lg font-bold text-lg transition-all shadow-lg ${submitting || !formData.message.trim()
											? 'bg-gray-300 text-gray-500 cursor-not-allowed'
											: 'bg-gradient-to-r from-[#FF8200] to-[#ff9800] hover:from-[#ff9800] hover:to-[#FF8200] text-white hover:shadow-xl transform hover:-translate-y-1'
											}`}
									>
										{submitting ? (
											<span className="flex items-center justify-center gap-2">
												<svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
													<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
													<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
												Envoi en cours...
											</span>
										) : (
											<span className="flex items-center justify-center gap-2">
												<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
												</svg>
												Envoyer le message
											</span>
										)}
									</button>

									<p className="text-xs text-center text-gray-500">
										En soumettant ce formulaire, vous acceptez que nous traitions vos données pour répondre à votre demande.
									</p>
								</form>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

export default Contact