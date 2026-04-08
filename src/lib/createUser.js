import { supabase } from "@lib/supabaseClient"
import { displayNotification } from "@lib/displayNotification.jsx"


async function createUser(user) {

    const newUser = {
        ...user,
        has_right: false,
    };

    try {
        console.log("trying to inster user : ", newUser)
        const { data, error } = await supabase.functions.invoke("create-user", {
            body: { newUser }
        })

        if (error) {
            displayNotification(
                "Erreur lors de la création de l'utilisateur : " + user.name,
                error.message,
                "danger"
            )
            return null
        }

        if (!data?.success) {
            displayNotification(
                "Erreur lors de la création de l'utilisateur : " + user.name,
                data?.error || "Erreur inconnue",
                "danger"
            )
            return null
        }
        console.log(data)

        displayNotification("Utilisateur créé", "success")
        return true

    } catch (err) {
        displayNotification("Erreur inattendue", err.message, "danger")
        console.error("Erreur inattendue :", err)
        return null
    }

}

export { createUser }