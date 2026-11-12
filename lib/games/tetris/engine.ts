import {
  BASE_DROP_MS,
  BLOCK,
  BOARD_X,
  BOARD_Y,
  COLOR_BG,
  COLOR_BOARD_BG,
  COLOR_BORDER,
  COLOR_GRID,
  COLOR_LABEL,
  COLOR_VALUE,
  COLS,
  DROP_STEP_MS,
  H,
  KICKS,
  LINES_PER_LEVEL,
  LINE_SCORES,
  MAX_DT_MS,
  MIN_DROP_MS,
  PANEL_X,
  ROWS,
  W,
} from "./constants";
import { drawBlock, randomPiece, rotateCW } from "./entities";
import type { Board, Piece, Shape } from "./entities";
import { createInput } from "./input";
import type { GameCallbacks, GameEngine } from "../types";

/** Tetris reporta puntuación, nivel y fin; no tiene vidas. */
export type TetrisCallbacks = Required<Pick<GameCallbacks, "onScore" | "onGameOver" | "onLevel">>;

export type TetrisGame = GameEngine;

const NEXT_BOX = 4 * BLOCK;
const NEXT_Y = 220;

export function createTetris(canvas: HTMLCanvasElement, cb: TetrisCallbacks): TetrisGame {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");
  canvas.width = W;
  canvas.height = H;

  let board: Board = [];
  let current: Piece = randomPiece();
  let next: Piece = randomPiece();
  let score = 0;
  let lines = 0;
  let level = 1;
  let dropInterval = BASE_DROP_MS;
  let dropAccum = 0;

  let paused = false;
  let ended = false;
  let rafId = 0;
  let lastTime: number | null = null;
  let destroyed = false;

  const setScore = (v: number) => {
    score = v;
    cb.onScore(score);
  };
  const setLevel = (v: number) => {
    level = v;
    cb.onLevel(level);
  };

  function collide(shape: Shape, ox: number, oy: number): boolean {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nx = ox + c;
        const ny = oy + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
    }
    return false;
  }

  function tryRotate() {
    const rotated = rotateCW(current.shape);
    for (const kick of KICKS) {
      if (!collide(rotated, current.x + kick, current.y)) {
        current.shape = rotated;
        current.x += kick;
        return;
      }
    }
  }

  function merge() {
    for (let r = 0; r < current.shape.length; r++)
      for (let c = 0; c < current.shape[r].length; c++)
        if (current.shape[r][c]) board[current.y + r][current.x + c] = current.shape[r][c];
  }

  function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every((v) => v !== 0)) {
        board.splice(r, 1);
        board.unshift(new Array<number>(COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (!cleared) return;
    lines += cleared;
    setScore(score + (LINE_SCORES[cleared] || 0) * level);
    const newLevel = Math.floor(lines / LINES_PER_LEVEL) + 1;
    if (newLevel !== level) setLevel(newLevel);
    dropInterval = Math.max(MIN_DROP_MS, BASE_DROP_MS - (level - 1) * DROP_STEP_MS);
  }

  function ghostY(): number {
    let gy = current.y;
    while (!collide(current.shape, current.x, gy + 1)) gy++;
    return gy;
  }

  function gameOver() {
    if (ended) return;
    ended = true;
    input.setEnabled(false);
    cb.onGameOver(score);
  }

  function spawn() {
    current = next;
    next = randomPiece();
    if (collide(current.shape, current.x, current.y)) gameOver();
  }

  function lockPiece() {
    merge();
    clearLines();
    spawn();
  }

  function hardDrop() {
    const gy = ghostY();
    setScore(score + (gy - current.y) * 2);
    current.y = gy;
    lockPiece();
  }

  function softDrop() {
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
      setScore(score + 1);
    } else {
      lockPiece();
    }
  }

  function onKey(code: string) {
    if (paused || ended) return;
    switch (code) {
      case "ArrowLeft":
        if (!collide(current.shape, current.x - 1, current.y)) current.x--;
        break;
      case "ArrowRight":
        if (!collide(current.shape, current.x + 1, current.y)) current.x++;
        break;
      case "ArrowDown":
        softDrop();
        break;
      case "ArrowUp":
      case "KeyX":
        tryRotate();
        break;
      case "Space":
        hardDrop();
        break;
    }
  }

  const input = createInput(onKey);

  function initGame() {
    board = Array.from({ length: ROWS }, () => new Array<number>(COLS).fill(0));
    lines = 0;
    dropInterval = BASE_DROP_MS;
    dropAccum = 0;
    ended = false;
    next = randomPiece();
    spawn();
    setScore(0);
    setLevel(1);
  }

  function update(dt: number) {
    dropAccum += dt;
    if (dropAccum < dropInterval) return;
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) current.y++;
    else lockPiece();
  }

  function drawText(text: string, x: number, y: number, font: string, color: string) {
    if (!ctx) return;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(text, x, y);
  }

  function drawBoard() {
    if (!ctx) return;
    ctx.fillStyle = COLOR_BOARD_BG;
    ctx.fillRect(BOARD_X, BOARD_Y, COLS * BLOCK, ROWS * BLOCK);

    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 0.5;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(BOARD_X + c * BLOCK, BOARD_Y);
      ctx.lineTo(BOARD_X + c * BLOCK, BOARD_Y + ROWS * BLOCK);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(BOARD_X, BOARD_Y + r * BLOCK);
      ctx.lineTo(BOARD_X + COLS * BLOCK, BOARD_Y + r * BLOCK);
      ctx.stroke();
    }

    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) drawBlock(ctx, c, r, board[r][c], BLOCK, BOARD_X, BOARD_Y);

    const gy = ghostY();
    for (let r = 0; r < current.shape.length; r++)
      for (let c = 0; c < current.shape[r].length; c++)
        if (current.shape[r][c])
          drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, BOARD_X, BOARD_Y, 0.2);

    for (let r = 0; r < current.shape.length; r++)
      for (let c = 0; c < current.shape[r].length; c++)
        drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK, BOARD_X, BOARD_Y);

    ctx.strokeStyle = COLOR_BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(BOARD_X - 0.5, BOARD_Y + 0.5, COLS * BLOCK + 1, ROWS * BLOCK - 1);
  }

  function drawPanel() {
    if (!ctx) return;
    drawText("LÍNEAS", PANEL_X, 40, "700 26px monospace", COLOR_LABEL);
    drawText(String(lines), PANEL_X, 76, "700 48px monospace", COLOR_VALUE);
    drawText("NEXT", PANEL_X, 176, "700 26px monospace", COLOR_LABEL);

    ctx.fillStyle = COLOR_BOARD_BG;
    ctx.fillRect(PANEL_X, NEXT_Y, NEXT_BOX, NEXT_BOX);
    ctx.strokeStyle = COLOR_BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(PANEL_X + 0.5, NEXT_Y + 0.5, NEXT_BOX - 1, NEXT_BOX - 1);

    const shape = next.shape;
    const offX = Math.floor((4 - shape[0].length) / 2);
    const offY = Math.floor((4 - shape.length) / 2);
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        drawBlock(ctx, offX + c, offY + r, shape[r][c], BLOCK, PANEL_X, NEXT_Y);
  }

  function draw() {
    if (!ctx) return;
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, W, H);
    drawBoard();
    drawPanel();
  }

  function loop(ts: number) {
    if (destroyed) return;
    const dt = lastTime === null ? 0 : Math.min(ts - lastTime, MAX_DT_MS);
    lastTime = ts;
    if (!paused && !ended) update(dt);
    draw(); // sigue dibujando en pausa y tras el fin (último fotograma visible)
    rafId = requestAnimationFrame(loop);
  }

  initGame();
  rafId = requestAnimationFrame(loop);

  return {
    pause() {
      if (paused || ended) return;
      paused = true;
      input.setEnabled(false);
    },
    resume() {
      if (!paused) return;
      paused = false;
      lastTime = null; // evita un dt acumulado tras la pausa
      if (!ended) input.setEnabled(true);
    },
    restart() {
      paused = false;
      lastTime = null;
      input.setEnabled(true);
      initGame();
    },
    end() {
      gameOver();
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(rafId);
      input.destroy();
    },
  };
}
