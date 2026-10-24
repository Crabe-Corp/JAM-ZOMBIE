// =============================================================
//  CARTES ET PLACEMENT — rôle B (interface)
//  Barre de cartes, sélection, aperçu sur la grille, pose des
//  plantes (paiement + temps de recharge) et pelle.
// =============================================================
import { state } from '../state.js';
import { events } from '../events.js';
import { pixelToCell, cellCenter, getPlantAt } from '../engine/grid.js';
import { CELL_W, CELL_H } from '../config.js';
import { drawSprite } from '../content/assets.js';
import { canAfford, spend, tryCollectAt } from './economy.js';

const SHOVEL = 'pelle';

let game = null;
let canvas = null;
let plantList = [];
let bar = null;
let hoverCell = null;
const cardEls = new Map();

export function initCards(g, cv, plants) {
  game = g;
  canvas = cv;
  plantList = plants;
  bar = document.getElementById('card-bar');
  buildBar();

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', (e) => {
    const { x, y } = canvasPos(e);
    hoverCell = pixelToCell(x, y);
  });
  canvas.addEventListener('pointerleave', () => { hoverCell = null; });
  canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); select(null); });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') select(null);
    // Raccourcis 1..9 pour les cartes, S pour la pelle
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= plantList.length) select(plantList[n - 1].id);
    if (e.key === 's' || e.key === 'S') select(SHOVEL);
  });

  events.on('resourcesChanged', refreshBar);
  game.addUpdater(updateCooldowns);
  game.addLayer(drawPreview);
}

export function resetCards() {
  for (const p of plantList) state.cooldowns[p.id] = p.rechargeInitiale ?? 0;
  select(null);
}

// ── Barre de cartes (DOM) ─────────────────────────────────────

function buildBar() {
  bar.innerHTML = '';
  plantList.forEach((def, i) => {
    const el = document.createElement('button');
    el.className = 'card';
    el.title = `${def.nom} (${i + 1})\n${def.description ?? ''}`;
    el.innerHTML = `
      <span class="card-icon">${def.icone ? `<img src="${def.icone}" alt="">` : def.emoji}</span>
      <span class="card-cost">🍬 ${def.cout}</span>
      <span class="card-cooldown"></span>`;
    el.addEventListener('click', () => select(def.id));
    bar.appendChild(el);
    cardEls.set(def.id, el);
  });

  const shovel = document.createElement('button');
  shovel.className = 'card shovel';
  shovel.title = 'Retirer une plante (S)';
  shovel.innerHTML = `<span class="card-icon">⛏️</span><span class="card-cost">Retirer</span>`;
  shovel.addEventListener('click', () => select(SHOVEL));
  bar.appendChild(shovel);
  cardEls.set(SHOVEL, shovel);
}

function refreshBar() {
  for (const def of plantList) {
    const el = cardEls.get(def.id);
    const cd = state.cooldowns[def.id] ?? 0;
    el.classList.toggle('disabled', cd > 0 || !canAfford(def.cout));
    el.classList.toggle('selected', state.selectedCard === def.id);
    el.querySelector('.card-cooldown').style.height = `${def.recharge ? (cd / def.recharge) * 100 : 0}%`;
  }
  cardEls.get(SHOVEL).classList.toggle('selected', state.selectedCard === SHOVEL);
}

function select(id) {
  state.selectedCard = state.selectedCard === id ? null : id;
  events.emit('cardSelected', { plantId: state.selectedCard });
  refreshBar();
}

function shake(id) {
  const el = cardEls.get(id);
  if (!el) return;
  el.classList.remove('shake');
  void el.offsetWidth;   // relance l'animation CSS
  el.classList.add('shake');
}

function updateCooldowns(dt) {
  for (const id in state.cooldowns) {
    state.cooldowns[id] = Math.max(0, state.cooldowns[id] - dt);
  }
  refreshBar();
}

// ── Clic sur le terrain ───────────────────────────────────────

function canvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) * canvas.width) / rect.width,
    y: ((e.clientY - rect.top) * canvas.height) / rect.height,
  };
}

function onPointerDown(e) {
  if (state.status !== 'playing' || e.button === 2) return;
  const { x, y } = canvasPos(e);

  // 1. Ramasser un bonbon est prioritaire
  if (tryCollectAt(x, y)) return;

  const cell = pixelToCell(x, y);
  const id = state.selectedCard;
  if (!cell || !id) return;

  // 2. Pelle
  if (id === SHOVEL) {
    if (game.removePlant(cell.row, cell.col)) select(null);
    return;
  }

  // 3. Poser une plante
  const def = game.plantDefs[id];
  if ((state.cooldowns[id] ?? 0) > 0 || !canAfford(def.cout)) {
    shake(id);
    return;
  }
  if (game.placePlant(id, cell.row, cell.col)) {
    spend(def.cout);
    state.cooldowns[id] = def.recharge ?? 0;
    select(null);
  }
}

// ── Aperçu de placement (dessiné sur le canvas) ───────────────

function drawPreview(ctx) {
  if (state.status !== 'playing' || !hoverCell || !state.selectedCard) return;
  const { row, col } = hoverCell;
  const c = cellCenter(row, col);
  const occupied = !!getPlantAt(row, col);
  const isShovel = state.selectedCard === SHOVEL;
  const ok = isShovel ? occupied : !occupied;

  ctx.save();
  ctx.fillStyle = ok ? 'rgba(255, 200, 100, 0.22)' : 'rgba(224, 69, 74, 0.25)';
  ctx.fillRect(c.x - CELL_W / 2, c.y - CELL_H / 2, CELL_W, CELL_H);
  ctx.restore();

  if (!isShovel && !occupied) {
    drawSprite(ctx, game.plantDefs[state.selectedCard], c.x, c.y, 72, { alpha: 0.5 });
  }
}
