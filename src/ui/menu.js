// =============================================================
//  MENUS — rôle B (interface)
//  Écran titre, pause, victoire / défaite.
// =============================================================
import { state } from '../state.js';
import { events } from '../events.js';

export function initMenu(game, { onStart }) {
  const screens = {
    title: document.getElementById('screen-title'),
    pause: document.getElementById('screen-pause'),
    end: document.getElementById('screen-end'),
  };
  const show = (name) => {
    for (const [key, el] of Object.entries(screens)) el.classList.toggle('hidden', key !== name);
  };

  document.getElementById('btn-play').addEventListener('click', () => { show(null); onStart(); });
  document.getElementById('btn-restart').addEventListener('click', () => { show(null); onStart(); });
  document.getElementById('btn-resume').addEventListener('click', () => game.togglePause());
  document.getElementById('btn-quit').addEventListener('click', () => {
    state.status = 'menu';
    show('title');
  });

  events.on('pauseChanged', ({ paused }) => show(paused ? 'pause' : null));

  events.on('gameOver', ({ win }) => {
    document.getElementById('end-title').textContent = win ? 'Victoire ! 🎃' : 'Ils ont eu ton cerveau… 🧠';
    document.getElementById('end-text').textContent = win
      ? `Le cimetière est sauvé en ${Math.round(state.time)} secondes.`
      : `Tu as tenu ${Math.round(state.time)} secondes et ${state.wave} vague(s).`;
    setTimeout(() => show('end'), 900);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') game.togglePause();
    if (e.key === 'Enter' && !screens.title.classList.contains('hidden')) {
      show(null);
      onStart();
    }
  });

  // TODO(B) : écran "comment jouer", choix du niveau, meilleur score (localStorage)
}
