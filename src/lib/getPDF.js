import { supabase } from './supabaseClient.js';
import { displayNotification } from '@lib/displayNotification.jsx'

/**
 * Generates a signed URL for a PDF file stored in Supabase storage.
 * @param {string} fileName - The name of the PDF file in the storage bucket
 * @param {number} expiresInSeconds - The duration in seconds for which the signed URL will be valid
 * @returns {Promise<string>} The signed URL for the PDF file or an error if the operation fails
 */
async function getSignedPDFUrl(fileName, expiresInSeconds = 60) {
    // Access the Supabase storage and create a signed URL for the specified file
    const { data, error } = await supabase
        .storage
        .from('documents')
        .createSignedUrl(fileName, expiresInSeconds)

    // Check if there was an error creating the signed URL
    if (error) {
        displayNotification("Erreur lors de la création de l’URL signée", error.message, "danger")
        throw error
    }

    displayNotification("URL signée créée avec succès", data.signedUrl, "success")
    // Return the signed URL
    return data.signedUrl
}

export { getSignedPDFUrl };
