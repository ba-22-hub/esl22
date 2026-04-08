#!/bin/sh

echo "🔧 Injection des variables d'environnement au runtime..."

# Debug: afficher toutes les variables VITE_*
echo "📋 Variables d'environnement détectées :"
env | grep VITE_ | sort

# Debug: afficher les arguments passés
echo "📋 Arguments reçus: $@"

# Vérifier que les variables obligatoires sont définies avec des messages plus détaillés
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ Erreur: VITE_SUPABASE_URL est requis."
    echo "📋 Variables disponibles :"
    env | grep -E "(VITE_|SUPABASE)" || echo "Aucune variable VITE_ trouvée"
    exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Erreur: VITE_SUPABASE_ANON_KEY est requis."
    exit 1
fi

if [ -z "$VITE_STRIPE_PUBLIC_KEY" ]; then
    echo "❌ Erreur: VITE_STRIPE_PUBLIC_KEY est requis."
    exit 1
fi

echo "✅ Toutes les variables sont présentes"

# Créer un fichier de configuration JavaScript qui sera chargé par l'application
echo "📝 Création du fichier runtime-config.js..."
cat > /usr/share/nginx/html/runtime-config.js << EOF
// Configuration injectée au runtime
window.RUNTIME_CONFIG = {
  VITE_SUPABASE_URL: '$VITE_SUPABASE_URL',
  VITE_SUPABASE_ANON_KEY: '$VITE_SUPABASE_ANON_KEY',
  VITE_SUPABASE_SERVICE_ROLE_KEY: '$VITE_SUPABASE_SERVICE_ROLE_KEY',
  VITE_STRIPE_PUBLIC_KEY: '$VITE_STRIPE_PUBLIC_KEY'
};
EOF

echo "✅ Fichier runtime-config.js créé"

# Injecter le script dans index.html s'il n'est pas déjà présent
if ! grep -q "runtime-config.js" /usr/share/nginx/html/index.html; then
    echo "📝 Injection du script dans index.html..."
    sed -i 's|</head>|<script src="/runtime-config.js"></script></head>|' /usr/share/nginx/html/index.html
    echo "✅ Script injecté dans index.html"
else
    echo "✅ Script déjà présent dans index.html"
fi

echo "🚀 Démarrage de nginx..."

# Si aucun argument n'est passé, utiliser la commande par défaut
if [ $# -eq 0 ]; then
    echo "📋 Aucun argument, lancement de nginx par défaut"
    exec nginx -g "daemon off;"
else
    echo "📋 Lancement avec arguments: $@"
    exec "$@"
fi