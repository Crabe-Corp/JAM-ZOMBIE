# Lancer et déployer le projet

Le jeu charge des modules JS et des JSON avec `fetch` : il doit être servi par un serveur HTTP. Ouvrir `index.html` par double-clic ne marche pas.

## Avec Docker (recommandé)

Prérequis : Docker Engine installé et démarré.

```bash
./scripts/start.sh    # construit l'image et lance le conteneur
./scripts/stop.sh     # arrête et supprime le conteneur
```

Le jeu est alors sur http://localhost:8080.

`start.sh` supprime l'ancien conteneur `citrouilles-vs-zombies`, construit l'image de développement, puis lance le conteneur en arrière-plan (`-p 8080:8080`). Le dossier du projet est monté dans le conteneur et `live-server` recharge automatiquement la page lorsqu'un fichier change : il n'est donc pas nécessaire de reconstruire ou relancer Docker après chaque modification.

Pour une image statique de production, le `Dockerfile` standard reste disponible :

Commandes manuelles équivalentes :

```bash
docker build -t citrouilles-vs-zombies .
docker run -p 8080:80 citrouilles-vs-zombies
```

Le `Dockerfile` copie le dossier dans une image `nginx:alpine` (port 80). Le `Dockerfile.dev` utilise `live-server` (port 8080) et le montage du dossier local pour le développement.

### Sous WSL / Ubuntu

Si `docker` répond « failed to connect to the docker API » :

```bash
sudo apt-get update && sudo apt-get install -y docker.io
sudo systemctl enable --now docker     # ou: sudo service docker start
docker ps                              # doit répondre sans erreur
```

Si tu as un « permission denied », vérifie que ton utilisateur est dans le groupe `docker` (`id`), puis ouvre un nouveau terminal ou lance `newgrp docker`.

## Sans Docker

| Outil | Commande |
|---|---|
| npm | `npm start` (serve sur le port 8080) |
| Python | `python3 -m http.server 8080` |
| VS Code | extension Live Server → *Open with Live Server* |

Pendant le développement, un serveur local sans Docker recharge plus vite.

## Dépannage

| Symptôme | Cause probable |
|---|---|
| Écran « Oups » au lancement | page ouverte en `file://` ou JSON introuvable : utilise un serveur |
| Port 8080 déjà pris | change le port dans `scripts/start.sh` ou arrête l'autre programme |
| Pas de son | clique d'abord sur « Jouer », vérifie que `M` n'a pas coupé le son |
| Sprite absent | chemin faux dans le JSON : regarde l'avertissement dans la console (F12) |
