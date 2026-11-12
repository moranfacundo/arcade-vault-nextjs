"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { createAsteroids, type AsteroidsCallbacks, type AsteroidsGame } from "@/lib/games/asteroids/engine";

export interface AsteroidsCanvasHandle {
  restart(): void;
  end(): void;
}

interface Props extends AsteroidsCallbacks {
  paused: boolean;
  ref?: Ref<AsteroidsCanvasHandle>;
}

export function AsteroidsCanvas({ paused, ref, onScore, onLives, onLevel, onGameOver }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<AsteroidsGame | null>(null);
  const pausedRef = useRef(paused);

  // Los callbacks viven en una ref para no recrear el motor cuando cambian.
  const cbRef = useRef<AsteroidsCallbacks>({ onScore, onLives, onLevel, onGameOver });
  useEffect(() => {
    cbRef.current = { onScore, onLives, onLevel, onGameOver };
  });

  useImperativeHandle(ref, () => ({
    restart: () => gameRef.current?.restart(),
    end: () => gameRef.current?.end(),
  }));

  // Un motor por montaje; destroy() en el cleanup cubre StrictMode y la navegación.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = createAsteroids(canvas, {
      onScore: (v) => cbRef.current.onScore(v),
      onLives: (v) => cbRef.current.onLives(v),
      onLevel: (v) => cbRef.current.onLevel(v),
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
      className="asteroids-canvas"
      width={800}
      height={600}
      role="img"
      aria-label="Pantalla del juego Asteroides"
    />
  );
}
