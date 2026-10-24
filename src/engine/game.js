// =============================================================
//  GAME — rôle A (moteur)
//  Boucle de jeu, mise à jour et dessin de toutes les entités,
//  et l'API publique utilisée par l'interface (B).
//
//  ── API PUBLIQUE (point de contact n°3) ──────────────────────
//    game.newGame(level)                 démarre une partie
//    game.togglePause()
//    game.placePlant(typeId, row, col)   → true si posée (B gère le paiement)
//    game.removePlant(row, col)          → la plante retirée ou null
//    game.spawnZombie(typeId, row)       (utile pour tester dans la console)
//    game.addUpdater(fn(dt, game))       B/C ajoutent leur logique à chaque frame
//    game.addLayer(fn(ctx, game))        B/C dessinent par-dessus le jeu
//    game.plantDefs / game.zombieDefs    stats chargées depuis les JSON
//    game.waves.progress                 0 → 1
// =============================================================
import { CANVAS_W, CANVAS_H, ROWS, DEBUG } from '../config.js';
import { state, resetState } from '../state.js';
import { events } from '../events.js';
import { drawGrid, getPlantAt } from './grid.js';
import { Plant } from './entities/plant.js';
import { Zombie } from './entities/zombie.js';
import { Projectile } from './entities/projectile.js';
import { WaveManager } from './waves.js';
import { drawBackground } from '../content/assets.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    this.ctx = canvas.getContext('2d');

    this.plantDefs = {};
    this.zombieDefs = {};
    this.level = null;
    this.waves = new WaveManager();
    this.updaters = [];
    this.layers = [];

    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  setData({ plants, zombies }) {
    for (const p of plants) this.plantDefs[p.id] = p;
    for (const z of zombies) this.zombieDefs[z.id] = z;
  }

  addUpdater(fn) { this.updaters.push(fn); }
  addLayer(fn) { this.layers.push(fn); }

  // ── Cycle de partie ──────────────────────────────────────────

  newGame(level) {
    this.level = level;
    resetState({ status: 'playing', resources: level.ressourcesDepart ?? 150 });
    this.waves.reset(level);
    events.emit('gameStart', { level });
  }

  togglePause() {
    if (state.status === 'playing') state.status = 'paused';
    else if (state.status === 'paused') state.status = 'playing';
    else return;
    events.emit('pauseChanged', { paused: state.status === 'paused' });
  }

  lose() {
    if (state.status !== 'playing') return;
    state.status = 'lost';
    events.emit('gameOver', { win: false });
  }

  win() {
    if (state.status !== 'playing') return;
    state.status = 'won';
    events.emit('gameOver', { win: true });
  }

  // ── Boucle de jeu ────────────────────────────────────────────

  loop = (now) => {
    // deltaTime en secondes, plafonné (si l'onglet a été mis en arrière-plan)
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;
    if (state.status === 'playing') this.update(dt);
    this.draw(now / 1000);
    requestAnimationFrame(this.loop);
  };

  update(dt) {
    state.time += dt;
    this.waves.update(dt, this);

    for (const p of state.plants) p.update(dt, this);
    for (const z of state.zombies) z.update(dt, this);
    for (const pr of state.projectiles) pr.update(dt, this);
    for (const fn of this.updaters) fn(dt, this);

    // Nettoyage des entités mortes
    state.plants = state.plants.filter((p) => !p.dead);
    state.zombies = state.zombies.filter((z) => !z.dead);
    state.projectiles = state.projectiles.filter((p) => !p.dead);

    if (this.waves.finished && state.zombies.length === 0) this.win();
  }

  draw(realTime) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    drawBackground(ctx, realTime);   // décor de C
    drawGrid(ctx);

    // Ligne par ligne, pour que les zombies passent devant les plantes de leur ligne
    for (let r = 0; r < ROWS; r++) {
      for (const p of state.plants) if (p.row === r) p.draw(ctx);
      for (const z of state.zombies) if (z.row === r) z.draw(ctx);
    }
    for (const pr of state.projectiles) pr.draw(ctx);

    for (const fn of this.layers) fn(ctx, this);   // bonbons, aperçu de placement (B)

    if (DEBUG) this.drawDebug(ctx);
  }

  drawDebug(ctx) {
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(
      `t=${state.time.toFixed(1)}s  plantes=${state.plants.length}  zombies=${state.zombies.length}  proj=${state.projectiles.length}`,
      8, 14,
    );
  }

  // ── API utilisée par B ───────────────────────────────────────

  placePlant(typeId, row, col) {
    if (state.status !== 'playing') return false;
    const def = this.plantDefs[typeId];
    if (!def) {
      console.warn(`[game] plante inconnue : "${typeId}"`);
      return false;
    }
    if (getPlantAt(row, col)) return false;
    const plant = new Plant(def, row, col);
    state.plants.push(plant);
    events.emit('plantPlaced', { plant });
    return true;
  }

  removePlant(row, col) {
    const plant = getPlantAt(row, col);
    if (!plant) return null;
    plant.dead = true;
    events.emit('plantRemoved', { plant });
    return plant;
  }

  spawnZombie(typeId, row = Math.floor(Math.random() * ROWS)) {
    const def = this.zombieDefs[typeId];
    if (!def) {
      console.warn(`[game] zombie inconnu : "${typeId}"`);
      return null;
    }
    const zombie = new Zombie(def, row);
    state.zombies.push(zombie);
    events.emit('zombieSpawned', { zombie });
    return zombie;
  }

  // ── Helpers utilisés par les entités ─────────────────────────

  spawnProjectile(plant) {
    const d = plant.def;
    const projectile = new Projectile({
      x: plant.x + 24,
      y: plant.y - 8,
      row: plant.row,
      damage: d.degats,
      speed: d.vitesseProjectile ?? 320,
      color: d.couleurProjectile ?? '#ff8c1a',
    });
    state.projectiles.push(projectile);
    events.emit('projectileFired', { projectile, plant });
  }

  /** Un zombie visible est-il devant cette position, sur cette ligne ? */
  hasZombieAhead(row, x) {
    return state.zombies.some((z) => !z.dead && z.row === row && z.x > x && z.x < CANVAS_W - 10);
  }

  /** Plante que le zombie touche (la plus à droite devant lui), ou null. */
  plantBlocking(row, x) {
    let best = null;
    for (const p of state.plants) {
      if (p.dead || p.row !== row) continue;
      if (p.x < x && x - p.x < 50 && (!best || p.x > best.x)) best = p;
    }
    return best;
  }

  /** Zombie touché par un projectile, ou null. */
  zombieHitBy(projectile) {
    for (const z of state.zombies) {
      if (z.dead || z.row !== projectile.row || z.x > CANVAS_W) continue;
      if (Math.abs(z.x - projectile.x) < 24) return z;
    }
    return null;
  }
}
