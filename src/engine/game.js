// =============================================================
//  GAME — rôle A (moteur)
//  Boucle de jeu, mise à jour et dessin de toutes les entités,
//  et l'API publique utilisée par l'interface (B).
//
//  ── API PUBLIQUE (point de contact n°3) ──────────────────────
//    game.newGame(level)                 démarre une partie
//    game.togglePause()
//    game.toggleSpeed()                  bascule vitesse x1 / x2
//    game.chooseUpgrade(id)              choisit une amélioration proposée
//    game.placePlant(typeId, row, col)   → true si posée (B gère le paiement)
//    game.removePlant(row, col)          → la plante retirée ou null
//    game.spawnZombie(typeId, row)       (utile pour tester dans la console)
//    game.addUpdater(fn(dt, game))       B/C ajoutent leur logique à chaque frame
//    game.addLayer(fn(ctx, game))        B/C dessinent par-dessus le jeu
//    game.plantDefs / game.zombieDefs    stats chargées depuis les JSON
//                                        (plantDefs = copie améliorée pendant la partie)
//    game.level                          copie du niveau en cours (améliorable)
//    game.waves.progress                 0 → 1
// =============================================================
import { CANVAS_W, CANVAS_H, ROWS, HOUSE_X, DEBUG } from '../config.js';
import { state, resetState } from '../state.js';
import { events } from '../events.js';
import { drawGrid, getPlantAt, rowCenterY } from './grid.js';
import { Plant } from './entities/plant.js';
import { Zombie } from './entities/zombie.js';
import { Projectile } from './entities/projectile.js';
import { WaveManager } from './waves.js';
import { UpgradeManager } from './upgrades.js';
import { drawBackground, drawSprite } from '../content/assets.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    this.ctx = canvas.getContext('2d');

    this.basePlantDefs = {};
    this.plantDefs = {};
    this.zombieDefs = {};
    this.level = null;
    this.waves = new WaveManager();
    this.upgrades = new UpgradeManager();
    this.updaters = [];
    this.layers = [];
    this.explosions = [];
    this.mowers = this.createMowers();
    this.speedMultiplier = 1;

    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  setData({ plants, zombies, upgrades }) {
    for (const p of plants) this.basePlantDefs[p.id] = p;
    for (const z of zombies) this.zombieDefs[z.id] = z;
    this.plantDefs = structuredClone(this.basePlantDefs);
    this.upgrades.setData(upgrades);
  }

  addUpdater(fn) { this.updaters.push(fn); }
  addLayer(fn) { this.layers.push(fn); }

  // ── Cycle de partie ──────────────────────────────────────────

  newGame(level) {
    // Copies : les améliorations modifient les stats le temps d'une partie seulement
    this.level = structuredClone(level);
    this.plantDefs = structuredClone(this.basePlantDefs);
    this.upgrades.reset();
    resetState({
      status: 'playing',
      resources: level.ressourcesDepart ?? 150,
      speed: this.speedMultiplier,
    });
    this.explosions = [];
    this.mowers = this.createMowers();
    this.waves.reset(this.level);
    events.emit('gameStart', { level: this.level });
  }

  togglePause() {
    if (state.status === 'playing') state.status = 'paused';
    else if (state.status === 'paused') state.status = 'playing';
    else return;
    events.emit('pauseChanged', { paused: state.status === 'paused' });
  }

  toggleSpeed() {
    this.speedMultiplier = this.speedMultiplier === 1 ? 2 : 1;
    state.speed = this.speedMultiplier;
    events.emit('speedChanged', { speed: this.speedMultiplier });
    return this.speedMultiplier;
  }

  setSpeed(speed) {
    this.speedMultiplier = speed === 2 ? 2 : 1;
    state.speed = this.speedMultiplier;
    events.emit('speedChanged', { speed: this.speedMultiplier });
  }

  chooseUpgrade(id) {
    if (state.status !== 'choosing') return false;
    return this.upgrades.choose(id, this);
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

  // ── Balais de sorcière (tondeuses de dernier secours) ────────

  createMowers() {
    return Array.from({ length: ROWS }, (_, r) => ({
      row: r,
      x: HOUSE_X + 12,
      y: rowCenterY(r),
      state: 'idle',   // 'idle' | 'sweeping' | 'used'
      speed: 440,
      def: { id: '__balai__', emoji: '🧹' },
    }));
  }

  tryTriggerMower(row) {
    const mower = this.mowers[row];
    if (!mower || mower.state === 'used') return false;
    if (mower.state === 'idle') {
      mower.state = 'sweeping';
    }
    return true;
  }

  updateMowers(dt) {
    for (const m of this.mowers) {
      if (m.state === 'idle') {
        const triggered = state.zombies.some(
          (z) => !z.dead && !z.dying && z.row === m.row && z.x <= m.x + 18,
        );
        if (triggered) m.state = 'sweeping';
      }

      if (m.state === 'sweeping') {
        m.x += m.speed * dt;
        for (const z of state.zombies) {
          if (!z.dead && !z.dying && z.row === m.row && z.x <= m.x + 30 && z.x >= m.x - 45) {
            z.takeDamage(z.hp + 9999);
          }
        }
        if (m.x > CANVAS_W + 45) {
          m.state = 'used';
        }
      }
    }
  }

  drawMowers(ctx, realTime) {
    for (const m of this.mowers) {
      if (m.state === 'used') continue;
      const bob = m.state === 'sweeping' ? Math.sin(realTime * 28) * 4 : 0;
      drawSprite(ctx, m.def, m.x, m.y + bob, 54);
    }
  }

  // ── Explosions (plante explosif 💣) ──────────────────────────

  /** Zombies vivants à moins de `radius` px de (x, y). */
  zombiesInRadius(x, y, radius) {
    return state.zombies.filter(
      (z) => !z.dead && !z.dying && z.x < CANVAS_W && Math.hypot(z.x - x, z.y - y) <= radius,
    );
  }

  triggerExplosion(x, y, radius, damage) {
    for (const z of this.zombiesInRadius(x, y, radius)) z.takeDamage(damage);
    this.explosions.push({ x, y, radius, timer: 0, duration: 0.35, kind: 'feu' });
  }

  // ── Gel (plante gel 🧊) ──────────────────────────────────────

  triggerFreeze(x, y, radius, duration, damage, after = {}) {
    for (const z of this.zombiesInRadius(x, y, radius)) {
      z.takeDamage(damage);
      z.applyFreeze(duration, after.factor, after.duration);
    }
    this.explosions.push({ x, y, radius, timer: 0, duration: 0.5, kind: 'gel' });
  }

  updateExplosions(dt) {
    for (const ex of this.explosions) ex.timer += dt;
    this.explosions = this.explosions.filter((ex) => ex.timer < ex.duration);
  }

  drawExplosions(ctx) {
    for (const ex of this.explosions) {
      const t = Math.min(1, ex.timer / ex.duration);
      const currentR = ex.radius * (0.3 + 0.7 * t);
      ctx.save();
      ctx.globalAlpha = 1 - t;
      const grad = ctx.createRadialGradient(ex.x, ex.y, 4, ex.x, ex.y, currentR);
      const ice = ex.kind === 'gel';
      grad.addColorStop(0, ice ? 'rgba(235, 250, 255, 0.95)' : 'rgba(255, 240, 150, 0.95)');
      grad.addColorStop(0.5, ice ? 'rgba(120, 200, 255, 0.6)' : 'rgba(255, 120, 20, 0.65)');
      grad.addColorStop(1, ice ? 'rgba(80, 160, 255, 0)' : 'rgba(255, 50, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, currentR, 0, Math.PI * 2);
      ctx.fill();
      drawSprite(ctx, { id: '__explosion__', emoji: ice ? '❄️' : '💥' }, ex.x, ex.y, 84 * (0.8 + 0.5 * t), {
        alpha: 1 - t,
      });
      ctx.restore();
    }
  }

  // ── Boucle de jeu ────────────────────────────────────────────

  loop = (now) => {
    // deltaTime en secondes, plafonné (si l'onglet a été mis en arrière-plan)
    const rawDt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;
    const speed = state.speed ?? this.speedMultiplier ?? 1;
    const dt = rawDt * speed;
    if (state.status === 'playing') this.update(dt);
    this.draw(now / 1000);
    requestAnimationFrame(this.loop);
  };

  update(dt) {
    state.time += dt;
    this.waves.update(dt, this);
    this.updateExplosions(dt);

    for (const p of state.plants) p.update(dt, this);
    for (const z of state.zombies) z.update(dt, this);
    for (const pr of state.projectiles) pr.update(dt, this);
    this.updateMowers(dt);
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
    this.drawMowers(ctx, realTime);

    // Ligne par ligne, pour que les zombies passent devant les plantes de leur ligne
    for (let r = 0; r < ROWS; r++) {
      for (const p of state.plants) if (p.row === r) p.draw(ctx);
      for (const z of state.zombies) if (z.row === r) z.draw(ctx);
    }
    for (const pr of state.projectiles) pr.draw(ctx);
    this.drawExplosions(ctx);

    for (const fn of this.layers) fn(ctx, this);   // bonbons, aperçu de placement (B)

    if (DEBUG) this.drawDebug(ctx);
  }

  drawDebug(ctx) {
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(
      `t=${state.time.toFixed(1)}s  x${state.speed ?? this.speedMultiplier}  plantes=${state.plants.length}  zombies=${state.zombies.length}  proj=${state.projectiles.length}`,
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
    const plant = new Plant(def, row, col, this);
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

  spawnProjectile(plant, row = plant.row) {
    const d = plant.def;
    const isSlow = d.type === 'ralentisseur' || (d.dureeRalentissement ?? 0) > 0;
    const projectile = new Projectile({
      x: plant.x + 24,
      y: rowCenterY(row) - 8,
      row,
      damage: d.degats ?? 15,
      speed: d.vitesseProjectile ?? 320,
      color: d.couleurProjectile ?? (isSlow ? '#9be7ff' : '#ff8c1a'),
      slowDuration: isSlow ? (d.dureeRalentissement ?? 3) : 0,
      slowFactor: d.facteurVitesse ?? d.ralentissement ?? 0.5,
      pierce: d.perforation ?? 0,
      burnDps: d.degatsBrulure ?? 0,
      burnDuration: d.dureeBrulure ?? 0,
    });
    state.projectiles.push(projectile);
    events.emit('projectileFired', { projectile, plant });
  }

  /** Potion lancée en cloche sur un zombie précis (plante lanceur 🧪). */
  spawnLob(plant, target) {
    const d = plant.def;
    const projectile = new Projectile({
      x: plant.x,
      y: plant.y - 20,
      row: plant.row,
      damage: d.degats ?? 30,
      color: d.couleurProjectile ?? '#7dff5a',
      slowDuration: d.dureeRalentissement ?? 0,
      slowFactor: d.facteurVitesse ?? 0.5,
      lob: {
        target,
        duration: d.dureeVol ?? 1,
        splashRadius: d.rayonEclaboussure ?? 0,
        splashDamage: d.degatsEclaboussure ?? 0,
      },
    });
    state.projectiles.push(projectile);
    events.emit('projectileFired', { projectile, plant });
  }

  /** Un zombie visible est-il devant cette position, sur cette ligne ? */
  hasZombieAhead(row, x) {
    return state.zombies.some(
      (z) => !z.dead && !z.dying && z.row === row && z.x > x && z.x < CANVAS_W - 10,
    );
  }

  /** Premier zombie visible devant cette position (le plus proche), ou null. */
  firstZombieAhead(row, x) {
    let best = null;
    for (const z of state.zombies) {
      if (z.dead || z.dying || z.row !== row || z.x <= x || z.x >= CANVAS_W - 10) continue;
      if (!best || z.x < best.x) best = z;
    }
    return best;
  }

  /** Plante que le zombie touche (la plus à droite devant lui), ou null. */
  plantBlocking(row, x) {
    let best = null;
    for (const p of state.plants) {
      if (p.dead || p.row !== row || p.isHidden) continue;   // piège armé : caché sous terre
      if (p.x < x && x - p.x < 50 && (!best || p.x > best.x)) best = p;
    }
    return best;
  }

  /** Zombie touché par un projectile, ou null. */
  zombieHitBy(projectile) {
    for (const z of state.zombies) {
      if (z.dead || z.dying || z.row !== projectile.row || z.x > CANVAS_W) continue;
      if (projectile.ignoredZombies && projectile.ignoredZombies.has(z)) continue;
      if (Math.abs(z.x - projectile.x) < 24) return z;
    }
    return null;
  }
}
