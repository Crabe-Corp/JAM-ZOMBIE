// =============================================================
//  ASSETS ET DÉCOR — rôle C (contenu)
//
//  Tant qu'il n'y a pas de dessin, chaque unité est affichée avec
//  son emoji (champ "emoji" du JSON). Pour mettre un vrai dessin :
//    1. déposez l'image dans assets/sprites/ (PNG fond transparent, ~256×256)
//    2. ajoutez "sprite": "assets/sprites/mon-image.png" dans le JSON
//  C'est tout : le moteur l'utilise automatiquement.
// =============================================================
import { CANVAS_W, CANVAS_H, GRID_X, GRID_Y, ROWS, CELL_H } from '../config.js';

const images = {};
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

/** Précharge les sprites déclarés dans les JSON. */
export async function loadSprites(defs) {
  await Promise.all(
    defs.filter((d) => d.sprite).map(
      (d) => new Promise((resolve) => {
        const img = new Image();
        img.onload = () => { images[d.id] = img; resolve(); };
        img.onerror = () => {
          console.warn(`[assets] sprite introuvable pour "${d.id}" (${d.sprite}) → emoji utilisé`);
          resolve();
        };
        img.src = d.sprite;
      }),
    ),
  );
}

/**
 * Dessine une unité (plante ou zombie) centrée sur (x, y).
 * opts : { flash: bool (touché), alpha: 0..1 }
 */
export function drawSprite(ctx, def, x, y, size, opts = {}) {
  ctx.save();
  if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
  if (opts.flash) ctx.filter = 'brightness(1.9)';

  const img = images[def.id];
  if (img) {
    const h = size;
    const w = (size * img.width) / img.height;
    ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
  } else {
    ctx.font = `${Math.round(size * 0.82)}px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.emoji || '❓', x, y + size * 0.05);
  }
  ctx.restore();
}

export function drawHealthBar(ctx, x, y, width, ratio, color) {
  const h = 6;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x - width / 2 - 1, y - 1, width + 2, h + 2);
  ctx.fillStyle = color;
  ctx.fillRect(x - width / 2, y, width * Math.max(0, ratio), h);
}

export function drawProjectile(ctx, p) {
  ctx.save();
  ctx.shadowColor = p.color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(p.x - 3, p.y - 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Décor ─────────────────────────────────────────────────────
// TODO(C) : remplacer par une vraie image de fond :
//   const bg = new Image(); bg.src = 'assets/sprites/fond.png';
//   puis ctx.drawImage(bg, 0, 0, CANVAS_W, CANVAS_H) dans drawBackground.

let staticBg = null;

export function drawBackground(ctx, time) {
  if (!staticBg) staticBg = renderStaticBackground();
  ctx.drawImage(staticBg, 0, 0);
  drawFog(ctx, time);
}

function seeded(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function renderStaticBackground() {
  const c = document.createElement('canvas');
  c.width = CANVAS_W;
  c.height = CANVAS_H;
  const g = c.getContext('2d');
  const rand = seeded(1031);

  // Ciel de nuit / sol
  const sky = g.createLinearGradient(0, 0, 0, CANVAS_H);
  sky.addColorStop(0, '#120c24');
  sky.addColorStop(0.5, '#1a1530');
  sky.addColorStop(1, '#0f1a12');
  g.fillStyle = sky;
  g.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Lune
  const moon = g.createRadialGradient(CANVAS_W - 70, 55, 5, CANVAS_W - 70, 55, 90);
  moon.addColorStop(0, 'rgba(255, 244, 214, 0.9)');
  moon.addColorStop(0.3, 'rgba(255, 230, 170, 0.35)');
  moon.addColorStop(1, 'rgba(255, 230, 170, 0)');
  g.fillStyle = moon;
  g.fillRect(CANVAS_W - 170, 0, 170, 160);
  g.fillStyle = '#fff4d6';
  g.beginPath();
  g.arc(CANVAS_W - 70, 55, 26, 0, Math.PI * 2);
  g.fill();

  // Petites tombes dispersées dans le terrain
  for (let i = 0; i < 26; i++) {
    const x = GRID_X + rand() * (CANVAS_W - GRID_X);
    const y = GRID_Y + rand() * ROWS * CELL_H;
    g.fillStyle = `rgba(120, 120, 140, ${0.12 + rand() * 0.12})`;
    g.beginPath();
    g.roundRect(x, y, 14, 18, [7, 7, 1, 1]);
    g.fill();
  }

  // La maison à défendre (bande de gauche)
  const house = g.createLinearGradient(0, 0, GRID_X, 0);
  house.addColorStop(0, '#2b1d1a');
  house.addColorStop(1, '#3d2a22');
  g.fillStyle = house;
  g.fillRect(0, 0, GRID_X - 10, CANVAS_H);
  g.fillStyle = '#5a3e2e';
  g.fillRect(GRID_X - 14, 0, 6, CANVAS_H);
  for (let r = 0; r < ROWS; r++) {
    const y = GRID_Y + r * CELL_H + 22;
    g.fillStyle = 'rgba(255, 160, 50, 0.85)';
    g.fillRect(28, y, 22, 30);
    g.fillRect(56, y, 22, 30);
    g.fillStyle = '#2b1d1a';
    g.fillRect(50, y, 6, 30);
    g.fillRect(28, y + 13, 50, 4);
  }

  return c;
}

const fogBanks = Array.from({ length: 6 }, (_, i) => ({
  y: GRID_Y + (i / 5) * ROWS * CELL_H,
  speed: 6 + i * 2,
  offset: i * 230,
  r: 140 + (i % 3) * 40,
}));

function drawFog(ctx, time) {
  ctx.save();
  for (const f of fogBanks) {
    const x = ((time * f.speed + f.offset) % (CANVAS_W + 2 * f.r)) - f.r;
    const fog = ctx.createRadialGradient(x, f.y, 10, x, f.y, f.r);
    fog.addColorStop(0, 'rgba(200, 190, 230, 0.10)');
    fog.addColorStop(1, 'rgba(200, 190, 230, 0)');
    ctx.fillStyle = fog;
    ctx.fillRect(x - f.r, f.y - f.r, f.r * 2, f.r * 2);
  }
  ctx.restore();
}
