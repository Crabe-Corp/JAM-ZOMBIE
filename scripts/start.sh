#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

IMAGE=citrouilles-vs-zombies
CONTAINER=citrouilles-vs-zombies
PORT=8080

docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker build -t "$IMAGE" .
docker run -d --name "$CONTAINER" -p "$PORT":80 "$IMAGE"

echo "Projet lancé : http://localhost:$PORT"
