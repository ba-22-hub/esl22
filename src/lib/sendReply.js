// Importing dependencies
import sendMail from '@lib/sendMail.js';
import { displayNotification } from '@lib/displayNotification.jsx'

const templateID = 'template_t2ldyj5';

function sendReply({ email, name, reply }) {
    const templateParams = {
        email: email,
        ame: name,
        message: reply
    };

    return sendMail(templateID, templateParams)
        .then(response => {
            displayNotification("Réponse envoyée avec succès", response, "success")
            return response;
        })
        .catch(error => {
            displayNotification("Erreur lors de l'envoi de la réponse", error.message, "danger")
            throw error;
        });
}

export default sendReply;