# ========================================
# ÉTAPE 1: BUILD
# ========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copier package files
COPY package.json package-lock.json* ./

# Installer toutes les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Build
RUN npm run build

# ========================================
# ÉTAPE 2: PRODUCTION
# ========================================
FROM nginx:alpine AS production

# Nettoyer nginx
RUN rm -rf /usr/share/nginx/html/*

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Créer un script d'entrypoint pour injecter les variables au runtime
COPY docker/entrypoint.sh /docker-entrypoint.sh
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