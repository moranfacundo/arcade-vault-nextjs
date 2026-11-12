/** Valores del original (references/started-games/03-tetris/game.js). */
export const COLS = 10;
export const ROWS = 20;
export const BLOCK = 30;

/** Canvas lógico 800×600 (4:3, contrato SPEC 07). */
export const W = 800;
export const H = 600;

/** El tablero (300×600) va a la izquierda del centro; el panel NEXT/LÍNEAS a su derecha. */
export const BOARD_X = 150;
export const BOARD_Y = 0;
export const PANEL_X = 490;

/** Índice 0 = celda vacía; 1–8 = I, O, T, S, Z, J, L, N (tuerca). */
export const COLORS = [
  "",
  "#4dd0e1", // I
  "#ffd54f", // O
  "#ba68c8", // T
  "#81c784", // S
  "#e57373", // Z
  "#90caf9", // J
  "#ffb74d", // L
  "#9e9e9e", // N (tuerca, gris metálico)
];

export const PIECES: readonly (readonly (readonly number[])[])[] = [
  [],
  [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
  [[2, 2], [2, 2]], // O
  [[0, 3, 0], [3, 3, 3], [0, 0, 0]], // T
  [[0, 4, 4], [4, 4, 0], [0, 0, 0]], // S
  [[5, 5, 0], [0, 5, 5], [0, 0, 0]], // Z
  [[6, 0, 0], [6, 6, 6], [0, 0, 0]], // J
  [[0, 0, 7], [7, 7, 7], [0, 0, 0]], // L
  [[8, 8, 8], [8, 0, 8], [8, 8, 8]], // N
];

export const PIECE_TYPES = PIECES.length - 1;

export const LINE_SCORES = [0, 100, 300, 500, 800];
export const LINES_PER_LEVEL = 10;
export const KICKS = [0, -1, 1, -2, 2];
export const BASE_DROP_MS = 1000;
export const MIN_DROP_MS = 100;
export const DROP_STEP_MS = 90;
/** Tope de dt por frame (contrato de loop de la plataforma). */
export const MAX_DT_MS = 50;

/** Colores de la presentación dentro del canvas (el original los ponía con CSS). */
export const COLOR_BG = "#0f0f17";
export const COLOR_BOARD_BG = "#1a1a25";
export const COLOR_BORDER = "#2a2a3a";
export const COLOR_GRID = "#22222e";
export const COLOR_LABEL = "#9a9ab8";
export const COLOR_VALUE = "#4dd0e1";
