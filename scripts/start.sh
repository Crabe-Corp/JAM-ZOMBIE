#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

IMAGE=citrouilles-vs-zombies
CONTAINER=citrouilles-vs-zombies
PORT=8080

docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker build -f Dockerfile.dev -t "$IMAGE" .
docker run -d --name "$CONTAINER" -p "$PORT":8080 \
    -e CHOKIDAR_USEPOLLING=true \
    -v "$(pwd)":/app \
    "$IMAGE"

echo "Projet lancé : http://localhost:$PORT"
echo "Les changements de fichiers rechargent automatiquement la page."
