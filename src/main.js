// =============================================================
//  MAIN — fichier PARTAGÉ (point d'entrée)
//  Charge les données (D), crée le jeu (A) et branche les modules de B et C.
//  Normalement on n'y touche presque pas : chacun travaille dans son dossier.
// =============================================================
import { Game } from './engine/game.js';
import { state } from './state.js';
import { events } from './events.js';

// B — interface
import { initEconomy, resetEconomy } from './ui/economy.js';
import { initCards, resetCards } from './ui/cards.js';
import { initHud } from './ui/hud.js';
import { initMenu } from './ui/menu.js';
import { initUpgradeScreen } from './ui/upgrades.js';

// C — contenu
import { loadSprites } from './content/assets.js';
import { initAudio } from './content/audio.js';

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Impossible de charger ${path} (${res.status})`);
  return res.json();
}

async function boot() {
  const [plants, zombies, levels, upgrades, textes] = await Promise.all([
    loadJSON('data/plants.json'),
    loadJSON('data/zombies.json'),
    loadJSON('data/levels.json'),
    loadJSON('data/upgrades.json'),
    loadJSON('data/textes.json'),
  ]);
  await loadSprites([...plants, ...zombies]);

  const canvas = document.getElementById('game');
  const game = new Game(canvas);
  game.setData({ plants, zombies, upgrades });

  initEconomy(game);
  initCards(game, canvas, plants);
  initHud(game);
  initUpgradeScreen(game, textes);
  initAudio();

  function startGame(level) {
    game.newGame(level);
    resetEconomy(game.level);   // copie du niveau : les améliorations peuvent la modifier
    resetCards();
  }

  initMenu(game, { onStart: startGame, levels: levels.niveaux, textes });

  // Accès depuis la console du navigateur pour tester :
  //   game.spawnZombie('dracula', 2)   state.resources = 9999
  window.game = game;
  window.state = state;
  window.events = events;
}

boot().catch((err) => {
  console.error(err);
  const msg = location.protocol === 'file:'
    ? "Le jeu doit être lancé avec un petit serveur local (voir README), pas en double-cliquant sur index.html."
    : `Erreur au chargement : ${err.message}`;
  document.getElementById('screen-title').innerHTML = `<h2>Oups</h2><p>${msg}</p>`;
});
