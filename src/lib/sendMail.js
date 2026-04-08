import { supabase } from '@lib/supabaseClient';

export default async function sendMail({ email, templateId, params }) {
    try {
        const { data, error } = await supabase.functions.invoke("sendmail", {
            body: { to: email, templateId, params },
        });

        if (error) {
            throw new Error(error.message || "Erreur inconnue lors de l'envoi du mail");
        }

        return data;
    } catch (err) {
        console.error("Erreur sendMail:", err);
        throw err;
    }
}