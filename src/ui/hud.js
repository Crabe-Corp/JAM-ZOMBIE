// =============================================================
//  HUD — rôle B (interface)
//  Compteur de bonbons, barre de progression des vagues,
//  bannière d'annonce, bouton pause.
// =============================================================
import { state } from '../state.js';
import { events } from '../events.js';

export function initHud(game) {
  const count = document.getElementById('resources-count');
  const resourcesBox = document.getElementById('resources');
  const waveLabel = document.getElementById('wave-label');
  const waveFill = document.getElementById('wave-fill');
  const banner = document.getElementById('banner');
  const btnPause = document.getElementById('btn-pause');

  let bannerTimeout = null;
  function showBanner(text, finale = false) {
    banner.textContent = text;
    banner.classList.toggle('finale', finale);
    banner.classList.add('show');
    clearTimeout(bannerTimeout);
    bannerTimeout = setTimeout(() => banner.classList.remove('show'), 2500);
  }

  events.on('resourcesChanged', ({ resources }) => {
    count.textContent = resources;
  });

  events.on('resourceCollected', () => {
    resourcesBox.classList.remove('bump');
    void resourcesBox.offsetWidth;
    resourcesBox.classList.add('bump');
  });

  events.on('gameStart', ({ level }) => {
    waveLabel.textContent = `Vague 0/${state.totalWaves}`;
    waveFill.style.width = '0%';
    showBanner(level.nom ?? 'Préparez-vous…');
  });

  events.on('waveStart', ({ index, total, finale }) => {
    waveLabel.textContent = `Vague ${index}/${total}`;
    showBanner(finale ? 'La horde finale approche !' : `Vague ${index}`, finale);
  });

  btnPause.addEventListener('click', () => game.togglePause());

  game.addUpdater(() => {
    waveFill.style.width = `${Math.round(game.waves.progress * 100)}%`;
  });

  // TODO(B) : afficher un petit "+25" qui flotte quand on ramasse un bonbon
  // TODO(B) : indicateur de zombies restants, bouton accélérer (x2)
}
