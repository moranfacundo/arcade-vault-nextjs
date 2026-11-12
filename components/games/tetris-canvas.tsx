"use client";

import { useEffect, useImperativeHandle, useRef } from "react";
import { createTetris, type TetrisGame } from "@/lib/games/tetris/engine";
import type { GameCallbacks, GameCanvasProps } from "@/lib/games/types";

export function TetrisCanvas({ paused, ref, onScore, onLevel, onGameOver }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<TetrisGame | null>(null);
  const pausedRef = useRef(paused);

  // Los callbacks viven en una ref para no recrear el motor cuando cambian.
  const cbRef = useRef<GameCallbacks>({ onScore, onLevel, onGameOver });
  useEffect(() => {
    cbRef.current = { onScore, onLevel, onGameOver };
  });

  useImperativeHandle(ref, () => ({
    restart: () => gameRef.current?.restart(),
    end: () => gameRef.current?.end(),
  }));

  // Un motor por montaje; destroy() en el cleanup cubre StrictMode y la navegación.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = createTetris(canvas, {
      onScore: (v) => cbRef.current.onScore(v),
      onLevel: (v) => cbRef.current.onLevel?.(v),
      onGameOver: (v) => cbRef.current.onGameOver(v),
    });
    gameRef.current = game;
    if (pausedRef.current) game.pause();
    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
    if (paused) gameRef.current?.pause();
    else gameRef.current?.resume();
  }, [paused]);

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      width={800}
      height={600}
      role="img"
      aria-label="Pantalla del juego Tetris"
    />
  );
}
