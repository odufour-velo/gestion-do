#!/bin/bash

set -e # Arrête le script à la moindre erreur

cd app

# Simulation de l'étape A : Authentification
# On utilise la variable d'environnement passée au conteneur
cat <<EOF > ~/.clasprc.json
$CLASP_TOKEN_JSON
EOF

# Simulation de l'étape B : Configuration
cat <<EOF > .clasp.json
{
    "scriptId":"$SCRIPT_ID",
    "rootDir":"./src",
    "scriptExtensions":[".js",".gs"],
    "htmlExtensions":[".html"],
    "jsonExtensions":[".json"],
    "filePushOrder":["src/Server/Utils.js","src/App.js"],
    "skipSubdirectories":false,
    "projectId":"detailsorganisation"
}
EOF

clasp push --force
clasp deploy --deploymentId "$DEPLOYMENT_ID" --description "Deploy $DEPLOYMENT_SHA"