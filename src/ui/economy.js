// =============================================================
//  ÉCONOMIE — rôle B (interface)
//  La ressource du jeu : les bonbons 🍬.
//  Ils tombent du ciel ou sont produits par les bougies, et on
//  clique dessus pour les ramasser.
// =============================================================
import { state } from '../state.js';
import { events } from '../events.js';
import { GRID_X, GRID_Y, COLS, ROWS, CELL_W, CELL_H } from '../config.js';

const RESOURCE_EMOJI = '🍬';
const LIFETIME = 10;      // secondes avant qu'un bonbon posé disparaisse
const PICK_RADIUS = 40;   // rayon de clic (px)
const FALL_SPEED = 70;    // px/s

const candies = [];
const collectedLabels = [];
let skyTimer = 0;
let skyInterval = 9;
let skyValue = 25;

export function initEconomy(game) {
  events.on('resourceProduced', ({ x, y, amount }) => {
    spawnCandy(x + (Math.random() * 30 - 15), y - 30, y + 18, amount);
  });
  game.addUpdater(update);
  game.addLayer(draw);
}

export function resetEconomy(level) {
  candies.length = 0;
  collectedLabels.length = 0;
  skyInterval = level.intervalleCiel ?? 9;
  skyValue = level.valeurBonbonCiel ?? 25;
  skyTimer = 4;
  emitChange();
}

// ── API utilisée par cards.js ─────────────────────────────────

export function canAfford(amount) {
  return state.resources >= amount;
}

export function spend(amount) {
  if (!canAfford(amount)) return false;
  state.resources -= amount;
  emitChange();
  return true;
}

export function addResources(amount) {
  state.resources += amount;
  emitChange();
}

/** Ramasse le bonbon sous le clic. Renvoie true si un bonbon a été ramassé. */
export function tryCollectAt(x, y) {
  for (let i = candies.length - 1; i >= 0; i--) {
    const c = candies[i];
    if (Math.hypot(c.x - x, c.y - y) < PICK_RADIUS) {
      candies.splice(i, 1);
      collectedLabels.push({ x: c.x, y: c.y, amount: c.amount, age: 0 });
      addResources(c.amount);
      return true;
    }
  }
  return false;
}

/** Ramasse tous les bonbons posés (utile pour une option « ramassage auto » ou pour tester). */
export function collectAll() {
  for (const c of [...candies]) if (c.landed) tryCollectAt(c.x, c.y);
}

// ── Interne ───────────────────────────────────────────────────

function emitChange() {
  events.emit('resourcesChanged', { resources: state.resources });
}

function spawnCandy(x, y, targetY, amount) {
  candies.push({ x, y, targetY, amount, age: 0, landed: false, spin: Math.random() * 6 });
}

function update(dt) {
  // Bonbons qui tombent du ciel
  skyTimer -= dt;
  if (skyTimer <= 0) {
    skyTimer = skyInterval;
    const x = GRID_X + CELL_W / 2 + Math.random() * (COLS - 1) * CELL_W;
    const targetY = GRID_Y + CELL_H / 2 + Math.random() * (ROWS - 1) * CELL_H;
    spawnCandy(x, -30, targetY, skyValue);
  }

  for (const c of candies) {
    c.spin += dt * 3;
    if (!c.landed) {
      c.y += FALL_SPEED * dt;
      if (c.y >= c.targetY) {
        c.y = c.targetY;
        c.landed = true;
      }
    } else {
      c.age += dt;
    }
  }

  for (let i = candies.length - 1; i >= 0; i--) {
    if (candies[i].age > LIFETIME) candies.splice(i, 1);
  }

  for (const label of collectedLabels) {
    label.age += dt;
    label.y -= 25 * dt;
  }
  for (let i = collectedLabels.length - 1; i >= 0; i--) {
    if (collectedLabels[i].age > 1.2) collectedLabels.splice(i, 1);
  }
}

function draw(ctx) {
  for (const c of candies) {
    const fade = c.age > LIFETIME - 2 ? (LIFETIME - c.age) / 2 : 1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, fade) * (c.age > LIFETIME - 2 ? 0.6 + 0.4 * Math.sin(c.age * 20) : 1);

    // Halo pour qu'on le voie bien
    const glow = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, 30);
    glow.addColorStop(0, 'rgba(255, 190, 90, 0.7)');
    glow.addColorStop(1, 'rgba(255, 190, 90, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(c.x, c.y);
    ctx.rotate(Math.sin(c.spin) * 0.3);
    ctx.font = '34px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(RESOURCE_EMOJI, 0, 2);
    ctx.restore();
  }

  for (const label of collectedLabels) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - label.age / 1.2);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#fff4a3';
    ctx.strokeStyle = '#542b12';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(`+${label.amount}`, label.x, label.y);
    ctx.fillText(`+${label.amount}`, label.x, label.y);
    ctx.restore();
  }
}
