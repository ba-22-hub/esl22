import { supabase } from '@lib/supabaseClient';

async function getPickupPoint(pudoId) {
    const { data, error } = await supabase.functions.invoke("get-pickup-by-id", {
        body: { pudoId },
    });

    if (error) throw error;

    // { id, name, address1, address2, city, zipCode }
    return data;
}

export { getPickupPoint };