#!/bin/bash
set -e

# build local si nécessaire (optionnel)
# ./build-docker.sh

# Utiliser --env-file pour charger proprement .env
# Map host 8080 -> container 8080 (corriger selon votre Dockerfile)
docker run -d --rm --name rayon22-local \
  --env-file .env \
  -p 8080:8080 \
  rayon22-app