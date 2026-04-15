// Importing dependencies
import sendMail from '@lib/sendMail.js';
import { displayNotification } from '@lib/displayNotification.jsx'

const templateID = 'template_k4m4rco';

function sendNotification({ email, name }) {
    const templateParams = {
        email: email,
        name: name,
    };

    return sendMail(templateID, templateParams)
        .then(response => {
            displayNotification("Notification envoyée avec succès", response, "success")
            return response;
        })
        .catch(error => {
            displayNotification("Erreur lors de l'envoi de la notification", error.message, "danger")
            throw error;
        });
}

export default sendNotification;