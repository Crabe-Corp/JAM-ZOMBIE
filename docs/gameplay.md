# Règles du jeu et contrôles

## But

Des zombies arrivent par la droite sur 5 lignes et avancent vers ta maison, à gauche. Pose des plantes pour les arrêter.

- **Victoire** : toutes les vagues sont passées et il ne reste aucun zombie.
- **Défaite** : un zombie atteint la maison.

## Ressource : les bonbons 🍬

- Un bonbon tombe du ciel régulièrement (valeur et fréquence définies par le niveau).
- Les **bougies** en produisent aussi.
- Clique dessus pour les ramasser. Un bonbon posé disparaît au bout de 10 s.
- Les bonbons paient les plantes.

## Plantes

| Plante | Type | Coût | Vie | Effet | Recharge |
|---|---|---|---|---|---|
| 🎃 Citrouille lanceuse | tireur | 100 | 300 | 20 dégâts toutes les 1,4 s sur sa ligne | 6 s |
| 🕯️ Bougie ensorcelée | producteur | 50 | 250 | +25 bonbons toutes les 11 s | 6 s |
| 🪦 Pierre tombale | mur | 50 | 1600 | bloque les zombies | 20 s (15 s au début) |
| 🕸️ Toile d'araignée | tireur | 150 | 300 | 12 dégâts toutes les 1,6 s, ralentit de 50 % pendant 3 s | 8 s (10 s au début) |
| 💣 Citrouille bombe | explosif | 150 | 300 | explose après 1 s : 900 dégâts sur 3 × 3 cases, usage unique | 35 s (30 s au début) |
| 🧊 Crâne de givre | gel | 75 | 100 | après 0,5 s, gèle 4 s les zombies sur ~5 × 5 cases (+20 dégâts), usage unique | 30 s (20 s au début) |
| 🪤 Piège à loup | piege | 25 | 100 | s'arme en 10 s, puis 700 dégâts au premier zombie qui marche dessus, usage unique | 20 s (15 s au début) |
| 🧪 Chaudron bouillonnant | lanceur | 175 | 300 | potion par-dessus les plantes toutes les 3 s : 30 dégâts + 15 aux zombies proches | 8 s (10 s au début) |

Après avoir posé une plante, il faut attendre sa **recharge** avant d'en reposer une du même type. Une case ne peut contenir qu'une plante.

## Améliorations entre les vagues

Avant chaque vague (sauf la première), le jeu se met en pause et propose 3 améliorations au hasard (communes, rares ou épiques). On en choisit une, et elle s'applique à toutes les plantes de ce type jusqu'à la fin de la partie. Exemples :

- 🎃 Citrouille : graines brûlantes (+25 % dégâts), tir double, graines perforantes, feu follet (brûlure), gerbe de graines (tire sur 3 lignes).
- 🪦 Pierre tombale : terre sacrée (régénération), ronces (dégâts aux zombies qui la mordent), granit (+40 % vie), dernier repos (explose en mourant).
- 🕯️ Bougie, 🕸️ toile, 💣 bombe, 🧊 givre, 🪤 piège, 🧪 chaudron : production, ralentissement, rayon, durée…

La liste complète est dans [`data/upgrades.json`](../data/upgrades.json), le format dans [donnees.md](donnees.md).

## Zombies

| Zombie | Vie | Vitesse (px/s) | Dégâts/s |
|---|---|---|---|
| 🧟 Zombie | 200 | 18 | 30 |
| 🦇 Chauve-souris | 110 | 42 | 20 |
| 🧌 Goule costaude | 600 | 14 | 45 |
| 🧛 Dracula (boss) | 1800 | 11 | 90 |
| 🐺 Loup-garou | 340 | 32, puis 16 après son saut | 40 |
| 👻 Fantôme | 180 | 20 | 25 |

Un zombie avance tant que rien ne le bloque. Dès qu'il touche une plante (moins de 50 px devant lui), il s'arrête et la mange.

Le **loup-garou** saute par-dessus la première plante qu'il touche, puis ralentit. Pour le piéger, place une plante sacrifiable (tombe, piège pas encore armé) devant tes citrouilles.

Le **fantôme** laisse passer une graine sur deux. Les potions du chaudron, les explosions et le gel le touchent normalement.

## Niveaux

**1. Le cimetière oublié** : départ avec 150 bonbons, un bonbon du ciel toutes les 8 s, 4 vagues (à 22 s, 55 s, 95 s et 140 s). La dernière est la horde finale, avec Dracula sur la ligne du milieu.

**2. Le manoir hanté** (plus dur) : départ avec 125 bonbons, un bonbon du ciel toutes les 10 s, 6 vagues (à 20 s, 50 s, 85 s, 125 s, 170 s et 225 s). Les loups-garous arrivent à la vague 3, les fantômes à la vague 4, un premier Dracula en haut à la vague 5, et la horde finale en amène deux (lignes 2 et 4). Avec 6 vagues, on choisit 5 améliorations.

Le niveau se choisit sur l'écran titre ; le meilleur score est gardé séparément pour chaque niveau.

## Contrôles

| Action | Commande |
|---|---|
| Choisir une plante | clic sur la carte, ou touches `1` à `8` |
| Poser la plante | clic sur une case libre |
| Pelle (retirer une plante) | carte « Retirer », ou touche `S` |
| Désélectionner | `Échap` ou clic droit |
| Ramasser un bonbon | clic dessus |
| Pause | bouton ou touche `P` |
| Lancer une partie | bouton « Jouer » ou `Entrée` |
| Couper/remettre le son | `M` |
| Vitesse x2 | bouton `x1` / `x2`, ou touche `V` |
| Choisir une amélioration | clic sur la carte, ou `1`, `2`, `3` |

Les `pointerdown` du canvas sont utilisés, donc le jeu répond aussi au doigt.

## Astuces de test (console du navigateur, F12)

```js
game.spawnZombie('dracula', 2)   // fait apparaître un boss sur la ligne 3
state.resources = 9999           // bonbons illimités
state                            // tout l'état de la partie
```

Mets `DEBUG = true` dans `src/config.js` pour afficher les compteurs d'entités.
