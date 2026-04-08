import { createClient } from '@supabase/supabase-js'

// Fonction pour récupérer les variables d'environnement avec fallback
const getEnvVar = (key) => {
    // 1. Variables injectées au runtime par Docker
    if (typeof window !== 'undefined' && window.RUNTIME_CONFIG && window.RUNTIME_CONFIG[key]) {
        return window.RUNTIME_CONFIG[key];
    }

    // 2. Variables Vite (développement local)
    if (import.meta.env[key]) {
        return import.meta.env[key];
    }

    throw new Error(`Variable d'environnement manquante: ${key}`);
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL')
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY')

export const supabase = createClient(supabaseUrl, supabaseKey)