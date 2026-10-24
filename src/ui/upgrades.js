// =============================================================
//  ÉCRAN D'AMÉLIORATION — rôle B (interface)
//  Le moteur (engine/upgrades.js) émet `upgradeOffer` avant chaque
//  vague : on affiche les cartes, le joueur clique (ou tape 1, 2, 3)
//  et on appelle game.chooseUpgrade(id).
// =============================================================
import { state } from '../state.js';
import { events } from '../events.js';

export function initUpgradeScreen(game, textes = {}) {
  const screen = document.getElementById('screen-upgrade');
  const list = document.getElementById('upgrade-choices');
  const t = textes.ameliorations ?? {};
  document.getElementById('upgrade-title').textContent = t.titre ?? 'Choisis une amélioration';
  document.getElementById('upgrade-subtitle').textContent = t.sousTitre ?? '';

  let choices = [];

  const choose = (id) => {
    if (!game.chooseUpgrade(id)) return;
    screen.classList.add('hidden');
  };

  events.on('upgradeOffer', (offer) => {
    choices = offer.choices;
    list.innerHTML = '';
    choices.forEach((up, i) => {
      const plant = game.plantDefs[up.plante];
      const taken = game.upgrades.taken[up.id] ?? 0;
      const btn = document.createElement('button');
      btn.className = `upgrade-card ${up.rarete ?? 'commune'}`;
      btn.innerHTML = `
        <span class="upgrade-key">${i + 1}</span>
        <span class="upgrade-emoji">${up.emoji ?? '✨'}</span>
        <span class="upgrade-name"></span>
        <span class="upgrade-plant"></span>
        <span class="upgrade-desc"></span>
        <span class="upgrade-rarity"></span>`;
      btn.querySelector('.upgrade-name').textContent = up.nom;
      btn.querySelector('.upgrade-plant').textContent = plant ? `${plant.emoji} ${plant.nom}` : 'Toutes les plantes';
      btn.querySelector('.upgrade-desc').textContent = up.description;
      const rarity = t.rarete?.[up.rarete] ?? up.rarete ?? '';
      const lvl = (up.niveauMax ?? 1) > 1 ? ` · niv. ${taken + 1}/${up.niveauMax}` : '';
      btn.querySelector('.upgrade-rarity').textContent = rarity + lvl;
      btn.addEventListener('click', () => choose(up.id));
      list.appendChild(btn);
    });
    screen.classList.remove('hidden');
  });

  // Nouvelle partie ou retour au menu : on cache l'écran
  events.on('gameStart', () => screen.classList.add('hidden'));

  window.addEventListener('keydown', (e) => {
    if (state.status !== 'choosing') return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= choices.length) choose(choices[n - 1].id);
  });
}
