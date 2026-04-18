// Importing dependencies
import { supabase } from './supabaseClient.js';
import { displayNotification } from '@lib/displayNotification.jsx'

/** * Uploads a PDF file to Supabase storage.
 * @param {File} file - The PDF file to upload.
 * @param {string} fileName - The name of the file to be uploaded.
 * @param {string} folder - The folder in the Supabase bucket where the file will be stored.
 * @returns {Promise<{ success: boolean, data?: object, error?: object }>} - A promise that resolves to an object indicating success or failure of the upload operation.
 */
async function uploadPDF(file, fileName, folder) {

    const fullPath = `${folder}/${fileName}`;

    // 1. Uploads the file to Supabase private bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents') // bucket name
        .upload(fullPath, file, {
            cacheControl: '3600',
            upsert: true
        });

    if (uploadError) {
        displayNotification("Erreur lors de l'envoi de l'upload du fichier " + fileName, uploadError.message, "danger")
        return { success: false, error: uploadError };;
    }

    displayNotification("Upload terminé avec succès", `Chemin : ${uploadData.path}`, "success")
    return { success: true, data: uploadData };
}

export { uploadPDF };
