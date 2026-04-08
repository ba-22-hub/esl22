import { displayNotification } from '@lib/displayNotification.jsx'
import { supabase } from './supabaseClient.js';

// helper to normalize image names
function normalizeFileName(fileName) {
  if (!fileName) return '';
  return fileName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function uploadImage(image, imageName, bucket = 'images') {
  // Uploads the image to Supabase public bucket
  if (imageName) {
    const normalizedName = normalizeFileName(imageName);
    console.log('Nom normalisé:', normalizedName);

    const { data: uploadData, error: uploadError } =
      await supabase.storage.from(bucket).upload(
        normalizedName, image, { upsert: true });

    if (uploadError) {
      console.error(
        'Erreur lors de l\'upload de l\'image ' + normalizedName + ' :',
        uploadError.message);
      displayNotification('Erreur lors de l\'upload de l\'image ' + normalizedName, uploadError.message, 'danger')
      return { success: false, error: uploadError };
    }

    displayNotification('Upload de l\'image ' + normalizedName + ' terminé avec succès', "", 'success')
    return { success: true, data: uploadData };
  } else {
    displayNotification('Erreur lors de l\'upload de l\'image', 'Nom de fichier manquant', 'danger')
    return { success: false, error: 'No image name provided' };
  }
}

export { uploadImage, normalizeFileName };