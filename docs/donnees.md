# Format des données (`data/`)

Les stats et les niveaux sont dans trois fichiers JSON. Pour équilibrer ou ajouter du contenu, il suffit de les modifier : aucun code à toucher.

## `plants.json`

Tableau d'objets, un par plante. L'ordre définit l'ordre des cartes et les raccourcis clavier (`1`, `2`…).

| Champ | Type | Sens |
|---|---|---|
| `id` | texte | identifiant unique, sans espace |
| `nom`, `description` | texte | affichés dans l'infobulle de la carte |
| `emoji` | texte | affiché tant qu'il n'y a pas de sprite |
| `sprite` | chemin | *(optionnel)* image sur le terrain |
| `icone` | chemin | *(optionnel)* image sur la carte |
| `type` | `tireur` · `producteur` · `mur` | comportement |
| `cout` | nombre | prix en bonbons |
| `vie` | nombre | points de vie |
| `recharge` | secondes | délai avant de reposer la même plante |
| `rechargeInitiale` | secondes | délai au début de la partie |
| `degats`, `cadence` | nombre, secondes | *tireur* : dégâts par tir, temps entre deux tirs |
| `vitesseProjectile`, `couleurProjectile` | px/s, couleur | *tireur* (défauts : 320 et `#ff8c1a`) |
| `production`, `intervalleProduction` | nombre, secondes | *producteur* : bonbons produits et fréquence |

## `zombies.json`

| Champ | Type | Sens |
|---|---|---|
| `id` | texte | identifiant unique |
| `nom`, `emoji` | texte | affichage |
| `sprite` | chemin | *(optionnel)* |
| `vie` | nombre | points de vie |
| `vitesse` | px/s | une case = 90 px |
| `degatsParSeconde` | nombre | dégâts infligés à la plante mangée |
| `taille` | px | *(optionnel)* taille du dessin, 78 par défaut |

## `levels.json`

Objet `{ "niveaux": [ ... ] }`. Seul `niveaux[0]` est joué pour l'instant (voir le TODO dans `main.js`).

| Champ | Sens |
|---|---|
| `id`, `nom` | identifiant et titre affiché dans la bannière de début |
| `ressourcesDepart` | bonbons au début (150 par défaut) |
| `intervalleCiel` | un bonbon tombe du ciel toutes les N secondes (9 par défaut) |
| `valeurBonbonCiel` | valeur d'un bonbon du ciel (25 par défaut) |
| `vagues` | liste de vagues |

Une vague :

```json
{ "temps": 55, "finale": false, "zombies": [
    { "type": "basique", "nombre": 4, "intervalle": 6, "decalage": 0, "ligne": 2 }
] }
```

| Champ | Sens |
|---|---|
| `temps` | seconde de la partie où la vague est annoncée |
| `finale` | `true` pour la horde finale (bannière et son spéciaux) |
| `zombies[].type` | `id` d'un zombie |
| `zombies[].nombre` | combien de zombies dans le groupe |
| `zombies[].intervalle` | secondes entre deux zombies du groupe |
| `zombies[].decalage` | retard du groupe après `temps` |
| `zombies[].ligne` | *(optionnel)* ligne de 0 à 4, au hasard sinon |

Le zombie numéro `k` du groupe apparaît à `temps + decalage + k × intervalle`.

## Ajouter une plante ou un zombie

1. Ajoute un objet dans `plants.json` ou `zombies.json` avec un `id` unique.
2. Pour un zombie, cite son `id` dans les vagues de `levels.json`.
3. Recharge la page : la carte et le zombie apparaissent.

Un nouveau **type** de plante (autre que `tireur`, `producteur`, `mur`) demande du code dans `src/engine/entities/plant.js`.

## Équilibrage

Objectif : gagner de justesse en jouant bien. Teste avec `state.resources = 9999` et `game.spawnZombie(...)` pour juger rapidement un zombie.
