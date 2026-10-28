// =============================================================================
// Formatage des poids et des montants pour l'affichage (format français).
// Les poids restent stockés et calculés en grammes ; seul l'affichage change.
// =============================================================================

/** 4300 → "4,3 kg" ; 250 → "0,25 kg" */
export const formatKg = (grams) =>
    `${(Number(grams || 0) / 1000).toLocaleString("fr-FR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
    })} kg`;

/** 12.4 → "12,40 €" */
export const formatEuro = (amount) =>
    Number(amount || 0).toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
    });
