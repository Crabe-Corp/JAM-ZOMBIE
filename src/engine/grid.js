// =============================================================
//  GRILLE — rôle A (moteur)
//  Conversions pixel ↔ case et accès aux plantes posées.
// =============================================================
import { ROWS, COLS, CELL_W, CELL_H, GRID_X, GRID_Y } from '../config.js';
import { state } from '../state.js';

/** Centre (en pixels) d'une case. */
export function cellCenter(row, col) {
  return { x: GRID_X + col * CELL_W + CELL_W / 2, y: rowCenterY(row) };
}

/** Y du centre d'une ligne. */
export function rowCenterY(row) {
  return GRID_Y + row * CELL_H + CELL_H / 2;
}

/** Case sous un point en pixels, ou null si hors de la grille. */
export function pixelToCell(x, y) {
  const col = Math.floor((x - GRID_X) / CELL_W);
  const row = Math.floor((y - GRID_Y) / CELL_H);
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
  return { row, col };
}

/** Plante vivante sur une case, ou null. */
export function getPlantAt(row, col) {
  return state.plants.find((p) => p.row === row && p.col === col && !p.dead) || null;
}

/** Dessine les cases (damier semi-transparent par-dessus le décor de C). */
export function drawGrid(ctx) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.fillStyle = (r + c) % 2 ? 'rgba(46, 80, 46, 0.45)' : 'rgba(32, 62, 38, 0.45)';
      ctx.fillRect(GRID_X + c * CELL_W, GRID_Y + r * CELL_H, CELL_W, CELL_H);
    }
  }
}
