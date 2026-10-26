#!/usr/bin/env bash
CONTAINER=citrouilles-vs-zombies

if docker rm -f "$CONTAINER" >/dev/null 2>&1; then
    echo "Projet arrêté."
else
    echo "Aucun conteneur en cours."
fi
