# Dockerfile sécurisé pour l'application Rayon22 
# Variables d'environnement injectées au RUNTIME (pas au build)

# ========================================
# ÉTAPE 1: BUILD (Construction de l'application)
# ========================================
FROM node:20-alpine AS builder

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers de configuration des dépendances
COPY package.json package-lock.json* ./

# Installer les dépendances
RUN npm install

# Copier tout le code source de l'application
COPY . .

# Construire l'application SANS variables d'environnement
# Les fichiers seront modifiés au runtime
RUN npm run build

# ========================================
# ÉTAPE 2: PRODUCTION (Serveur web avec injection runtime)
# ========================================
FROM nginx:alpine AS production

# Copier les fichiers construits depuis l'étape de build
COPY --from=builder /app/dist /usr/share/nginx/html

# Créer un script d'entrypoint pour injecter les variables au runtime
COPY docker/entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Créer la configuration Nginx pour les applications React SPA
RUN echo 'server { \
    listen 8080; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
    \
    error_page 404 /index.html; \
}' > /etc/nginx/conf.d/default.conf

# Exposer le port 8080 pour l'accès web
EXPOSE 8080

# Utiliser l'entrypoint que Scaleway attend
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon", "off"]