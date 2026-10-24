// =============================================================
//  HUD — rôle B (interface)
//  Compteur de bonbons, barre de progression des vagues,
//  bannière d'annonce, boutons pause / vitesse x2 et avertissement danger maison.
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
  const btnSpeed = document.getElementById('btn-speed');
  const stageEl = document.getElementById('stage');

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

  // Vitesse x2 (bouton ou touche V)
  if (btnSpeed) {
    btnSpeed.addEventListener('click', () => game.toggleSpeed());
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'v' || e.key === 'V') && state.status === 'playing') game.toggleSpeed();
    });
    events.on('speedChanged', ({ speed }) => {
      btnSpeed.innerHTML = `<img src="assets/icons/speed.svg" class="svg-icon" alt="" style="width:16px;height:16px;margin-right:4px;">${speed === 2 ? 'x2' : 'x1'}`;
      btnSpeed.classList.toggle('active', speed === 2);
    });
  }

  game.addUpdater(() => {
    waveFill.style.width = `${Math.round(game.waves.progress * 100)}%`;
  });

  // Avertissement visuel quand un zombie approche de la maison (bord gauche clignotant)
  game.addLayer((ctx) => {
    if (state.status !== 'playing') {
      if (stageEl) stageEl.classList.remove('danger-alert');
      return;
    }

    // HOUSE_X est 75. Les zombies vivants avec x < 240 sont proches de la maison
    const dangerZombies = state.zombies.filter((z) => !z.dead && !z.dying && z.x < 240);
    const inDanger = dangerZombies.length > 0;
    if (stageEl) stageEl.classList.toggle('danger-alert', inDanger);

    if (!inDanger) return;

    const minX = Math.min(...dangerZombies.map((z) => z.x));
    // Plus le zombie est proche de la maison (75), plus le clignotement est rapide et intense
    const urgency = Math.max(0, Math.min(1, (240 - minX) / 165));
    const freq = 6 + urgency * 8;
    const pulse = 0.4 + 0.6 * Math.sin(state.time * freq);

    ctx.save();
    // Dégradé rouge sur le bord gauche du canvas
    const grad = ctx.createLinearGradient(0, 0, 140, 0);
    grad.addColorStop(0, `rgba(224, 69, 74, ${0.5 * pulse})`);
    grad.addColorStop(1, 'rgba(224, 69, 74, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 140, ctx.canvas.height);

    // Liseré rouge vif sur le bord extrême gauche
    ctx.fillStyle = `rgba(224, 69, 74, ${0.85 * pulse})`;
    ctx.fillRect(0, 0, 6, ctx.canvas.height);
    ctx.restore();
  });
}
