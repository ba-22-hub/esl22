import { useState } from "react";
import { createUser } from "@lib/createUser.js"
import { supabase } from "@lib/supabaseClient.js"

import FormInput from "@common/FormInput.jsx"
import PostalCodeCityInput from "@common/PostalCodeCityInput.jsx"
import { displayNotification } from '@lib/displayNotification.jsx';


function AddUserModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const [length, setLength] = useState('')
    const [addrValid, setAddrValid] = useState(false)
    const [formData, setFormData] = useState({
        accountType: 'beneficiary',
        gender: '',
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: '',
        addAddress: '',
        city: '',
        postalCode: '',
        start_right: new Date().toISOString().slice(0, 10),
        end_right: '',
        weight_limit: '',
        order_limit: '',
        price_limit: '',
        validation_org: '',
        validation_person: '',
        user_message: '',
        admin_message: ''
    })

    // Un compte MDS (centre social) n'a ni date d'expiration de droits
    // pertinente, ni quotas individuels : on lui pose une échéance très
    // lointaine (la colonne end_right est NOT NULL en base) et on vide les
    // quotas, qui doivent rester NULL = illimité côté back.
    const MDS_DEFAULT_VALIDITY_YEARS = 100;

    function handleAccountTypeChange(e) {
        const accountType = e.target.value;
        setLength('');
        setFormData(prevData => {
            if (accountType === 'mds') {
                const farFuture = new Date();
                farFuture.setFullYear(farFuture.getFullYear() + MDS_DEFAULT_VALIDITY_YEARS);
                return {
                    ...prevData,
                    accountType,
                    end_right: farFuture.toISOString().slice(0, 10),
                    weight_limit: null,
                    order_limit: null,
                    price_limit: null
                };
            }
            return { ...prevData, accountType, end_right: '' };
        });
    }

    function handleChange(e) {
        const { name, value, type } = e.target;

        let newValue = value;
        if (type === "number") {
            const parsed = Number(value);
            newValue = isNaN(parsed) ? "" : Math.max(0, parsed);
        }

        if (name == "length") {
            const lengthValue = Number(newValue);

            setLength(lengthValue);

            setFormData({
                ...formData,
                end_right: new Date(
                    new Date(formData.start_right).getTime() + (lengthValue * 86400000)
                ).toISOString().slice(0, 10),
            });

        } else {
            setFormData(prevData => ({
                ...prevData,
                [name]: newValue
            }));
        }
    }
    async function handleSubmit() {
        // DPD refuse tout couple code postal / commune inconnu
        if (!addrValid) {
            displayNotification(
                'Adresse incomplète',
                'Saisissez un code postal valide et choisissez la commune : DPD refuse les adresses inconnues.',
                'warning'
            );
            return;
        }
        // admin_message n'est pas une colonne de "User" : on le retire avant la création
        const { admin_message, ...userData } = formData;
        const ok = await createUser(userData);
        if (!ok) return;

        // Message administrateur : create-user ne renvoie pas l'id, on le retrouve par l'email
        const note = admin_message?.trim();
        if (note) {
            const { data: created } = await supabase
                .from('User')
                .select('id')
                .eq('email', userData.email)
                .maybeSingle();
            const { error } = created
                ? await supabase.from('user_admin_note').upsert({ user_id: created.id, admin_message: note })
                : { error: { message: "Compte introuvable après création" } };
            if (error) {
                displayNotification(
                    'Message administrateur non enregistré',
                    `Le compte est créé, mais ajoutez le message depuis la fiche. (${error.message})`,
                    'warning'
                );
            }
        }
        onClose();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={onClose} // Fermer en cliquant sur le fond
        >
            <div
                className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()} // Empêcher la fermeture en cliquant sur le modal
            >
                {/* Header */}
                <div className="flex items-start justify-between py-3 px-6 border-b border-gray-200">
                    <div className="flex-1 pr-4">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Ajouter un utilisateur
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-red hover:bg-red-600 text-white rounded-lg transition flex items-center justify-center text-xl"
                        title="Annuler"
                    >
                        ✕
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    <h2 className="ml-[4%] text-xl text-rayonorange font-bold mb-2">Type de compte</h2>
                    <div className="ml-[8%] mb-4">
                        <input className="" type="radio" name="accountType" value="beneficiary" checked={formData.accountType === "beneficiary"} onChange={handleAccountTypeChange} /> <a className="text-rayonblue ml-1">Bénéficiaire</a>
                        <input className="ml-8" type="radio" name="accountType" value="mds" checked={formData.accountType === "mds"} onChange={handleAccountTypeChange} /> <a className="text-rayonblue ml-1">Centre social (MDS)</a>
                        {formData.accountType === "mds" && (
                            <p className="text-sm text-gray-500 mt-1">
                                💡 Compte sans expiration de droits ni quotas individuels (accès illimité).
                            </p>
                        )}
                    </div>

                    <h2 className="ml-[4%] text-xl text-rayonorange font-bold mb-2">Informations personnelles</h2>
                    {/* Gender */}
                    <div>
                        <label className="ml-[8%] text-rayonblue">Genre <a className="text-red">*</a></label><br />
                        <input className="ml-[8%]" type="radio" name="gender" value="Homme" checked={formData.gender === "Homme"} onChange={handleChange} required /> <a className="text-rayonblue ml-1">Homme</a>
                        <input className="ml-8" type="radio" name="gender" value="Femme" checked={formData.gender === "Femme"} onChange={handleChange} required /> <a className="text-rayonblue ml-1">Femme</a>
                        <input className="ml-8" type="radio" name="gender" value="Autre" checked={formData.gender === "Autre"} onChange={handleChange} required /> <a className="text-rayonblue ml-1">Autre</a>
                    </div><br />
                    {/* First name  */}
                    <FormInput labelClassName="ml-[8%]" className="w-[84%] h-[2.3rem] ml-[8%] rounded-lg border border-rayonblue mb-2 mt-1" inputText="Prénom" name="firstName" value={formData.firstName} onChange={handleChange} isStarred={true} />
                    {/* Last name  */}
                    <FormInput labelClassName="ml-[8%]" className="w-[84%] h-[2.3rem] ml-[8%] rounded-lg border border-rayonblue mb-2 mt-1" inputText="Nom" name="lastName" value={formData.lastName} onChange={handleChange} isStarred={true} />
                    {/* Phone number */}
                    <FormInput labelClassName="ml-[8%]" className="w-[84%] h-[2.3rem] ml-[8%] rounded-lg border border-rayonblue mb-2 mt-1" inputText="Téléphone" name="phone" value={formData.phone} onChange={handleChange} isStarred={true} />
                    {/* Mail */}
                    <FormInput labelClassName="ml-[8%]" className="w-[84%] h-[2.3rem] ml-[8%] rounded-lg border border-rayonblue mb-2 mt-1" inputText="Adresse mail" name="email" value={formData.email} onChange={handleChange} isStarred={true} />
                    {/* Street */}
                    <FormInput labelClassName="ml-[8%]" className="w-[84%] h-[2.3rem] ml-[8%] rounded-lg border border-rayonblue mb-2 mt-1" inputText="Rue :" name="address" value={formData.address} onChange={handleChange} isStarred={true} />
                    {/* add adresse */}
                    <FormInput labelClassName="ml-[8%]" className="w-[84%] h-[2.3rem] ml-[8%] rounded-lg border border-rayonblue mb-2 mt-1" inputText="Complément d'adresse :" name="addAddress" value={formData.addAddress} onChange={handleChange} />
                    {/* Post code + city (contrôlés via geo.api.gouv.fr) */}
                    <PostalCodeCityInput
                        postalCode={formData.postalCode}
                        city={formData.city}
                        required
                        onChange={({ postalCode, city, isValid }) => {
                            setFormData(prev => ({ ...prev, postalCode, city }));
                            setAddrValid(isValid);
                        }}
                        labelClassName="ml-[8%] text-rayonblue block"
                        inputClassName="w-[84%] h-[2.3rem] ml-[8%] rounded-lg border border-rayonblue mb-2 mt-1 px-2"
                        messageClassName="ml-[8%] -mt-1 mb-2"
                    />
                    {/* length */}
                    {formData.accountType !== "mds" && (
                        <FormInput labelClassName="ml-[8%]" className="w-[84%] h-[2.3rem] ml-[8%] rounded-lg border border-rayonblue mb-2 mt-1" inputText="Durée de validité (jours)" name="length" value={length} onChange={handleChange} isStarred={true} type='number' min="0" />
                    )}

                    {formData.accountType !== "mds" && (
                        <>
                            <h2 className="ml-[4%] text-xl text-rayonorange font-bold my-2">Information Bénéficiaire</h2>
                            <p className="ml-[8%] text-rayonblue">Origine de la validation</p>
                            <div className="grid md:grid-cols-2 gap-4 mx-[8%]">
                                <FormInput labelClassName="" className="w-[100%] h-[2.3rem] rounded-lg border border-rayonblue mb-2 mt-1" inputText="Organisation" name="validation_org" value={formData.validation_org} onChange={handleChange} placeholder="Ex : CCAS de Lannion" maxLength={150} />
                                <FormInput labelClassName="" className="w-[100%] h-[2.3rem] rounded-lg border border-rayonblue mb-2 mt-1" inputText="Nom de la personne" name="validation_person" value={formData.validation_person} onChange={handleChange} placeholder="Ex : Ginette Durand, AS" maxLength={150} />
                            </div>
                            <label className="ml-[8%] text-rayonblue">Message utilisateur <span className="text-gray-400 text-sm">(visible par le bénéficiaire)</span></label>
                            <textarea className="w-[84%] ml-[8%] rounded-lg border border-rayonblue mb-2 mt-1 px-2 py-1" rows={2} maxLength={500} name="user_message" value={formData.user_message} onChange={handleChange} placeholder="Ex : rendez-vous MDD reporté au 15 août pour prolonger la date de validité" />
                            <label className="ml-[8%] text-rayonblue">Message administrateur <span className="text-gray-400 text-sm">(interne, jamais visible par le bénéficiaire)</span></label>
                            <textarea className="w-[84%] ml-[8%] rounded-lg border border-amber-300 bg-amber-50 mb-2 mt-1 px-2 py-1" rows={2} maxLength={1000} name="admin_message" value={formData.admin_message} onChange={handleChange} placeholder="Ex : ajouter un paquet de riz sur la prochaine commande" />

                            <h2 className="ml-[4%] text-xl text-rayonorange font-bold my-2">Quotas : </h2>
                            <div className="grid md:grid-cols-2 gap-4 mx-[8%]">
                                <div className="relative group">
                                    <FormInput labelClassName="" className="w-[100%] h-[2.3rem] rounded-lg border border-rayonblue mb-2 mt-1" inputText="Poids max autorisé par mois (en grammes) ℹ️" name="weight_limit" value={formData.weight_limit} onChange={handleChange} isStarred={true} type='number' min="0" />
                                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10
                                                    bg-gray-800 text-white text-xs rounded-lg px-3 py-2 w-72 shadow-lg pointer-events-none">
                                        💡 Poids maximum de colis (produits + emballage) autorisé pour ce
                                        bénéficiaire par mois, exprimé en grammes.
                                        <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-800" />
                                    </div>
                                </div>
                                <div className="relative group">
                                    <FormInput labelClassName="" className="w-[100%] h-[2.3rem] rounded-lg border border-rayonblue mb-2 mt-1" inputText="Limite de commandes ℹ️" name="order_limit" value={formData.order_limit} onChange={handleChange} isStarred={true} type='number' min="0" />
                                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10
                                                    bg-gray-800 text-white text-xs rounded-lg px-3 py-2 w-72 shadow-lg pointer-events-none">
                                        💡 Nombre maximum de commandes que ce bénéficiaire peut passer
                                        par mois.
                                        <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-800" />
                                    </div>
                                </div>
                                <div className="relative group">
                                    <FormInput labelClassName="" className="w-[100%] h-[2.3rem] rounded-lg border border-rayonblue mb-2 mt-1" inputText="Limite de prix (€) ℹ️" name="price_limit" value={formData.price_limit} onChange={handleChange} isStarred={true} type='number' min="0" step="0.01" />
                                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10
                                                    bg-gray-800 text-white text-xs rounded-lg px-3 py-2 w-72 shadow-lg pointer-events-none">
                                        💡 Montant total maximum des commandes que ce bénéficiaire peut
                                        passer par mois, en euros.
                                        <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-800" />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <button onClick={handleSubmit} className='text-center-white bg-rayonorange w-[80%] ml-[10%] lg:w-[50%] lg:ml-[25%] mb-3 mt-10 h-[2rem]'>Ajouter</button>
                </div>
            </div>
        </div>
    );
}

export default AddUserModal;
