// =============================================================
//  CONFIG — fichier PARTAGÉ (A, B, C et D le lisent)
//  Toute modification ici doit être annoncée à l'équipe.
// =============================================================

export const ROWS = 5;          // lignes de la grille
export const COLS = 9;          // colonnes de la grille
export const CELL_W = 90;       // largeur d'une case (px)
export const CELL_H = 96;       // hauteur d'une case (px)

export const GRID_X = 110;      // marge gauche (la maison à défendre)
export const GRID_Y = 20;       // marge haute

export const CANVAS_W = GRID_X + COLS * CELL_W + 80;   // 1000 px
export const CANVAS_H = GRID_Y * 2 + ROWS * CELL_H;    // 520 px

export const ZOMBIE_SPAWN_X = CANVAS_W + 30;  // les zombies apparaissent hors écran à droite
export const HOUSE_X = GRID_X - 35;           // un zombie qui dépasse ce x = défaite

export const DEBUG = false;     // true = affiche des infos de debug (hitbox, etc.)
