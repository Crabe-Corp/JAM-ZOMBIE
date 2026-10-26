# Tâches par personne

La base **tourne déjà** : 3 plantes, 4 zombies, 4 vagues, bonbons, cartes, menus, sons synthétisés.
Le travail de chacun consiste à l'enrichir et à la rendre belle. Cochez au fur et à mesure.

Priorités : 🔴 indispensable pour la démo · 🟠 important · 🟢 bonus si le temps le permet.

| Rôle                                             | Fichiers                                   | Branche       |
| ------------------------------------------------- | ------------------------------------------ | ------------- |
| **A — Moteur et gameplay**                 | `src/engine/`                            | `moteur`    |
| **B — Interface et économie**             | `src/ui/`, `index.html`, `style.css` | `interface` |
| **C — Graphismes, son et ambiance**        | `assets/`, `src/content/`              | `contenu`   |
| **D — Game design, équilibrage et pitch** | `data/`, `docs/`, `pitch/`           | `design`    |

---

## 👤 A — Moteur et gameplay · `src/engine/`

- [x] 🔴 Lire `game.js` en entier et lancer une partie pour comprendre la boucle
- [x] 🔴 Animation de mort des zombies (fondu ou chute) avant leur suppression — `zombie.js`
- [x] 🔴 Petite animation de « tir » sur la citrouille (elle grossit un instant) — `plant.js`
- [x] 🟠 Nouveau type de plante **`ralentisseur`** (toile d'araignée 🕸️) : ses projectiles ralentissent le zombie pendant 3 s — `plant.js`, `projectile.js`, `zombie.js` (stats fournies par D)
- [x] 🟠 Nouveau type **`explosif`** (citrouille bombe 💣) : explose au bout d'1 s et blesse tous les zombies dans un rayon — `plant.js` (stats fournies par D)
- [x] 🟠 Zombie qui saute par-dessus la première plante, ou zombie fantôme qui ne peut être touché qu'une fois sur deux (conçu avec D)
- [x] 🟢 Tondeuses/« balais de sorcière » : un par ligne, qui balaie la ligne une seule fois au lieu de perdre
- [x] 🟢 Bouton vitesse x2 (multiplier `dt` dans `loop`, B ajoute le bouton dans le HUD)

**Tester :** `game.spawnZombie('goule', 0)` dans la console.

---

## 👤 B — Interface et économie · `src/ui/`, `index.html`, `style.css`

- [ ] 🔴 Corriger le placement au doigt sur tablette/téléphone (D teste et remonte les bugs)
- [X] 🔴 Texte flottant « +25 » quand on ramasse un bonbon — `economy.js` (dans `draw`)
- [X] 🔴 Écran « Comment jouer » (3 phrases + les 3 cartes expliquées, textes fournis par D) avant la première partie — `menu.js`, `index.html`
- [X] 🔴 Appliquer la palette de couleurs choisie par C dans `style.css`
- [X] 🟠 Glisser-déposer d'une carte vers la grille (en plus du clic) — `cards.js`
- [X] 🟠 Avertissement visuel quand un zombie approche de la maison (bord gauche qui clignote en rouge)
- [X] 🟠 Meilleur score / meilleur temps sauvegardé dans `localStorage` sur l'écran de fin
- [X] 🟠 Ramassage automatique des bonbons au survol (option dans le menu)
- [x] 🟢 Choix du niveau sur l'écran titre (si D en fait plusieurs)
- [ ] 🟢 Écran titre animé (zombies qui passent en fond, sprites fournis par C)

**Tester :** `state.resources = 9999` pour essayer toutes les cartes.

---

## 👤 C — Graphismes, son et ambiance · `assets/`, `src/content/`

- [x] 🔴 Choisir le **nom du jeu** (avec D) et la palette de couleurs (à donner à B pour `style.css`)
- [x] 🔴 Dessiner ou trouver les sprites des 3 plantes et 4 zombies (PNG transparent ~256 px), puis donner les chemins `"sprite": "assets/sprites/…"` à D pour les JSON
- [x] 🔴 Image de fond du terrain (1000 × 520 px) — voir le `TODO(C)` dans `content/assets.js`
- [x] 🟠 Vrais bruitages + une musique d'ambiance — remplir `FICHIERS` dans `content/audio.js`
- [x] 🟠 Particules simples (étincelles à l'impact, poussière à la mort) — nouveau fichier `src/content/particles.js`, branché sur les événements `projectileHit` / `zombieDied` et dessiné via `game.addLayer`
- [x] 🟠 Sprites des nouvelles plantes (🕸️, 💣) et du nouveau zombie
- [ ] 🟢 Visuels du pitch (logo, captures, fond des slides) pour D
- [ ] 🟢 Décor du 2e niveau (« Le manoir »)

**Sources d'assets libres :** itch.io (filtre *free*), opengameart.org, kenney.nl, freesound.org, pixabay.com/sound-effects. Notez les crédits dans un fichier `assets/CREDITS.md`.

---

## 👤 D — Game design, équilibrage et pitch · `data/`, `docs/`, `pitch/`

- [x] 🔴 Écrire **dès le début** les stats des plantes `ralentisseur` et `explosif` dans `plants.json` pour que A puisse les coder
- [x] 🔴 Jouer 5 parties et **équilibrer** les JSON (trop facile ? trop dur ?). Objectif : on gagne de justesse en jouant bien
- [ ] 🔴 Tester sur tablette/téléphone et après chaque fusion sur `main` : tenir une liste de bugs partagée (qui, quoi, comment reproduire)
- [x] 🔴 Préparer le **pitch** : 3 slides + un scénario de démo de 2 minutes (qui joue, quoi montrer, astuce console pour faire apparaître Dracula au bon moment)
- [x] 🟠 Concevoir 2 nouvelles plantes et 1 nouveau zombie avec A (règles + stats dans les JSON)
- [x] 🟠 Rédiger les textes de l'écran « Comment jouer » et les descriptions des cartes pour B
- [x] 🟢 Un 2e niveau dans `levels.json` (plus dur, par exemple « Le manoir »)
- [x] 🟢 Mettre à jour `docs/gameplay.md` et `docs/donnees.md` avec les nouveautés

**Tester :** modifier un JSON puis recharger la page (Ctrl+Maj+R pour vider le cache).

---

## 🤝 Ensemble

- [ ] Point de 5 minutes toutes les 2-3 heures : ce qui marche, ce qui bloque
- [ ] Fusion sur `main` + partie complète après chaque point (D mène le test)
- [ ] Gel des fonctionnalités 2 h avant la fin
- [ ] Répéter la démo au moins 2 fois
