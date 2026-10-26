// =============================================================
//  CARTES ET PLACEMENT — rôle B (interface)
//  Barre de cartes, sélection, aperçu sur la grille, pose des
//  plantes (paiement + temps de recharge), pelle et glisser-déposer.
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

// Gestion du glisser-déposer au pointeur / tactile
let pointerDragId = null;
let pointerDragStart = null;
let isDragging = false;

export function initCards(g, cv, plants) {
  game = g;
  canvas = cv;
  plantList = plants;
  bar = document.getElementById('card-bar');
  buildBar();

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', () => { hoverCell = null; });
  canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); select(null); });

  // HTML5 Drag & Drop sur le canvas (desktop)
  canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const { x, y } = canvasPos(e);
    if (state.autoCollect) tryCollectAt(x, y);
    hoverCell = pixelToCell(x, y);
  });
  canvas.addEventListener('dragleave', () => {
    hoverCell = null;
  });
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || state.selectedCard;
    const { x, y } = canvasPos(e);
    const cell = pixelToCell(x, y);
    if (cell && id) {
      tryPlacePlant(id, cell.row, cell.col);
    }
    hoverCell = null;
  });

  // Glisser-déposer universel (pointeur / tactile)
  window.addEventListener('pointermove', onWindowPointerMove);
  window.addEventListener('pointerup', onWindowPointerUp);
  window.addEventListener('pointercancel', cancelPointerDrag);

  window.addEventListener('keydown', (e) => {
    if (state.status !== 'playing') return;   // ex. : 1/2/3 servent au choix d'amélioration
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
    el.draggable = true;
    el.title = `${def.nom} (${i + 1})\n${def.description ?? ''}`;
    el.innerHTML = `
      <span class="card-icon">${def.icone || def.sprite ? `<img src="${def.icone || def.sprite}" alt="">` : def.emoji}</span>
      <span class="card-cost">🍬 ${def.cout}</span>
      <span class="card-cooldown"></span>`;

    // Événements clic et drag
    setupCardInteractions(el, def.id);

    bar.appendChild(el);
    cardEls.set(def.id, el);
  });

  const shovel = document.createElement('button');
  shovel.className = 'card shovel';
  shovel.draggable = true;
  shovel.title = 'Retirer une plante (S)';
  shovel.innerHTML = `<span class="card-icon">⛏️</span><span class="card-cost">Retirer</span>`;

  setupCardInteractions(shovel, SHOVEL);

  bar.appendChild(shovel);
  cardEls.set(SHOVEL, shovel);
}

/** Stats à jour de la plante (le coût peut changer avec les améliorations). */
function currentDef(id) {
  return game.plantDefs[id];
}

function isUnavailable(id) {
  if (id === SHOVEL) return false;
  return (state.cooldowns[id] ?? 0) > 0 || !canAfford(currentDef(id)?.cout ?? 0);
}

function setupCardInteractions(el, id) {
  // 1. Clic standard
  el.addEventListener('click', (e) => {
    if (isDragging) {
      e.stopPropagation();
      return;
    }
    select(id);
  });

  // 2. Glisser-déposer HTML5 (desktop)
  el.addEventListener('dragstart', (e) => {
    // Le navigateur prend la main (et annule le glisser au pointeur) : on oublie celui-ci
    cancelPointerDrag();
    if (isUnavailable(id)) {
      e.preventDefault();
      shake(id);
      return;
    }
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'copyMove';
    select(id);
  });

  // 3. Glisser-déposer au pointeur (mobile / tactile / souris)
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (isUnavailable(id)) {
      shake(id);
      return;
    }
    pointerDragId = id;
    pointerDragStart = { x: e.clientX, y: e.clientY };
    isDragging = false;
  });
}

function onWindowPointerMove(e) {
  if (!pointerDragId) return;
  if (!isDragging && pointerDragStart && Math.hypot(e.clientX - pointerDragStart.x, e.clientY - pointerDragStart.y) > 8) {
    isDragging = true;
    select(pointerDragId);
  }
  if (isDragging) {
    const { x, y } = canvasPos(e);
    if (state.autoCollect) tryCollectAt(x, y);
    hoverCell = pixelToCell(x, y);
  }
}

function onWindowPointerUp(e) {
  if (pointerDragId && isDragging) {
    const { x, y } = canvasPos(e);
    const cell = pixelToCell(x, y);
    if (cell) {
      tryPlacePlant(pointerDragId, cell.row, cell.col);
    }
    hoverCell = null;
  }
  pointerDragId = null;
  pointerDragStart = null;
  setTimeout(() => { isDragging = false; }, 50);
}

function cancelPointerDrag() {
  pointerDragId = null;
  pointerDragStart = null;
  isDragging = false;
}

function refreshBar() {
  for (const { id } of plantList) {
    const def = currentDef(id);
    const el = cardEls.get(id);
    const cd = state.cooldowns[id] ?? 0;
    el.classList.toggle('disabled', isUnavailable(id));
    el.classList.toggle('selected', state.selectedCard === id);
    el.querySelector('.card-cooldown').style.height = `${def.recharge ? Math.min(1, cd / def.recharge) * 100 : 0}%`;
    const costText = `🍬 ${def.cout}`;
    const costEl = el.querySelector('.card-cost');
    if (costEl.textContent !== costText) costEl.textContent = costText;
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

// ── Clic et placement sur le terrain ──────────────────────────

function canvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  // Le canvas est en `object-fit: contain` : l'image peut ne pas remplir toute
  // la boîte (bandes vides sur les côtés), on retire donc ce décalage.
  const scale = Math.min(rect.width / canvas.width, rect.height / canvas.height);
  const offsetX = (rect.width - canvas.width * scale) / 2;
  const offsetY = (rect.height - canvas.height * scale) / 2;
  return {
    x: (e.clientX - rect.left - offsetX) / scale,
    y: (e.clientY - rect.top - offsetY) / scale,
  };
}

function onPointerMove(e) {
  const { x, y } = canvasPos(e);
  if (state.autoCollect) tryCollectAt(x, y);
  hoverCell = pixelToCell(x, y);
}

function onPointerDown(e) {
  if (state.status !== 'playing' || e.button === 2) return;
  const { x, y } = canvasPos(e);

  // 1. Ramasser un bonbon est prioritaire
  if (tryCollectAt(x, y)) return;

  const cell = pixelToCell(x, y);
  const id = state.selectedCard;
  if (!cell || !id) return;

  tryPlacePlant(id, cell.row, cell.col);
}

export function tryPlacePlant(id, row, col) {
  if (state.status !== 'playing') return false;

  // 1. Pelle
  if (id === SHOVEL) {
    if (game.removePlant(row, col)) {
      select(null);
      return true;
    }
    return false;
  }

  // 2. Plante
  const def = game.plantDefs[id];
  if (!def) return false;
  if (isUnavailable(id)) {
    shake(id);
    return false;
  }
  if (game.placePlant(id, row, col)) {
    spend(def.cout);
    state.cooldowns[id] = def.recharge ?? 0;
    select(null);
    return true;
  }
  return false;
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
