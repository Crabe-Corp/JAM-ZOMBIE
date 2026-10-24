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
| `type` | `tireur` · `producteur` · `mur` · `explosif` · `gel` · `piege` · `lanceur` | comportement |
| `cout` | nombre | prix en bonbons |
| `vie` | nombre | points de vie |
| `recharge` | secondes | délai avant de reposer la même plante |
| `rechargeInitiale` | secondes | délai au début de la partie |
| `degats`, `cadence` | nombre, secondes | *tireur* : dégâts par tir, temps entre deux tirs |
| `vitesseProjectile`, `couleurProjectile` | px/s, couleur | *tireur* (défauts : 320 et `#ff8c1a`) |
| `production`, `intervalleProduction` | nombre, secondes | *producteur* : bonbons produits et fréquence |
| `facteurVitesse`, `dureeRalentissement` | 0 à 1, secondes | *tireur* *(optionnel)* : le zombie touché avance à `vitesse × facteurVitesse` pendant la durée (ex. toile : 0.5 et 3 s) |
| `delaiExplosion`, `rayonExplosion`, `degatsExplosion` | secondes, px, nombre | *explosif* : explose après le délai, blesse tous les zombies dans le rayon, puis disparaît |
| `delaiGel`, `rayonGel`, `dureeGel`, `degatsGel` | secondes, px, secondes, nombre | *gel* : après le délai, immobilise tous les zombies dans le rayon et leur inflige `degatsGel`, puis disparaît |
| `delaiArmement`, `degatsPiege` | secondes, nombre | *piege* : avant d'être armé, c'est une plante normale que les zombies mangent ; une fois armé, le premier zombie qui arrive sur sa case prend `degatsPiege` et le piège disparaît |
| `degats`, `cadence`, `dureeVol` | nombre, secondes, secondes | *lanceur* : lance une potion en cloche sur le **premier zombie de sa ligne**, par-dessus les plantes ; elle met `dureeVol` secondes à arriver |
| `rayonEclaboussure`, `degatsEclaboussure` | px, nombre | *lanceur* : dégâts aux autres zombies proches de la cible |

Repères pour les rayons : une case fait 90 × 96 px, donc 140 px ≈ un carré de 3 × 3 cases autour de la plante, 230 px ≈ 5 × 5.

### Stats ajoutées par les améliorations

Ces stats n'existent pas dans `plants.json` : elles valent leur valeur par défaut tant qu'aucune amélioration ne les change.

| Champ | Défaut | Sens |
|---|---|---|
| `projectilesParTir` | 1 | *tireur* : graines tirées à chaque tir (la 2e part ~0,15 s après) |
| `perforation` | 0 | *tireur* : nombre de zombies supplémentaires traversés par une graine |
| `lignesTir` | 1 | *tireur* : 1 = sa ligne, 3 = aussi la ligne au-dessus et en dessous |
| `degatsBrulure`, `dureeBrulure` | 0, 0 | *tireur* : dégâts par seconde infligés au zombie touché, pendant la durée |
| `regeneration` | 0 | PV regagnés par seconde (sans dépasser la vie max) |
| `degatsEpines` | 0 | dégâts par seconde infligés au zombie qui mord la plante |
| `reductionMorsure` | 0 | 0 à 1 : part des dégâts de morsure annulée (0.4 = −40 %) |
| `degatsMort`, `rayonMort` | 0, 0 | explosion quand la plante meurt mangée (pas à la pelle) |
| `chanceBonbonDore` | 0 | *producteur* : probabilité qu'un bonbon vaille `multiplicateurBonbonDore` fois plus |
| `facteurVitesseApresGel`, `dureeApresGel` | 1, 0 | *gel* : ralentissement appliqué quand le gel se termine |
| `usages` | 1 | *piege* : nombre de zombies mordus avant de disparaître (il se réarme entre deux) |

Les stats de ralentissement (`facteurVitesse`, `dureeRalentissement`) marchent aussi pour le *lanceur*.

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
| `sauteur` | booléen | *(optionnel)* saute par-dessus la **première** plante qu'il touche, puis marche normalement |
| `dureeSaut` | secondes | *sauteur* : durée du saut (il ne peut pas être bloqué pendant ce temps) |
| `vitesseApresSaut` | px/s | *sauteur* : nouvelle vitesse après le saut |

## `upgrades.json` — améliorations roguelike

Avant chaque vague (sauf la première), le jeu se met en pause et propose `choixProposes` améliorations tirées au hasard. Le joueur en choisit une. Elle s'applique **tout de suite et jusqu'à la fin de la partie** à toutes les plantes de ce type, celles déjà posées comme les prochaines.

`regles` :

| Champ | Sens |
|---|---|
| `choixProposes` | nombre de cartes d'amélioration proposées (3) |
| `seulementPlantesDuDeck` | ne proposer que des améliorations des plantes disponibles |
| `poidsRarete` | chances relatives de tirer une amélioration `commune`, `rare` ou `epique` |
| `multiplicateurBonbonDore` | valeur d'un bonbon doré (x3) |

Une amélioration :

```json
{ "id": "citrouille-gerbe", "plante": "citrouille", "nom": "Gerbe de graines", "emoji": "🎆",
  "description": "Tire aussi sur les lignes du dessus et du dessous.", "rarete": "epique", "niveauMax": 1,
  "requiert": "citrouille-tir-double",
  "effets": [ { "stat": "lignesTir", "fixe": 3 } ] }
```

| Champ | Sens |
|---|---|
| `plante` | `id` de la plante concernée, ou `"*"` pour toutes |
| `rarete` | `commune` · `rare` · `epique` |
| `niveauMax` | combien de fois on peut la prendre (les effets se cumulent) |
| `requiert` | *(optionnel)* `id` d'une amélioration à avoir déjà prise |
| `effets` | liste de modifications de stats |

Chaque effet a un `stat` et **une** opération, appliquée à la valeur actuelle :
- `"ajout": n` → stat + n
- `"mult": n` → stat × n (0.8 sur `cadence` = tire 20 % plus vite)
- `"fixe": n` → stat = n

Quand `vie` augmente, la vie actuelle des plantes posées augmente d'autant. Avec `"plante": "*"`, les stats `valeurBonbonCiel` et `intervalleCiel` modifient le niveau au lieu des plantes.

## `textes.json` — textes de l'interface

Textes rédigés par D pour B : écran « Comment jouer » (`commentJouer`), conseils à afficher pendant le chargement ou la pause (`conseils`), phrase d'accroche de chaque niveau (`niveaux`, par `id` de niveau), écran de choix d'amélioration (`ameliorations`) et écran de fin (`fin`).

Dans les textes de fin, `{niveau}`, `{temps}` et `{vagues}` sont à remplacer par le nom du niveau, le temps et le nombre de vagues. Les descriptions des cartes restent dans `plants.json` (champ `description`).

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

Un nouveau **type** de plante (autre que `tireur`, `producteur`, `mur`, `explosif`, `gel`, `piege`, `lanceur`) demande du code dans `src/engine/entities/plant.js`.

## Équilibrage

Objectif : gagner de justesse en jouant bien. Teste avec `state.resources = 9999` et `game.spawnZombie(...)` pour juger rapidement un zombie.
