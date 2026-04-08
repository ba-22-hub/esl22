import { loadStripe } from '@stripe/stripe-js';

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

export const stripePromise = loadStripe(getEnvVar('VITE_STRIPE_PUBLIC_KEY'));