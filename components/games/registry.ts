"use client";

import type { GameEntry } from "@/lib/games/types";
import { AsteroidsCanvas } from "./asteroids-canvas";

/**
 * Registro de juegos jugables: slug (fila de `games`) → lo que necesita `GamePlayer`.
 * Añadir un juego = una entrada aquí + una fila en `games` + su `.cover-<slug>`.
 * Solo debe importarlo `GamePlayer` (módulo cliente: referencia componentes, no es serializable).
 */
export const GAME_REGISTRY: Record<string, GameEntry> = {
  asteroides: {
    Canvas: AsteroidsCanvas,
    controls: [
      { keys: ["←", "→"], label: "GIRAR" },
      { keys: ["↑"], label: "IMPULSO" },
      { keys: ["ESPACIO"], label: "DISPARAR" },
    ],
    hud: { lives: 3, level: true },
  },
};
