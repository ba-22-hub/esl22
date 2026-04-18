import { supabase } from "@lib/supabaseClient";
import { displayNotification } from '@lib/displayNotification.jsx'

async function patchUser(userId, newUser) {
    try {
        const { data, error } = await supabase
            .from('User') // Nom de la table
            .update(newUser) // Colonnes à modifier
            .eq('id', userId) // Sélectionne le bon utilisateur
            .select(); // Renvoie les données mises à jour

        if (error) {
            displayNotification("Erreur lors de la mise à jour de l'utilisateur " + userId, error.message, "danger")
            return null;
        }

        if (!data || data.length === 0) {
            displayNotification("Aucun utilisateur trouvé avec l'ID :", userId, "warning")
            return null;
        }

        displayNotification("Utilisateur mis à jour", `${data[0].firstName} ${data[0].lastName}`, "success")
        return data[0];
    } catch (err) {
        displayNotification("Erreur inattendue", err.message, "danger")
        return null;
    }
}
export { patchUser }