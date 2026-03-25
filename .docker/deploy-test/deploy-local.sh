#!/bin/bash

set -e # Arrête le script à la moindre erreur

# Simulation de l'étape A : Authentification
# On utilise la variable d'environnement passée au conteneur
cat <<EOF > /root/.clasprc.json
$CLASP_TOKEN_JSON
EOF

# Simulation de l'étape B : Configuration
cat <<EOF > .clasp.json
{
    "scriptId":"$TEST_SCRIPT_ID",
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
clasp deploy --deploymentId "$TEST_DEPLOYMENT_ID" --description "Local manual deploy"