import type { ComponentType, Ref } from "react";

/** Callbacks que un motor invoca hacia la plataforma. `onLives`/`onLevel` solo si el juego los tiene. */
export interface GameCallbacks {
  onScore(score: number): void;
  onGameOver(finalScore: number): void;
  onLives?(lives: number): void;
  onLevel?(level: number): void;
}

/** API de un motor de juego (sin DOM global; una instancia por canvas). */
export interface GameEngine {
  pause(): void;
  resume(): void;
  restart(): void;
  /** Termina la partida actual (botón FIN): dispara onGameOver y congela el juego. */
  end(): void;
  destroy(): void;
}

/** Handle imperativo que expone el componente canvas de cada juego a `GamePlayer`. */
export interface GameCanvasHandle {
  restart(): void;
  end(): void;
}

export interface GameCanvasProps extends GameCallbacks {
  paused: boolean;
  ref?: Ref<GameCanvasHandle>;
}

/** Tecla(s) y acción para el aviso de controles bajo el CRT. */
export interface ControlHint {
  keys: string[];
  label: string;
}

/** Entrada del registro: qué necesita `GamePlayer` para montar un juego. */
export interface GameEntry {
  Canvas: ComponentType<GameCanvasProps>;
  controls: ControlHint[];
  hud: {
    /** Vidas iniciales; ausente = el juego no muestra vidas. */
    lives?: number;
    /** Muestra el nivel en el HUD. */
    level?: boolean;
  };
}
