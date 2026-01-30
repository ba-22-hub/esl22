# ========================================
# ÉTAPE 1: BUILD (Construction de l'application)
# ========================================
FROM node:20-alpine AS builder

WORKDIR /app

# 🔧 Copier UNIQUEMENT package.json d'abord (cache des dépendances)
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# 🔧 Copier le code source APRÈS (invalidé à chaque changement)
COPY . .

# 🔧 Nettoyer le cache npm et construire
RUN npm cache clean --force && \
    npm run build

# ========================================
# ÉTAPE 2: PRODUCTION
# ========================================
FROM nginx:alpine AS production

# 🔧 Nettoyer le répertoire par défaut de nginx
RUN rm -rf /usr/share/nginx/html/*

# Copier les fichiers construits
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier l'entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Configuration Nginx
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

EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]