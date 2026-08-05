 
import { supabase } from "@lib/supabaseClient"
import { displayNotification } from "@lib/displayNotification.jsx"


async function createUser(user) {

    // Un compte bénéficiaire classique démarre sans droits : l'activation se
    // fait ensuite via le cycle de validation habituel (justificatifs, etc.).
    // Un compte MDS (centre social) est créé directement par un admin et est
    // exclu du cycle de droits (handle_rights_lifecycle ne le traite pas) :
    // il doit donc être actif immédiatement, sinon il ne pourrait jamais
    // passer de commande.
    const newUser = {
        ...user,
        has_right: user.accountType === "mds",
    };

    try {
        const { data, error } = await supabase.functions.invoke("create-user", {
            body: { newUser }
        })

        if (error) {
            displayNotification(
                "Erreur lors de la création de l'utilisateur : " + user.firstName + " " + user.lastName,
                error.message,
                "danger"
            )
            return null
        }

        if (!data?.success) {
            displayNotification(
                "Erreur lors de la création de l'utilisateur : " + user.firstName + " " + user.lastName,
                data?.error || "Erreur inconnue",
                "danger"
            )
            return null
        }

        displayNotification("Utilisateur créé", "success")
        return true

    } catch (err) {
        displayNotification("Erreur inattendue", err.message, "danger")
        return null
    }

}

export { createUser }
