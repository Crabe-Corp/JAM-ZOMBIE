# Tâches par personne

La base **tourne déjà** : 3 plantes, 4 zombies, 4 vagues, bonbons, cartes, menus, sons synthétisés.
Le travail de chacun consiste à l'enrichir et à la rendre belle. Cochez au fur et à mesure.

Priorités : 🔴 indispensable pour la démo · 🟠 important · 🟢 bonus si le temps le permet.

---

## 👤 A — Moteur et gameplay · `src/engine/`

- [ ] 🔴 Lire `game.js` en entier et lancer une partie pour comprendre la boucle
- [ ] 🔴 Animation de mort des zombies (fondu ou chute) avant leur suppression — `zombie.js`
- [ ] 🔴 Petite animation de « tir » sur la citrouille (elle grossit un instant) — `plant.js`
- [ ] 🟠 Nouveau type de plante **`ralentisseur`** (toile d'araignée 🕸️) : ses projectiles ralentissent le zombie pendant 3 s — `plant.js`, `projectile.js`, `zombie.js`
- [ ] 🟠 Nouveau type **`explosif`** (citrouille bombe 💣) : explose au bout d'1 s et blesse tous les zombies dans un rayon — `plant.js`
- [ ] 🟠 Particules simples (étincelles à l'impact, poussière à la mort) — nouveau fichier `engine/particles.js`
- [ ] 🟠 Zombie qui saute par-dessus la première plante, ou zombie fantôme qui ne peut être touché qu'une fois sur deux
- [ ] 🟢 Tondeuses/« balais de sorcière » : un par ligne, qui balaie la ligne une seule fois au lieu de perdre
- [ ] 🟢 Bouton vitesse x2 (multiplier `dt` dans `loop`)

**Tester :** `game.spawnZombie('goule', 0)` dans la console.

---

## 👤 B — Interface et économie · `src/ui/`, `index.html`, `style.css`

- [ ] 🔴 Vérifier que le placement marche aussi au doigt sur tablette/téléphone
- [ ] 🔴 Texte flottant « +25 » quand on ramasse un bonbon — `economy.js` (dans `draw`)
- [ ] 🔴 Écran « Comment jouer » (3 phrases + les 3 cartes expliquées) avant la première partie — `menu.js`, `index.html`
- [ ] 🟠 Glisser-déposer d'une carte vers la grille (en plus du clic) — `cards.js`
- [ ] 🟠 Avertissement visuel quand un zombie approche de la maison (bord gauche qui clignote en rouge)
- [ ] 🟠 Meilleur score / meilleur temps sauvegardé dans `localStorage` sur l'écran de fin
- [ ] 🟠 Ramassage automatique des bonbons au survol (option dans le menu)
- [ ] 🟢 Choix du niveau sur l'écran titre (si C en fait plusieurs)
- [ ] 🟢 Écran titre animé (zombies qui passent en fond)

**Tester :** `state.resources = 9999` pour essayer toutes les cartes.

---

## 👤 C — Contenu, assets et ambiance · `data/`, `assets/`, `src/content/`

- [ ] 🔴 Choisir le **nom du jeu** et la palette de couleurs (à donner à B pour `style.css`)
- [ ] 🔴 Dessiner ou trouver les sprites des 3 plantes et 4 zombies (PNG transparent ~256 px), puis ajouter `"sprite": "assets/sprites/…"` dans les JSON
- [ ] 🔴 Image de fond du terrain (1000 × 520 px) — voir le `TODO(C)` dans `content/assets.js`
- [ ] 🔴 Jouer 5 parties et **équilibrer** les JSON (trop facile ? trop dur ?). Objectif : on gagne de justesse en jouant bien
- [ ] 🔴 Préparer le **pitch** : 3 slides + un scénario de démo de 2 minutes (qui joue, quoi montrer, astuce console pour faire apparaître Dracula au bon moment)
- [ ] 🟠 Vrais bruitages + une musique d'ambiance — remplir `FICHIERS` dans `content/audio.js`
- [ ] 🟠 Concevoir 2 nouvelles plantes et 1 nouveau zombie avec A (stats dans les JSON)
- [ ] 🟢 Un 2e niveau dans `levels.json` (plus dur, par exemple « Le manoir »)

**Sources d'assets libres :** itch.io (filtre *free*), opengameart.org, kenney.nl, freesound.org, pixabay.com/sound-effects. Notez les crédits dans un fichier `assets/CREDITS.md`.

---

## 🤝 Ensemble

- [ ] Point de 5 minutes toutes les 2-3 heures : ce qui marche, ce qui bloque
- [ ] Fusion sur `main` + partie complète après chaque point
- [ ] Gel des fonctionnalités 2 h avant la fin
- [ ] Répéter la démo au moins 2 fois
