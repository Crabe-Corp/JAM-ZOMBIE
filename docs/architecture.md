# Architecture

Le jeu est une application statique : HTML5 Canvas + modules JavaScript ES, sans compilation ni dépendance.

## Vue d'ensemble

```
index.html ─► src/main.js ─► charge data/*.json ─► crée Game ─► branche les modules
```

1. `main.js` charge `plants.json`, `zombies.json` et `levels.json` avec `fetch`, puis précharge les sprites.
2. Il crée le `Game` (moteur) sur le `<canvas id="game">`.
3. Il initialise l'interface (`ui/`) et l'audio (`content/audio.js`).
4. Au clic sur « Jouer », `game.newGame(level)` remet l'état à zéro et démarre les vagues.

`main.js` expose aussi `game`, `state` et `events` sur `window` pour tester depuis la console.

## Structure du dépôt

```
├── index.html            page, canvas, HUD, écrans (titre, pause, fin)
├── style.css             thème, cartes, HUD, écrans
├── Dockerfile            image nginx:alpine qui sert le jeu
├── package.json          script `npm start` (npx serve, port 8080)
├── scripts/              start.sh / stop.sh (Docker)
├── data/                 plants.json, zombies.json, levels.json
├── assets/               sprites/ et audio/ (vides pour l'instant)
├── docs/                 cette documentation
└── src/
    ├── main.js           point d'entrée
    ├── config.js         dimensions de la grille et du canvas
    ├── state.js          état partagé de la partie
    ├── events.js         bus d'événements
    ├── engine/           moteur (rôle A)
    │   ├── game.js       boucle, API publique, collisions
    │   ├── grid.js       conversions pixel ↔ case
    │   ├── waves.js      planning des vagues
    │   └── entities/     plant.js, zombie.js, projectile.js
    ├── ui/               interface (rôle B)
    │   ├── cards.js      barre de cartes, placement, pelle
    │   ├── economy.js    bonbons (ciel, production, ramassage)
    │   ├── hud.js        compteur, barre de vagues, bannière, pause
    │   └── menu.js       écran titre, pause, victoire/défaite
    └── content/          contenu (rôle C)
        ├── assets.js     sprites, décor, barres de vie, projectiles
        └── audio.js      sons et musique
```

## Boucle de jeu

`Game.loop` tourne via `requestAnimationFrame`. À chaque frame :

- `dt` = temps écoulé en secondes, plafonné à 0,1 s (onglet en arrière-plan).
- Si `state.status === 'playing'` : `update(dt)`
  1. `state.time += dt`
  2. `waves.update` fait apparaître les zombies prévus
  3. mise à jour des plantes, zombies, projectiles
  4. exécution des `updaters` ajoutés par B et C
  5. suppression des entités `dead`
  6. victoire si toutes les vagues sont passées et plus aucun zombie
- Dans tous les cas : `draw` (le dessin continue en pause).

Ordre de dessin : décor → damier → pour chaque ligne (plantes puis zombies) → projectiles → `layers` (bonbons, aperçu de placement) → debug.

Dessiner ligne par ligne fait passer les zombies devant les plantes de leur ligne.

## Grille et dimensions

Définies dans `src/config.js` : 5 lignes × 9 colonnes, cases de 90 × 96 px, canvas de 1000 × 520 px. La bande de gauche (110 px) est la maison à défendre. Un zombie dont `x < HOUSE_X` fait perdre la partie.

## États de la partie

`state.status` : `menu` → `playing` ⇄ `paused` → `won` | `lost`.

Avant chaque vague (sauf la première), la partie passe en `choosing` : rien ne bouge tant que le joueur n'a pas choisi une amélioration (`engine/upgrades.js` côté moteur, `ui/upgrades.js` côté écran).

## Découpage en quatre rôles

| Rôle | Périmètre | Fichiers |
|---|---|---|
| A — Moteur | boucle, entités, vagues, améliorations | `src/engine/` |
| B — Interface | cartes, économie, HUD, menus, écran d'amélioration | `src/ui/`, `index.html`, `style.css` |
| C — Graphismes et son | sprites, décor, sons, particules | `assets/`, `src/content/` |
| D — Game design | stats, niveaux, améliorations, textes, doc, pitch | `data/`, `docs/`, `pitch/` |

Les fichiers partagés (`main.js`, `config.js`, `state.js`, `events.js`) sont les contrats entre les rôles : on prévient avant de les modifier. Voir [api.md](api.md).
