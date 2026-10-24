# 🎃 Citrouilles vs Zombies

Tower defense Halloween dans le navigateur, inspiré du genre « plantes contre zombies ».
HTML5 Canvas + JavaScript, **aucune installation, aucune compilation**.

> Le nom, les personnages et les visuels sont des placeholders à remplacer par les vôtres
> (n'utilisez pas les images du jeu original, elles sont protégées).

---

## Lancer le jeu

Le jeu doit être servi par un petit serveur local (un double-clic sur `index.html` ne marche pas, à cause des modules JS et du chargement des JSON).

**Avec Docker** (prérequis : Docker démarré) :

```bash
./scripts/start.sh   # construit l'image et lance le jeu sur http://localhost:8080
./scripts/stop.sh    # arrête le jeu
```

**Sans Docker**, au choix :

| Outil | Commande |
|---|---|
| Node | `npm start` ou `npx serve .` |
| Python | `python3 -m http.server 8080` puis ouvrir http://localhost:8080 |
| VS Code | extension **Live Server** → clic droit sur `index.html` → *Open with Live Server* |

## Comment jouer

Des zombies arrivent par la droite sur 5 lignes. Pose des plantes avec tes bonbons 🍬 pour protéger la maison à gauche. Gagne en survivant à toutes les vagues.

| Action | Commande |
|---|---|
| Choisir une plante | clic sur la carte, ou `1` `2` `3` |
| Poser | clic sur une case libre |
| Pelle | `S` |
| Ramasser un bonbon | clic dessus |
| Pause / son | `P` / `M` |

## Documentation

Le détail est dans le dossier **[docs/](docs/README.md)** : [règles](docs/gameplay.md), [architecture](docs/architecture.md), [format des données](docs/donnees.md), [API interne](docs/api.md), [sprites et sons](docs/contenu.md), [déploiement](docs/deploiement.md).

**Console du navigateur (F12)** pour tester vite :

```js
game.spawnZombie('dracula', 2)   // fait apparaître un boss sur la ligne 3
state.resources = 9999           // bonbons illimités
state                            // tout l'état de la partie
```

Mettez `DEBUG = true` dans `src/config.js` pour afficher les compteurs d'entités.

---

## Qui fait quoi

Chacun travaille **dans ses propres fichiers** pour éviter les conflits Git.

| Rôle | Dossiers / fichiers | Résumé |
|---|---|---|
| **A — Moteur et gameplay** | `src/engine/` | boucle de jeu, grille, plantes, zombies, projectiles, vagues, victoire/défaite |
| **B — Interface et économie** | `src/ui/`, `index.html`, `style.css` | cartes, placement, pelle, bonbons, HUD, menus |
| **C — Contenu et ambiance** | `data/`, `assets/`, `src/content/` | stats, niveaux, sprites, décor, sons, pitch |
| **Partagés** (prévenir avant de modifier) | `src/main.js`, `src/config.js`, `src/state.js`, `src/events.js` | les contrats entre vous trois |

La liste détaillée des tâches est dans **[TACHES.md](TACHES.md)**. Les `TODO(A)`, `TODO(B)`, `TODO(C)` dans le code indiquent où continuer.

```
citrouilles-vs-zombies/
├── index.html            B
├── style.css             B
├── scripts/              start.sh, stop.sh (Docker)
├── docs/                 documentation
├── data/                 C   plants.json, zombies.json, levels.json
├── assets/
│   ├── sprites/          C   images PNG
│   └── audio/            C   sons mp3/ogg
└── src/
    ├── main.js           ★   point d'entrée, relie tout
    ├── config.js         ★   taille de la grille et du canvas
    ├── state.js          ★   état partagé
    ├── events.js         ★   bus d'événements
    ├── engine/           A   game.js, grid.js, waves.js, entities/
    ├── ui/               B   cards.js, economy.js, hud.js, menu.js
    └── content/          C   assets.js (sprites + décor), audio.js
```

---

## Les 3 contrats entre les rôles

### 1. Format des données (C écrit, A lit, B affiche)

**`data/plants.json`** — une entrée par plante :

| Champ | Type | Sens |
|---|---|---|
| `id` | texte | identifiant unique, sans espace |
| `nom`, `description` | texte | affichés sur la carte (infobulle) |
| `emoji` | texte | affiché tant qu'il n'y a pas de sprite |
| `sprite` | chemin | *(optionnel)* image sur le terrain, ex. `assets/sprites/citrouille.png` |
| `icone` | chemin | *(optionnel)* image sur la carte |
| `type` | `tireur` · `producteur` · `mur` | comportement |
| `cout` | nombre | prix en bonbons |
| `vie` | nombre | points de vie |
| `recharge` | secondes | délai avant de pouvoir en reposer une |
| `rechargeInitiale` | secondes | délai au début de la partie |
| `degats`, `cadence` | nombre, secondes | *tireur* : dégâts par tir, temps entre deux tirs |
| `vitesseProjectile`, `couleurProjectile` | px/s, couleur | *tireur* |
| `production`, `intervalleProduction` | nombre, secondes | *producteur* : bonbons produits et fréquence |

**`data/zombies.json`** : `id`, `nom`, `emoji`, `sprite` *(opt.)*, `vie`, `vitesse` (px/s, une case = 90 px), `degatsParSeconde`, `taille` *(opt., px, 78 par défaut)*.

**`data/levels.json`** : `ressourcesDepart`, `intervalleCiel` (un bonbon tombe toutes les N secondes), `valeurBonbonCiel`, et `vagues` :

```json
{ "temps": 55, "finale": false, "zombies": [
    { "type": "basique", "nombre": 4, "intervalle": 6, "decalage": 0, "ligne": 2 }
] }
```

`temps` = seconde de départ de la vague · `intervalle` = secondes entre deux zombies du groupe · `decalage` = retard du groupe · `ligne` = 0 à 4 *(optionnel, au hasard sinon)*.

### 2. L'état partagé — `src/state.js`

Tout le monde lit tout. A écrit `status`, `plants`, `zombies`, `projectiles`, `wave`, `time`. B écrit `resources`, `selectedCard`, `cooldowns`.

### 3. API et événements

**A expose** (dans `src/engine/game.js`) : `placePlant(typeId, row, col)` → `true/false`, `removePlant(row, col)`, `spawnZombie(typeId, row)`, `togglePause()`, `addUpdater(fn)`, `addLayer(fn)`.
B gère le paiement : il vérifie le coût, appelle `placePlant`, puis débite si la plante a été posée.

**Événements** (liste complète dans `src/events.js`) : `gameStart`, `plantPlaced`, `plantDied`, `zombieSpawned`, `zombieBite`, `zombieDied`, `projectileFired`, `resourceProduced`, `waveStart`, `pauseChanged`, `gameOver`, `resourcesChanged`, `resourceCollected`…

```js
import { events } from '../events.js';
events.on('zombieDied', ({ zombie }) => { /* son, score, particules... */ });
```

---

## Git en équipe

1. Une branche par personne : `moteur`, `interface`, `contenu`.
2. Commits petits et fréquents. On fusionne sur `main` **au moins toutes les 2-3 heures**, et dès que le prototype tourne.
3. Toujours tester `main` après une fusion (lancer une partie complète).
4. Gel des fonctionnalités **2 heures avant la fin** : uniquement des corrections de bugs et la répétition de la démo.
