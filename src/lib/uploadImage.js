import { displayNotification } from '@lib/displayNotification.jsx'
import { supabase } from './supabaseClient.js';

// helper to normalize image names
//
// Supabase Storage n'accepte qu'un jeu restreint de caractères dans les clés
// d'objet. Un nom tel que "Use AI Image Jun 16, 2026, 11_13_33.png" (espaces,
// virgules) était accepté à l'upload mais devenait impossible à relire
// ensuite, l'URL publique générée ne correspondant plus à la clé stockée.
//
// On produit donc une clé sûre : suppression des accents, passage en
// minuscules, remplacement de tout caractère non alphanumérique par un tiret,
// et conservation de l'extension.
function normalizeFileName(fileName) {
  if (!fileName) return '';

  const lastDot = fileName.lastIndexOf('.');
  const hasExtension = lastDot > 0;
  const base = hasExtension ? fileName.slice(0, lastDot) : fileName;
  const extension = hasExtension ? fileName.slice(lastDot + 1) : '';

  const clean = (value) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')   // accents
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')       // tout le reste -> tiret
      .replace(/^-+|-+$/g, '');          // pas de tiret en début/fin

  const cleanBase = clean(base) || 'image';
  const cleanExtension = clean(extension);

  return cleanExtension ? `${cleanBase}.${cleanExtension}` : cleanBase;
}

async function uploadImage(image, imageName, bucket = 'images') {
  // Uploads the image to Supabase public bucket
  if (imageName) {
    const normalizedName = normalizeFileName(imageName);

    const { data: uploadData, error: uploadError } =
      await supabase.storage.from(bucket).upload(
        normalizedName, image, { upsert: true });

    if (uploadError) {
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
