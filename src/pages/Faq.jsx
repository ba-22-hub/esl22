// =============================================================================
// HISTORIQUE DES MODIFICATIONS
// =============================================================================
//
// Date          Auteur        Description
// ----------    ----------    -------------------------------------------------
// 2026-06-15    Louvel       coquille dans texte item 17
// 2026-10-31    Louvel       item 22 : paiement avec Wero ; hauteur maximale
//                            des réponses augmentée (texte coupé sur mobile)
//
// =============================================================================
import { useEffect, useState } from 'react';

function Faq() {
    useEffect(() => {
        // Fonction pour faire défiler vers une question
        window.scrollToQuestion = (id) => {
            const question = document.getElementById(id);
            if (question) {
                question.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Mettre à jour l'item actif dans la sidebar
                document.querySelectorAll('#faqSidebar li').forEach(item => {
                    item.classList.remove('!bg-[rgba(243,111,33,0.1)]', '!border-[#F36F21]', '!text-[#F36F21]', '!font-bold');
                });
                const targetItem = document.querySelector(`#faqSidebar li[data-target="${id}"]`);
                if (targetItem) {
                    targetItem.classList.add('!bg-[rgba(243,111,33,0.1)]', '!border-[#F36F21]', '!text-[#F36F21]', '!font-bold');
                }
            }
        };

        // Mettre à jour la sidebar lors du défilement
        const handleScroll = () => {
            const questions = [
                { id: 'q1', offset: 200 },
                { id: 'q2', offset: 450 },
                { id: 'q3', offset: 700 },
                { id: 'q4', offset: 950 },
                { id: 'q5', offset: 1200 },
                { id: 'q6', offset: 1450 },
                { id: 'q7', offset: 1700 },
                { id: 'q8', offset: 1950 },
                { id: 'q9', offset: 2200 },
                { id: 'q10', offset: 2450 },
                { id: 'q11', offset: 2700 },
                { id: 'q12', offset: 2950 },
                { id: 'q13', offset: 3200 },
                { id: 'q14', offset: 3450 },
                { id: 'q15', offset: 3700 },
                { id: 'q16', offset: 3950 },
                { id: 'q17', offset: 4200 },
                { id: 'q18', offset: 4450 }
            ];

            const scrollPosition = window.scrollY + 150;
            questions.forEach(q => {
                if (scrollPosition >= q.offset && scrollPosition < q.offset + 300) {
                    document.querySelectorAll('#faqSidebar li').forEach(item => {
                        item.classList.remove('!bg-[rgba(243,111,33,0.1)]', '!border-[#F36F21]', '!text-[#F36F21]', '!font-bold');
                    });
                    const targetItem = document.querySelector(`#faqSidebar li[data-target="${q.id}"]`);
                    if (targetItem) {
                        targetItem.classList.add('!bg-[rgba(243,111,33,0.1)]', '!border-[#F36F21]', '!text-[#F36F21]', '!font-bold');
                    }
                }
            });
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            delete window.scrollToQuestion;
        };
    }, []);

    const FaqItem = ({ id, question, children }) => {
        // Ouverte d'office si on arrive sur la FAQ par un lien vers cette question
        const [isOpen, setIsOpen] = useState(() => window.location.hash === `#${id}`);
        return (
            <div
                className="bg-gray-50 rounded-lg border border-rayonorange border-600 p-3 lg:p-6 transition-all duration-300 hover:shadow-lg mb-2"
                id={id}
            >
                <div
                    className="text-xl font-bold text-orange-500 cursor-pointer flex justify-between items-center"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span>{question}</span>
                    <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                        ▼
                    </span>
                </div>

                <div className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${isOpen ? 'max-h-[2000px] mt-4 opacity-100' : 'max-h-0 opacity-0'}
            `}>
                    <div className="text-gray-800 leading-relaxed pl-5 border-l-2 border-orange-200">
                        {children}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            {/* <header className="bg-green-600 text-white py-4 px-8 text-center">
                <div className="text-3xl font-bold mb-2">Banque Alimentaire des Côtes-d'Armor</div>
                
                Sidebar navigation realy needed ?? 
                <div 
                    id="faqSidebar" 
                    className="hidden lg:block fixed left-0 top-[120px] w-[250px] bg-white border-r border-green-600 py-4 h-[calc(100vh-120px)] overflow-y-auto shadow-md z-[100]"
                >
                    <ul className="list-none">
                        {[
                            { id: 'q1', text: '1. Comment m\'inscrire ?' },
                            { id: 'q2', text: '2. Pourquoi ne puis-je pas voir les produits ?' },
                            { id: 'q3', text: '3. Comment savoir si mon dossier est validé ?' },
                            { id: 'q4', text: '4. Mot de passe oublié' },
                            { id: 'q5', text: '5. Renouveler mon inscription' },
                            { id: 'q6', text: '6. Problème avec ma commande' },
                            { id: 'q7', text: '7. Retirer ma commande' },
                            { id: 'q8', text: '8. Modifier/annuler une commande' },
                            { id: 'q9', text: '9. Horaires du service client' },
                            { id: 'q10', text: '10. Erreur sur mon inscription' },
                            { id: 'q11', text: '11. Suivre mon dossier' },
                            { id: 'q12', text: '12. Commander sans services sociaux' },
                            { id: 'q13', text: '13. Infos sur les produits' },
                            { id: 'q14', text: '14. Contacter les services sociaux' },
                            { id: 'q15', text: '15. Réactiver mon inscription' }
                        ].map(item => (
                            <li 
                                key={item.id}
                                data-target={item.id} 
                                onClick={() => window.scrollToQuestion(item.id)}
                                className="py-2.5 px-5 cursor-pointer text-[#3435FF] font-semibold transition-all border-l-[3px] border-[#00A651] hover:bg-orange-50 hover:border-orange-500 hover:text-orange-500"
                            >
                                {item.text}
                            </li>
                        ))}
                    </ul>
                </div> 
            </header> */}

            <div className="bg-gradient-to-b from-[#3435FF] via-[#2526B7] to-[#1F2099] text-white">
                <h1 className="ml-12 lg:ml-[480px] py-10  mb-120  text-5xl lg:text-7xl font-bold">Foire aux Questions </h1>
            </div>

            <main className="lg:mx-[30px] my-8 px-4 mb-4">

                <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-6 items-start">
                    <FaqItem id="q1" question="1 Comment m'inscrire sur l'épicerie en ligne des Côtes d'Armor (ESL22) ?">
                        <p className="mb-4">L'inscription se fait en 3 étapes :</p>
                        <ol className="list-decimal pl-6 mb-4 space-y-2">
                            <li>Contactez les services sociaux de votre commune pour vérifier votre éligibilité et leur demander de transmettre votre dossier à notre équipe.</li>
                            <li>Validation du dossier : Notre équipe étudie votre dossier avec les services sociaux. Vous serez informé·e par email une fois votre inscription finalisée par l'administrateur.</li>
                            <li>Accès à l'épicerie : Une fois votre compte activé, connectez-vous pour accéder à l'épicerie en ligne et commander vos produits à prix solidaires.</li>
                        </ol>
                        <p className="font-bold text-orange-500">➡️ Note : Le bouton "S'inscrire" n'est visible que pour les administrateurs. Les utilisateurs ne peuvent pas s'inscrire directement.</p>
                    </FaqItem>

                    <FaqItem id="q2" question="2 Pourquoi ne puis-je pas voir les produits avant de m'inscrire ?">
                        <p>Les produits sont réservés aux utilisateurs inscrits et validés par notre équipe, en partenariat avec les services sociaux. Cela nous permet de garantir l'accès aux personnes éligibles.</p>
                    </FaqItem>

                    <FaqItem id="q3" question="3 Comment savoir si mon dossier est validé ?">
                        <p>Vous recevrez un email de confirmation une fois que votre dossier aura été validé par notre équipe. Ce mail contiendra vos identifiants de connexion et un lien pour accéder à l'épicerie.</p>
                    </FaqItem>

                    <FaqItem id="q4" question="4 J'ai oublié mon mot de passe, que faire ?">
                        <p>Utilisez la fonction "Mot de passe oublié" sur la page de connexion. Un lien de réinitialisation vous sera envoyé par email.</p>
                    </FaqItem>

                    <FaqItem id="q5" question="5 Comment renouveler mon inscription ?">
                        <p className="mb-4">Votre inscription a une durée limitée. Pour la renouveler :</p>
                        <ol className="list-decimal pl-6 space-y-2">
                            <li>Prenez rendez-vous avec le service social qui suit votre situation pour réactualiser votre dossier.</li>
                            <li>Une fois votre dossier mis à jour, votre accès sera prolongé automatiquement.</li>
                        </ol>
                    </FaqItem>

                    <FaqItem id="q6" question="6 Que faire si ma commande n'apparaît pas ou si j'ai un problème technique ?">
                        <p>Vérifiez votre boîte mail (y compris les spams) pour les confirmations de commande. Si le problème persiste, contactez-nous via le formulaire "Nous contacter" ou par email à <a href="mailto:ba220.epicerie@banquealimentaire.org" className="text-orange-500 font-bold hover:underline">ba220.epicerie@banquealimentaire.org</a>.</p>
                    </FaqItem>

                    <FaqItem id="q7" question="7 Quand et comment puis-je retirer ma commande ?">
                        <p>Les commandes sont expédiées uniquement le <span className="font-bold text-orange-500">mercredi</span>. Vous recevrez un email avec le point relais DPD où retirer votre colis. Vous avez 9 jours pour le récupérer (pièce d'identité obligatoire).</p>
                    </FaqItem>

                    <FaqItem id="q8" question="8 Puis-je modifier ou annuler ma commande ?">
                        <p>Les commandes ne peuvent pas être modifiées ou annulées une fois validées. En cas d'urgence, contactez-nous rapidement à <a href="mailto:ba220.epicerie@banquealimentaire.org" className="text-orange-500 font-bold hover:underline">ba220.epicerie@banquealimentaire.org</a>.</p>
                    </FaqItem>

                    <FaqItem id="q9" question="9 Quels sont les horaires d'ouverture du service client ?">
                        <p>Notre équipe répond aux emails sous 24h en semaine (du lundi au vendredi).</p>
                    </FaqItem>

                    <FaqItem id="q10" question="10 Qui contacter en cas d'erreur sur mon inscription ou ma commande ?">
                        <p className="mb-4">Envoyez un email à <a href="mailto:ba220.epicerie@banquealimentaire.org" className="text-orange-500 font-bold hover:underline">ba220.epicerie@banquealimentaire.org</a> en précisant :</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Votre nom et prénom.</li>
                            <li>Le numéro de votre commande ou dossier (si applicable).</li>
                            <li>Une description détaillée du problème.</li>
                        </ul>
                    </FaqItem>

                    <FaqItem id="q11" question="11 Comment suivre l'état de mon dossier ou de ma commande ?">
                        <p>Vous recevrez des emails à chaque étape clé (validation du dossier, expédition, disponibilité du colis). Pour toute question, utilisez le formulaire "Nous contacter".</p>
                    </FaqItem>

                    <FaqItem id="q12" question="12 Puis-je commander sans passer par les services sociaux ?">
                        <p>Non, l'accès à l'épicerie est réservé aux personnes dont le dossier a été validé par les services sociaux.</p>
                    </FaqItem>

                    <FaqItem id="q13" question="13 Où trouver les informations sur les produits disponibles ?">
                        <p>Une fois connecté·e, vous accéderez au catalogue complet des produits à prix solidaires (réduits de 70% à 90%).</p>
                    </FaqItem>

                    <FaqItem id="q14" question="14 Comment contacter les services sociaux pour mon inscription ?">
                        <p>Adressez-vous directement à votre mairie ou CCAS (Centre Communal d'Action Sociale) ou la Maison du Département de votre secteur (5 sur le 22). Ils transmettront votre dossier à notre équipe.</p>
                    </FaqItem>

                    <FaqItem id="q15" question="15 Mon inscription est arrivée à échéance, comment la réactiver ?">
                        <p>Prenez rendez-vous avec le service social qui suit votre situation pour mettre à jour votre dossier. Votre accès sera rétabli après validation.</p>
                    </FaqItem>

                    <FaqItem id="q16" question="16 Quel poids puis-je commander dans chaque colis ?">
                        <p>Le poids minimum est de 4 kg et le maximum de 19 kg (le poids de la commande est affiché sur votre panier)</p>
                    </FaqItem>


                    <FaqItem id="q17" question="17 Quelle quantité puis-je commander chaque mois ?">
                        <p>Le poids total commandable par mois est visible à la rubrique mon compte, vos droits, Poids maximum mensuel. Ce poids maximum est défini par le nombre de personnes du foyer. Le poids restant commandable dans le mois figure également (Poids restant ce mois-ci). </p>
                    </FaqItem>


                    <FaqItem id="q18" question="18 Pourquoi il est préférable de faire des grosses commandes plutôt que des petits colis ?">
                        <p>Votre intérêt est de minimiser le nombre de colis pas mois pour payer le minimum de participation aux frais de livraison. Un colis de 15 kg vaut mieux que trois de 5kg, vous économiserez 2,70€ sur le mois.</p>
                    </FaqItem>

                    <FaqItem id="geolocalisation" question="19 Pourquoi le site me demande-t-il ma position ?">
                        <p>Cette information sert uniquement à identifier le point relais le plus proche de chez vous pour la livraison de votre commande. Elle n'est ni stockée, ni transmise à d'autres services, ni utilisée à d'autres fins. Vous pouvez refuser l'accès à votre position et choisir votre point relais manuellement en saisissant votre code postal.</p>
                    </FaqItem>

                    <FaqItem id="q20" question="20 Comment autoriser la géolocalisation ?">
                        <p>Lorsque vous cliquez sur « Me localiser », votre navigateur affiche une petite fenêtre demandant l'autorisation d'accéder à votre position. Cliquez sur <span className="font-bold text-orange-500">« Autoriser »</span> (ou « Allow »). Aucune autre action n'est nécessaire.</p>
                    </FaqItem>

                    <FaqItem id="q21" question="21 J'ai refusé par erreur, comment réactiver la géolocalisation ?">
                        <p>Le plus simple est de saisir votre code postal manuellement pour trouver un point relais, sans avoir besoin de la géolocalisation. Si vous préférez réactiver la position, vous pouvez le faire dans les réglages de votre navigateur, dans la rubrique consacrée aux autorisations du site.</p>
                    </FaqItem>

                    <FaqItem id="googlepay" question="22 Comment payer avec mon téléphone, sans saisir ma carte bancaire ?">
                        <p className="mb-4">Si votre carte bancaire est enregistrée dans votre téléphone, vous pouvez payer en un seul geste, sans taper les numéros de votre carte. C'est plus simple et plus rapide.</p>

                        <p className="mb-2 font-bold text-orange-500">Enregistrer votre carte (une seule fois) :</p>
                        <ol className="list-decimal pl-6 mb-4 space-y-2">
                            <li>Ouvrez l'application <span className="font-bold">Google Wallet</span> (installez-la depuis le Play Store si besoin).</li>
                            <li>Touchez « Ajouter à Wallet », puis « Carte de paiement ».</li>
                            <li>Photographiez votre carte ou saisissez ses numéros.</li>
                            <li>Validez avec le code reçu par SMS ou dans l'application de votre banque.</li>
                        </ol>
                        <p className="mb-4">Astuce : beaucoup de banques proposent un bouton « Ajouter à Google Pay » directement dans leur application.</p>

                        <p className="mb-2 font-bold text-orange-500">Payer sur ESL22 :</p>
                        <ol className="list-decimal pl-6 mb-4 space-y-2">
                            <li>Ouvrez le site avec <span className="font-bold">Chrome</span> (le navigateur de Google).</li>
                            <li>Sur la page de paiement, touchez le bouton <span className="font-bold">Google Pay</span>.</li>
                            <li>Validez avec votre empreinte, votre visage ou le code de votre téléphone.</li>
                            <li>Vous revenez automatiquement sur ESL22 : votre commande est enregistrée.</li>
                        </ol>

                        <p className="mb-2 font-bold text-orange-500">Vous avez un iPhone ?</p>
                        <p className="mb-4">C'est le même principe avec <span className="font-bold">Apple Pay</span> : ajoutez votre carte dans l'application Cartes (Wallet), ouvrez le site avec Safari, et touchez le bouton Apple Pay au moment du paiement.</p>

                        <p>Vous ne voyez pas le bouton ? Vérifiez que vous utilisez Chrome (ou Safari sur iPhone) et que votre carte est bien enregistrée dans votre téléphone. Vous pouvez toujours payer en saisissant votre carte bancaire.</p>
                    </FaqItem>

                    {/* En attente : Wero est en bêta chez Stripe, parcours pas encore assez simple (essai du 31/10/2026)
                    <FaqItem id="wero" question="23 Comment payer avec Wero, sans carte bancaire ?">
                        <p className="mb-4">Wero permet de payer directement depuis votre compte bancaire, sans saisir de numéro de carte. Une fois activé, c'est plus simple et plus rapide.</p>
                        <p className="mb-2 font-bold text-orange-500">Activer Wero (une seule fois) :</p>
                        <p className="mb-4">Ouvrez l'application de votre banque et cherchez le menu « Wero » (parfois dans « Paiements » ou « Virements »). Suivez les étapes : il suffit en général d'indiquer votre numéro de téléphone. Si votre banque ne le propose pas dans son application, installez l'application Wero et choisissez-y votre banque.</p>
                        <p className="mb-2 font-bold text-orange-500">Payer depuis votre téléphone :</p>
                        <p className="mb-4">Si la page Wero vous propose d'ouvrir l'application de votre banque, touchez ce bouton et validez le paiement avec votre code. Si elle n'affiche qu'un QR code, revenez en arrière et payez plutôt par carte bancaire : le QR code est prévu pour un paiement depuis un ordinateur.</p>
                        <p className="mb-2 font-bold text-orange-500">Payer depuis un ordinateur :</p>
                        <ol className="list-decimal pl-6 mb-4 space-y-2">
                            <li>Sur la page de paiement, choisissez « Wero » : un QR code (un carré noir et blanc) s'affiche.</li>
                            <li>Sur votre téléphone, ouvrez l'application de votre banque, menu « Wero », et touchez « Scanner ».</li>
                            <li>Visez le QR code de l'écran avec le téléphone, puis validez le paiement avec votre code.</li>
                            <li>L'ordinateur revient automatiquement sur ESL22 : votre commande est enregistrée.</li>
                        </ol>
                        <p>Toutes les banques ne proposent pas encore Wero. Si ce n'est pas le cas de la vôtre, vous pouvez toujours payer par carte bancaire.</p>
                    </FaqItem>
                    */}

                </div>

                {/* Section contact */}
                <div className="text-center my-8 p-6 bg-gray-50 rounded-lg border border-rayonorange border-600 lg:w-[40%] lg:ml-[30%]">
                    <h2 className="text-green-600 text-2xl font-bold mb-4">Besoin d'aide supplémentaire ?</h2>
                    <div className="mt-4 text-lg">
                        <p className="mb-4">📧 <a href="mailto:ba220.epicerie@banquealimentaire.org" className="text-orange-500 font-bold hover:underline">ba220.epicerie@banquealimentaire.org</a></p>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Faq;
