// Importing dependencies
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom";
import { supabase } from '@lib/supabaseClient.js';
import { useAuthor } from "@context/AuthorContext.jsx";
import { uploadPDF } from '@lib/sendPDF.js'
import { displayNotification } from '@lib/displayNotification.jsx';

// Importing common components
import Loading from "@common/Loading.jsx";

/** * The Account page.
 * @returns {React.ReactElement} Account component.
 */
function Account() {

    const [editing, setEditing] = useState(false)
    const [clientEdit, setClientEdit] = useState(null)
    const [client, setClient] = useState(null)
    const [activeRequests, setActiveRequest] = useState(false)
    const { user, logout, isAdmin, loading, checkIsAdmin } = useAuthor()



    // options for the radio buttons when the edit mod is enable
    const genderOptions = ["Homme", "Femme", "Autre"]
    const situationOptions = ["Employé", "Sans emploi", "Étudiant", "Retraité"]
    const wageOptions = ["Salaire", "Bourse", "Aide", "Autre"]

    let navigate = useNavigate()

    useEffect(() => {
        if (!user) return; // to avoid error in the console
        const fetchUserData = async () => {
            try {
                // retrieving user's data
                const uid = user.id
                const { data: userdata, error: dberror } = await supabase
                    .from('User')
                    .select('*')
                    .eq('id', uid)
                    .single();

                if (dberror && dberror.code !== 'PGRST116') {
                    displayNotification("Erreur lors de la vérification de l'utilisateur", dberror.message, "danger")
                    return;
                }

                setClientEdit(userdata);
                setClient(userdata);
            } catch (error) {
                displayNotification("Erreur inattendue", error.message, "danger")
            }
        }
        const checkRequest = async () => {
            try {
                const { data, error: dberror } = await supabase
                    .from('Requests')
                    .select('id') // optimisation
                    .eq('user_id', user.id)
                    .limit(1); // no need to reseach several requests

                if (dberror && dberror.code !== 'PGRST116') {
                    displayNotification("Erreur lors de la vérification des requêtes", dberror.message, "danger")
                    return;
                }
                setActiveRequest(data.length > 0)
            } catch (error) {
                displayNotification("Erreur inattendue", error.message, "danger")
            }
        }
        checkIsAdmin(user.id) // needed otherwise the update of 'isAdmin' isn't fast enough
            .then(fetchUserData())
            .then(() => checkRequest())
    }, [loading])



    function handleChange(e) {
        const { name, value } = e.target;
        if (name == "wageType" && value == "Autre") {
            const other = window.prompt("Quel est votre type de salaire ?");
            if (other) {
                setClientEdit(prev => ({
                    ...prev,
                    [name]: value,
                    otherWage: other
                }));

            }
        } else {
            setClientEdit(prev => ({
                ...prev,
                [name]: value
            }))
        }
    }

    function handleCancel() {
        setClientEdit(client)
        setEditing(false)
    }

    // handle the edit of the personnal informations
    async function handleEdit(e) {
        e.preventDefault(); // Empêche le rechargement de la page

        try {
            const { data, error } = await supabase
                .from('User') // Table User
                .update(clientEdit) // update with the 
                .eq('id', clientEdit.id) // Filtre par l'ID du client
                .select(); // Optionnel : pour récupérer les données mises à jour

            if (error) {
                throw error;
            }

            setEditing(false)
            // alert("Les informations ont été modifiées avec succès")
            displayNotification("Informations mises à jour avec succès", "", "success")
        } catch (err) {
            //alert("Erreur lors de l'ajout dans la base de donnée")
            displayNotification("Erreur lors de la mise à jour des informations", err.message, "danger")
        }
    }


    function handleDeconnection() {
        logout()
        navigate('/login')
    }

    // on factorise l'élément le plus volumineux 
    const renderField = (label, fieldName, minWidth = 180) => (
        <div className="flex flex-row items-center text-rayonblue mb-2 text-sm lg:text-base">
            <label className="font-semibold min-w-[180px] whitespace-nowrap lg:mr-4 mr-0">{label} :</label>
            <div className="flex-1">
                {editing ? (
                    <input
                        className="border border-rayonorange rounded-lg w-full text-rayonorange pl-2 h-[1.8rem]"
                        name={fieldName}
                        value={clientEdit[fieldName]}
                        onChange={handleChange}
                    />
                ) : (
                    <p className="text-rayonblue">{clientEdit[fieldName]}</p>
                )}
            </div>
        </div>
    );


    const renderSelect = (label, fieldName, options) => (
        <div className="flex flex-row items-center text-rayonblue mb-2 text-sm lg:text-base">
            <label className="font-semibold min-w-[180px] whitespace-nowrap lg:mr-4 mr-0">{label} :</label>
            <div className="flex-1">
                {editing ? (
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-rayonorange bg-white focus:outline-none focus:ring-2 focus:ring-rayonorange"
                        name={fieldName}
                        value={clientEdit[fieldName]}
                        onChange={handleChange}
                    >
                        <option value="">Sélectionner...</option>
                        {options.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                ) : (
                    <p className="text-rayonblue">{clientEdit[fieldName]}</p>
                )}
            </div>
        </div>
    );



    return (
        <>
            {!clientEdit || loading ? (
                <Loading />
            ) : (
                isAdmin ? (
                    <>
                        <div className="w-full lg:max-w-5xl mx-auto p-8 bg-white rounded-2xl shadow-sm mb-16 flex flex-col items-center text-center">
                            <p className="text-rayonblue text-4xl md:text-5xl">Ce compte est administrateur</p>
                            <br />
                            <p>Il ne possède donc par conséquent pas de données personnelles</p>

                            <button
                                className="text-white bg-rayonorange w-full md:w-1/3 mb-3 mt-10 h-14"
                                onClick={() => navigate('/admin/users')}
                            >
                                Accéder à l'application administrateur
                            </button>

                            <button
                                className="text-white bg-red w-full md:w-1/3 mb-3 mt-2 h-10"
                                onClick={handleDeconnection}
                            >
                                Se déconnecter
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="w-full max-w-5xl mx-auto p-8 bg-white rounded-2xl shadow-sm mb-16">
                        <h1 className="text-center text-rayonblue text-3xl md:text-5xl leading-tight font-bold">
                            Bienvenue sur votre Espace Utilisateur
                        </h1>
                        <button
                            onClick={handleDeconnection}
                            className="text-white bg-red rounded-lg w-full md:w-40 mt-4 ml-auto block"
                        >
                            ⏼ Déconnexion
                        </button>

                        <div className="flex flex-col md:flex-row gap-4 mt-6">
                            <div className="border border-rayonblue rounded-lg p-4 flex-1 min-w-0">
                                <h2 className="text-rayonblue text-xl font-semibold mb-4">État civil</h2>
                                {renderField("Nom", "lastName")}
                                {renderField("Prénom", "firstName")}
                                {renderSelect("Genre", "gender", genderOptions)}
                            </div>

                            <div className="border border-rayonblue rounded-lg p-4 flex-1 min-w-0">
                                <h2 className="text-rayonblue text-xl font-semibold mb-4">Contact</h2>
                                {renderField("E-mail", "email")}
                                {renderField("Téléphone", "phone")}
                                {renderField("Adresse", "address")}
                                {renderField("Précisions", "addAddress")}
                                {renderField("Ville", "city")}
                                {renderField("Code postal", "postalCode")}
                            </div>
                        </div>

                        <div className="border border-rayonblue rounded-lg p-4 mt-6 w-full max-w-full">
                            <h2 className="text-rayonblue text-xl font-semibold mb-4">Déclarations</h2>
                            {renderSelect("Situation", "situation", situationOptions)}
                            {renderField("Quotient familial (CAF)", "quotient")}
                            {renderSelect("Type de salaire", "wageType", wageOptions)}
                        </div>

                        {/* rights */}
                        <div className="border border-rayonblue rounded-lg p-4 mt-6 w-full max-w-full overflow-x-auto">
                            <h2 className="text-rayonblue text-xl font-semibold mb-4">Vos droits</h2>
                            <div className="grid grid-cols-[minmax(0,300px)_minmax(0,120px)] gap-x-3 text-rayonblue text-sm lg:text-base gap-y-2">
                                {/* contenu inchangé */}
                                <label className="font-semibold">Date de validité du compte :</label>
                                <p className="text-right">{client.has_right ? client.end_right : "Compte invalide"}</p>

                                <label className="font-semibold">Poids maximum mensuel :</label>
                                <p className="text-right">{client.weight_limit === null ? "Pas de limite" : `${(client.weight_limit.toFixed(2) / 1000)} kg`}</p>

                                <label className="font-semibold">{client.weight_limit === null ? "Poids déjà acheté ce mois-ci :" : "Poids restant ce mois-ci :"}</label>
                                <p className="text-right">{client.weight_limit === null ? `${(client.current_weight.toFixed(2) / 1000)} kg` : `${((client.weight_limit - client.current_weight).toFixed(2) / 1000)} kg`}</p>

                                <label className="font-semibold">Budget maximum mensuel :</label>
                                <p className="text-right">{client.price_limit === null ? "Pas de limite" : `${client.price_limit.toFixed(2)} €`}</p>

                                <label className="font-semibold">{client.price_limit === null ? "Budget déjà dépensé ce mois-ci :" : "Budget restant ce mois-ci :"}</label>
                                <p className="text-right">{client.price_limit === null ? `${client.current_price.toFixed(2)} €` : `${(client.price_limit - client.current_price).toFixed(2)} €`}</p>

                                <label className="font-semibold">Nombre de commandes maximum :</label>
                                <p className="text-right">{client.order_limit === null ? "Pas de limite" : `${client.order_limit}`}</p>

                                <label className="font-semibold">{client.order_limit === null ? "Nombre de commandes déjà effectuées ce mois-ci :" : "Commandes restantes ce mois-ci :"}</label>
                                <p className="text-right">{client.order_limit === null ? `${client.current_order}` : `${client.order_limit - client.current_order}`}</p>
                            </div>
                        </div>

                        {!editing ? (
                            <button
                                className="text-white text-center bg-rayonorange w-full md:w-1/3 mb-3 mt-10 h-10"
                                onClick={() => setEditing(true)}
                            >
                                Modifier 🖉
                            </button>
                        ) : (
                            <div className="flex flex-col md:flex-row gap-2">
                                <button
                                    className="text-white text-center bg-rayonorange w-full md:w-1/3 mb-3 mt-10 h-10"
                                    onClick={handleCancel}
                                >
                                    Annuler ✖
                                </button>
                                <button
                                    className="text-rayonorange text-center bg-white w-full md:w-1/3 mb-3 mt-2 lg:mt-10 h-10 border border-rayonorange"
                                    onClick={handleEdit}
                                >
                                    Valider 🗸
                                </button>
                            </div>
                        )}
                    </div>
                )
            )}
        </>
    )


}

export default Account;