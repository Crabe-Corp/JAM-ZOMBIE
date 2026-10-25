// =============================================================
//  PARTICULES — rôle C (contenu)
//
//  Petits effets purement visuels, branchés sur les événements du moteur :
//    projectileHit → étincelles à l'impact
//    zombieDied    → nuage de poussière
//    plantUsed     → éclats de glace (givre), braises (bombe), poussière (piège)
//  Elles vivent dans un tableau mis à jour par game.addUpdater (donc
//  figées en pause, accélérées en x2) et dessinées par game.addLayer.
// =============================================================
import { events } from '../events.js';

const MAX_PARTICLES = 400;   // plafond : évite de ralentir les grosses vagues

let particles = [];

/**
 * Crée `count` particules autour de (x, y).
 * opts : colors[], speed [min, max] px/s, life [min, max] s, size [min, max] px,
 *        gravity px/s², angle [début, fin] en radians (défaut : tous les sens)
 */
function burst(x, y, count, opts) {
  const { colors, speed, life, size, gravity = 0, angle = [0, Math.PI * 2] } = opts;
  for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
    const a = rand(angle[0], angle[1]);
    const v = rand(speed[0], speed[1]);
    const ttl = rand(life[0], life[1]);
    particles.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      gravity,
      ttl,
      life: ttl,
      size: rand(size[0], size[1]),
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

// ── Effets ────────────────────────────────────────────────────

function sparks(x, y, color) {
  burst(x, y, 7, {
    colors: [color || '#ffd27a', '#fff2c4'],
    speed: [60, 180], life: [0.15, 0.35], size: [2, 4], gravity: 260,
  });
}

function dust(x, y) {
  burst(x, y, 10, {
    colors: ['#8a7f9e', '#6b6280', '#a79db8'],
    speed: [15, 60], life: [0.4, 0.8], size: [5, 11], gravity: -30,
    angle: [Math.PI, Math.PI * 2],   // vers le haut
  });
}

function iceShards(x, y) {
  burst(x, y, 16, {
    colors: ['#e6f9ff', '#9fdcff', '#6cb8ff'],
    speed: [80, 220], life: [0.3, 0.6], size: [3, 6], gravity: 320,
  });
}

function embers(x, y) {
  burst(x, y, 18, {
    colors: ['#ffcf4d', '#ff8c1a', '#ff4d1a'],
    speed: [90, 260], life: [0.3, 0.7], size: [3, 6], gravity: 220,
  });
}

/** Effet choisi selon le type de la plante à usage unique. */
function plantUsedEffect(plant) {
  const { x, y } = plant;
  if (plant.def.type === 'gel') iceShards(x, y);
  else if (plant.def.type === 'explosif') embers(x, y);
  else dust(x, y);
}

// ── Cycle de vie ──────────────────────────────────────────────

function update(dt) {
  for (const p of particles) {
    p.life -= dt;
    p.vy += p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  particles = particles.filter((p) => p.life > 0);
}

function draw(ctx) {
  if (particles.length === 0) return;
  ctx.save();
  for (const p of particles) {
    const t = p.life / p.ttl;   // 1 → 0
    ctx.globalAlpha = Math.min(1, t * 1.5);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.4 + 0.6 * t), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function initParticles(game) {
  game.addUpdater((dt) => update(dt));
  game.addLayer((ctx) => draw(ctx));

  events.on('gameStart', () => { particles = []; });
  events.on('projectileHit', ({ projectile, zombie }) => {
    sparks(projectile.x, zombie.y - 6, projectile.color);
  });
  events.on('zombieDied', ({ zombie }) => {
    dust(zombie.x, zombie.y + (zombie.def.taille ?? 78) * 0.3);
  });
  events.on('plantUsed', ({ plant }) => plantUsedEffect(plant));
}
