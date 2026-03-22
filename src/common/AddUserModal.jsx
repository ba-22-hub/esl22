import { useState } from "react";
import { createUser } from "@lib/createUser.js"

import FormInput from "@common/FormInput.jsx"


function AddUserModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const [length, setLength] = useState('')
    const [formData, setFormData] = useState({
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
        weight_min_limit: '',
        weight_limit: '',
        order_limit: '',
        price_limit: ''
    })

    function handleChange(e) {
        const { name, value } = e.target;

        if (name == "length") {
            setLength(parseInt(value));
            setFormData({
                ...formData,
                end_right: new Date(new Date(formData.start_right).getTime() + (parseInt(value) * 86400000)).toISOString().slice(0, 10),
            })
            setLength(value)
        } else {
            setFormData(prevData => ({
                ...prevData,
                [name]: value
            }));
        }

    }

    function handleSubmit() {
        console.log(formData)
        createUser(formData)
        onClose()
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
                    <FormInput labelClassName="ml-[8%]" className="w-[84%] h-[2.3rem] ml-[8%] rounded-lg border border-rayonblue mb-2 mt-1" inputText="Rue :" name="address" value={formData.street} onChange={handleChange} isStarred={true} />
                    {/* add addresse */}
                    <FormInput labelClassName="ml-[8%]" className="w-[84%] h-[2.3rem] ml-[8%] rounded-lg border border-rayonblue mb-2 mt-1" inputText="Complément d'adresse :" name="addAddress" value={formData.addr} onChange={handleChange} />
                    {/* City  */}
                    <FormInput labelClassName="ml-[8%]" className="w-[84%] h-[2.3rem] ml-[8%] rounded-lg border border-rayonblue mb-2 mt-1" inputText="Commune :" name="city" value={formData.region} onChange={handleChange} isStarred={true} />
                    {/* Post code */}
                    <FormInput labelClassName="ml-[8%]" className="w-[84%] h-[2.3rem] ml-[8%] rounded-lg border border-rayonblue mb-2 mt-1" inputText="Code postal :" name="postalCode" value={formData.postalCode} onChange={handleChange} isStarred={true} type='number' />
                    {/* length */}
                    <FormInput labelClassName="ml-[8%]" className="w-[84%] h-[2.3rem] ml-[8%] rounded-lg border border-rayonblue mb-2 mt-1" inputText="Durée de validité (jours)" name="length" value={length} onChange={handleChange} isStarred={true} type='number' />

                    <h2 className="ml-[4%] text-xl text-rayonorange font-bold my-2">Quotas : </h2>
                    <div className="grid md:grid-cols-2 gap-4 mx-[8%]">
                        <FormInput labelClassName="" className="w-[100%] h-[2.3rem] rounded-lg border border-rayonblue mb-2 mt-1" inputText="Min poids (kg)" name="weight_min_limit" value={formData.weight_min_limit} onChange={handleChange} isStarred={true} type='number' />
                        <FormInput labelClassName="" className="w-[100%] h-[2.3rem] rounded-lg border border-rayonblue mb-2 mt-1" inputText="Max poids (kg)" name="weight_limit" value={formData.weight_limit} onChange={handleChange} isStarred={true} type='number' />
                        <FormInput labelClassName="" className="w-[100%] h-[2.3rem] rounded-lg border border-rayonblue mb-2 mt-1" inputText="Limite de commandes" name="order_limit" value={formData.order_limit} onChange={handleChange} isStarred={true} type='number' />
                        <FormInput labelClassName="" className="w-[100%] h-[2.3rem] rounded-lg border border-rayonblue mb-2 mt-1" inputText="Limite de prix (€)" name="price_limit" value={formData.price_limit} onChange={handleChange} isStarred={true} type='number' />

                    </div>

                    <button onClick={handleSubmit} className='text-center-white bg-rayonorange w-[80%] ml-[10%] lg:w-[50%] lg:ml-[25%] mb-3 mt-10 h-[2rem]'>Ajouter</button>
                </div>
            </div>
        </div>
    );
}

export default AddUserModal;