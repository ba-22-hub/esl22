import { supabase } from './supabaseClient.js'
import { displayNotification } from '@lib/displayNotification.jsx'

/** * Lists PDF files in the Supabase storage bucket.
 * @returns {Promise<void>} Logs the list of files or an error if the operation fails
 */
async function listPDF() {
    const { data, error } = await supabase.storage
        .from('documents')
        .list('', { limit: 100 })

    if (error) {
        console.error('Erreur lors de la lecture du bucket :', error)
        displayNotification("Erreur lors de la lecture du bucket", error.message, "danger")
    } else {
        displayNotification("Fichiers dans le bucket :", data, "info")
    }
}

export { listPDF };
