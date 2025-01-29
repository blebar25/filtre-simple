#!/bin/bash

# Créer le dossier model s'il n'existe pas
mkdir -p model

# Télécharger les fichiers du modèle
curl -L https://github.com/infinitered/nsfwjs/raw/master/example/nsfw_demo/public/model/model.json -o model/model.json
curl -L https://github.com/infinitered/nsfwjs/raw/master/example/nsfw_demo/public/model/group1-shard1of1.bin -o model/group1-shard1of1.bin
