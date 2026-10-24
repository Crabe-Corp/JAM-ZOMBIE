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

Après avoir posé une plante, il faut attendre sa **recharge** avant d'en reposer une du même type. Une case ne peut contenir qu'une plante.

## Zombies

| Zombie | Vie | Vitesse (px/s) | Dégâts/s |
|---|---|---|---|
| 🧟 Zombie | 200 | 18 | 30 |
| 🦇 Chauve-souris | 110 | 42 | 20 |
| 🧌 Goule costaude | 600 | 14 | 45 |
| 🧛 Dracula (boss) | 1800 | 11 | 90 |

Un zombie avance tant que rien ne le bloque. Dès qu'il touche une plante (moins de 50 px devant lui), il s'arrête et la mange.

## Niveau actuel : « Le cimetière oublié »

Départ avec 150 bonbons, 4 vagues (à 22 s, 55 s, 95 s et 140 s). La dernière est la horde finale, avec Dracula sur la ligne du milieu.

## Contrôles

| Action | Commande |
|---|---|
| Choisir une plante | clic sur la carte, ou touches `1`, `2`, `3` |
| Poser la plante | clic sur une case libre |
| Pelle (retirer une plante) | carte « Retirer », ou touche `S` |
| Désélectionner | `Échap` ou clic droit |
| Ramasser un bonbon | clic dessus |
| Pause | bouton ou touche `P` |
| Lancer une partie | bouton « Jouer » ou `Entrée` |
| Couper/remettre le son | `M` |

Les `pointerdown` du canvas sont utilisés, donc le jeu répond aussi au doigt.

## Astuces de test (console du navigateur, F12)

```js
game.spawnZombie('dracula', 2)   // fait apparaître un boss sur la ligne 3
state.resources = 9999           // bonbons illimités
state                            // tout l'état de la partie
```

Mets `DEBUG = true` dans `src/config.js` pour afficher les compteurs d'entités.
