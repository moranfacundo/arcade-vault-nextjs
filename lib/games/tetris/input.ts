const GAME_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "KeyX"]);

/** Teclado por instancia: cada pulsación (incluida la repetición del navegador) llama a `onKey`. */
export interface Input {
  /** Mientras es false se ignoran las teclas (pausa / fin de partida). */
  setEnabled(enabled: boolean): void;
  destroy(): void;
}

export function createInput(onKey: (code: string) => void): Input {
  let enabled = true;

  const onKeyDown = (e: KeyboardEvent) => {
    if (!GAME_KEYS.has(e.code)) return;
    e.preventDefault(); // evita scroll de la página y activar botones enfocados
    if (!enabled) return;
    onKey(e.code);
  };

  window.addEventListener("keydown", onKeyDown);

  return {
    setEnabled(v) {
      enabled = v;
    },
    destroy() {
      window.removeEventListener("keydown", onKeyDown);
    },
  };
}
