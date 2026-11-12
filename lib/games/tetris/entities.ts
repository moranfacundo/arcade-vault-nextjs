import { COLORS, COLS, PIECES, PIECE_TYPES } from "./constants";

export type Board = number[][];
export type Shape = number[][];

export interface Piece {
  type: number;
  shape: Shape;
  x: number;
  y: number;
}

export function randomPiece(): Piece {
  const type = Math.floor(Math.random() * PIECE_TYPES) + 1;
  const shape = PIECES[type].map((row) => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
}

export function rotateCW(shape: Shape): Shape {
  const rows = shape.length;
  const cols = shape[0].length;
  const result: Shape = Array.from({ length: cols }, () => new Array<number>(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
  return result;
}

/** Dibuja un bloque de celda (x, y) en `size` px, desplazado (offX, offY) px. */
export function drawBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  colorIndex: number,
  size: number,
  offX = 0,
  offY = 0,
  alpha = 1,
) {
  if (!colorIndex) return;
  const px = offX + x * size;
  const py = offY + y * size;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = COLORS[colorIndex];
  ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(px + 1, py + 1, size - 2, 4);
  ctx.globalAlpha = 1;
}
