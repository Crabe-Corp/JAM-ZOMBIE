# Ajouter des sprites, un décor et des sons

Sans fichier, le jeu fonctionne avec des emojis et des sons synthétisés. Chaque ressource peut être remplacée indépendamment.

## Sprites des plantes et zombies

1. Dépose un PNG à fond transparent (environ 256 × 256) dans `assets/sprites/`.
2. Dans le JSON correspondant, ajoute `"sprite": "assets/sprites/mon-image.png"`.
3. Pour une image différente sur la carte, ajoute `"icone": "assets/sprites/mon-icone.png"` (plantes).

Le sprite est mis à l'échelle sur la hauteur de la case en gardant ses proportions. Si le fichier est introuvable, un avertissement apparaît dans la console et l'emoji est utilisé.

## Décor

`drawBackground` dans `src/content/assets.js` dessine aujourd'hui un décor généré (ciel, lune, tombes, maison, brouillard). Pour une image :

```js
const bg = new Image(); bg.src = 'assets/sprites/fond.png';
// dans drawBackground : ctx.drawImage(bg, 0, 0, CANVAS_W, CANVAS_H);
```

Taille conseillée : 1000 × 520 px. La zone de jeu commence à x = 110 (la bande de gauche est la maison).

## Sons

Dans `src/content/audio.js`, remplace `null` par un chemin dans `FICHIERS` :

```js
const FICHIERS = {
  tir: 'assets/audio/tir.mp3',
  musique: 'assets/audio/ambiance.ogg',
  // ...
};
```

Sons disponibles : `tir`, `morsure`, `mort`, `pose`, `bonbon`, `vague`, `finale`, `victoire`, `defaite`, `musique` (en boucle). Un son sans fichier garde son bip synthétisé. Touche `M` pour couper le son.

Le navigateur n'autorise l'audio qu'après un clic : il démarre au clic sur « Jouer ».

## Droits et crédits

N'utilise pas d'images du jeu original (protégées). Sources libres : itch.io (filtre *free*), opengameart.org, kenney.nl, freesound.org, pixabay.com/sound-effects. Note les crédits dans `assets/CREDITS.md`.
