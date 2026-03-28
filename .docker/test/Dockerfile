# Utilise l'image officielle Node 18 (comme dans le workflow)
FROM node:18-slim

# Installation de clasp globalement
RUN npm install -g @google/clasp

# Création du répertoire de travail
WORKDIR /

# On copie le contenu de votre repo dans le conteneur
COPY ./app/src ./app/src

# On rend le script de déploiement exécutable (voir étape suivante)
COPY .github/scripts/deploy.sh .
RUN chmod +x /deploy.sh

ENTRYPOINT ["/bin/bash", "/deploy.sh"]