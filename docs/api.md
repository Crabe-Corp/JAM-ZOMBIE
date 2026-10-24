# API interne : état, événements, moteur

Trois points de contact permettent aux modules de collaborer sans se marcher dessus.

## 1. État partagé (`src/state.js`)

```js
import { state } from '../state.js';
```

| Champ | Écrit par | Sens |
|---|---|---|
| `status` | moteur | `menu`, `playing`, `paused`, `won`, `lost` |
| `plants`, `zombies`, `projectiles` | moteur | instances vivantes |
| `wave`, `totalWaves` | moteur | vague en cours et total |
| `time` | moteur | secondes depuis le début de la partie |
| `resources` | interface | nombre de bonbons |
| `selectedCard` | interface | id de plante, `'pelle'` ou `null` |
| `cooldowns` | interface | `{ [plantId]: secondes restantes }` |

Tout le monde peut lire tous les champs. `resetState()` remet l'état à zéro à chaque nouvelle partie.

## 2. Événements (`src/events.js`)

```js
import { events } from '../events.js';
const off = events.on('zombieDied', ({ zombie }) => { /* ... */ });
events.emit('monEvenement', { donnee: 1 });
off();   // se désabonner
```

Une erreur dans un écouteur est loguée sans casser le jeu.

**Émis par le moteur**

| Événement | Données |
|---|---|
| `gameStart` | `{ level }` |
| `plantPlaced` | `{ plant }` |
| `plantDied` | `{ plant }` (mangée) |
| `plantRemoved` | `{ plant }` (pelle) |
| `zombieSpawned` | `{ zombie }` |
| `zombieBite` | `{ zombie, plant }` |
| `zombieDied` | `{ zombie }` |
| `projectileFired` | `{ projectile, plant }` |
| `projectileHit` | `{ projectile, zombie }` |
| `resourceProduced` | `{ x, y, amount }` (une plante productrice) |
| `waveStart` | `{ index, total, finale }` |
| `pauseChanged` | `{ paused }` |
| `gameOver` | `{ win }` |

**Émis par l'interface**

| Événement | Données |
|---|---|
| `resourcesChanged` | `{ resources }` |
| `resourceCollected` | `{ amount, x, y }` |
| `cardSelected` | `{ plantId }` |

Qui écoute quoi aujourd'hui : l'audio réagit à `projectileFired`, `zombieBite`, `zombieDied`, `plantPlaced`, `resourceCollected`, `waveStart`, `pauseChanged`, `gameOver`. L'économie crée un bonbon sur `resourceProduced`. Le HUD suit `resourcesChanged`, `gameStart`, `waveStart`.

## 3. API du moteur (`Game`, `src/engine/game.js`)

| Méthode | Rôle |
|---|---|
| `newGame(level)` | démarre une partie |
| `togglePause()` | pause / reprise |
| `placePlant(typeId, row, col)` | pose une plante, renvoie `true` si posée |
| `removePlant(row, col)` | retire une plante, renvoie la plante ou `null` |
| `spawnZombie(typeId, row)` | fait apparaître un zombie (test ou vagues) |
| `addUpdater(fn(dt, game))` | ajoute une logique exécutée à chaque frame de jeu |
| `addLayer(fn(ctx, game))` | dessine par-dessus le jeu |
| `plantDefs`, `zombieDefs` | définitions chargées depuis les JSON, par `id` |
| `waves.progress` | progression des vagues, de 0 à 1 |

**Paiement** : `placePlant` ne débite rien. L'interface vérifie le coût et la recharge, appelle `placePlant`, puis débite seulement si la plante a été posée (`cards.js`).

## Autres modules utiles

- `engine/grid.js` : `cellCenter(row, col)`, `rowCenterY(row)`, `pixelToCell(x, y)`, `getPlantAt(row, col)`.
- `content/assets.js` : `drawSprite`, `drawHealthBar`, `drawProjectile`, `drawBackground`, `loadSprites`.
- `content/audio.js` : `play(name)`, `initAudio()`.
- `ui/economy.js` : `canAfford`, `spend`, `addResources`, `tryCollectAt`, `collectAll`.
