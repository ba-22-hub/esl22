import { supabase } from "@lib/supabaseClient"
import { displayNotification } from "@lib/displayNotification.jsx"

async function deleteUser(userId) {
  try {
    const { data, error } = await supabase.functions.invoke("delete-user", {
      body: { userId }
    })

    if (error) {
      displayNotification(
        "Erreur lors de la suppression de l'utilisateur avec ID : " + userId,
        error.message,
        "danger"
      )
      return null
    }

    if (!data?.success) {
      displayNotification(
        "Erreur lors de la suppression de l'utilisateur avec ID : " + userId,
        data?.error || "Erreur inconnue",
        "danger"
      )
      return null
    }

    displayNotification("Utilisateur supprimé", "ID : " + userId, "success")
    return true

  } catch (err) {
    displayNotification("Erreur inattendue", err.message, "danger")
    console.error("Erreur inattendue :", err)
    return null
  }
}

export { deleteUser }
