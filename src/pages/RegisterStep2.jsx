// Importing dependencies
import { useState, useEffect } from 'react';
import { displayNotification } from '@lib/displayNotification.jsx';

// Importing common components
import FormInput from "@common/FormInput"


// Importing the style

/**
 * The Register page for the first step.
 * @returns {React.ReactElement} RegisterStep1 component.
 */
function RegisterStep2({ data, onDataChange, onNext, onPrevious }) {
    const [formData, setFormData] = useState(data)

    useEffect(() => {
        onDataChange(formData);
    }, [formData]);

    // function to set the new formData value whenever the inputs are changed
    function handleChange(e) {
        const { name, value, type, checked } = e.target;

        if (type === "checkbox") {
            setFormData({
                ...formData,
                [name]: checked
            });
        } else if (name === "wageType") {
            setFormData(prevData => ({
                ...prevData,
                wageType: value,
                otherWage: '' // reset otherWage if another option selected
            }));
        } else {
            setFormData(prevData => ({
                ...prevData,
                [name]: value
            }));
        }
    }

    function handleSubmit(e) {
        e.preventDefault();

        displayNotification("Formulaire soumis avec succès", "", "success")

        onNext();

    }
    // function for the other wage text input
    function handleOtherWageChange(e) {
        setFormData(prevData => ({
            ...prevData,
            otherWage: e.target.value
        }));
    }

    return (
        <>
            <form onSubmit={handleSubmit} className='mlr-[8%] mt-[4rem]'>
                <div className='bg-[#A9F5EA] text-rayonblue w-[84%] ml-[8%] mb-10 p-4 rounded-lg'>
                    <h2 className='text-xl'>Pour pouvoir valider votre compte, vous devez</h2>
                    <p> - Prendre rendez vous avec un travailleur social qui doit vous transmettre une autorisation avec les
                        Informations suivantes : date de début et de fin de droit, la composition de la famille en indiquant le
                        nombre d’enfants et âges.</p><br />
                    <p>- Si vous êtes étudiant boursier, nous transmettre la copie du document. L’inscription sera déterminée en
                        fonction de votre échelon de bourse. La durée de validité sera l’année scolaire en cours.</p>
                </div>
                <div className='text-red w-[84%] ml-[8%] mb-10 p-4'>
                    Toutes les informations transmises sont strictement confidentielles, seulement accessibles aux personnes qui
                    valident le dossier et ne seront conservées que le temps de validité de votre inscription.
                </div>
                <div className="lg:w-[84%] w-[90%] ml-[5%] bg-gray p-4 rounded-lg lg:ml-[8%]">
                    <p className="">Pour nous envoyer vos documents, cliquer sur <a className='underline text-rayonblue'>Nous contacter</a>. Vous ne pourrez pas commander de
                        marchandises tant que votre dossier ne sera pas complet et validé par nos équipes. <br />
                        Un mail vous sera envoyé pour vous informer de votre inscription. <br /><br />
                        Les colis seront disponibles en point relais entre 3 et 12 jours après la commande. <br /><br />
                        Pour plus d’information, cliquer sur les conditions générales de vente en bas de page.</p>
                    <div className="flex items-center mt-2">
                        <input
                            className="w-[1.4rem] h-[1.4rem] rounded-lg border border-rayonblue"
                            type="checkbox"
                            name="readInfo"
                            checked={formData.readInfo}
                            onChange={handleChange}
                            required
                        />
                        <label className="text-rayonblue ml-2">J’ai lu et compris ces informations.</label><br />
                    </div>
                </div><br />

                <div className="ml-[5%] lg:ml-[8%] pl-4 flex items-center">
                    <input
                        className="w-[1.4rem] h-[1.4rem] rounded-lg border border-rayonblue"

                        type="checkbox"
                        name="acceptTerms"
                        checked={formData.acceptTerms}
                        onChange={handleChange}
                        required
                    />
                    <label className="text-rayonblue ml-2">J’ai lu et j'accepte les conditions d’utilisation.    </label>
                </div>
                <span href="" className='text-rayonlightblue text-sm ml-[20%]'>Lire les conditions d'utilisation</span> <br />

                <button type="submit" className='text-center-white w-[80%] ml-[10%] lg:w-[50%] lg:ml-[25%] mb-3 mt-[5%] h-[2rem] bg-rayonorange'>Valider</button> <br />
                <button onClick={onPrevious} className='text-center text-rayonorange bg-white w-[80%] ml-[10%] lg:w-[50%] lg:ml-[25%] mb-[4%] h-[2rem] rounded-lg border border-rayonorange '>⮪ Précédent</button>
            </form>
        </>
    )
}

export default RegisterStep2;