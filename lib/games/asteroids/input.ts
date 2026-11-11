const GAME_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "Space"]);

/** Teclado por instancia: teclas sostenidas + pulsaciones de un solo frame. */
export interface Input {
  keys: Record<string, boolean>;
  /** Consume una pulsación nueva (true una sola vez por pulsación). */
  pressed(code: string): boolean;
  /** Mientras es false se ignoran las teclas (pausa / fin de partida). */
  setEnabled(enabled: boolean): void;
  clear(): void;
  destroy(): void;
}

export function createInput(): Input {
  const keys: Record<string, boolean> = {};
  const justPressed: Record<string, boolean> = {};
  let enabled = true;

  const clear = () => {
    for (const k of Object.keys(keys)) keys[k] = false;
    for (const k of Object.keys(justPressed)) justPressed[k] = false;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!GAME_KEYS.has(e.code)) return;
    e.preventDefault(); // evita scroll de la página y activar botones enfocados
    if (!enabled) return;
    if (!keys[e.code]) justPressed[e.code] = true;
    keys[e.code] = true;
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (!GAME_KEYS.has(e.code)) return;
    e.preventDefault();
    keys[e.code] = false;
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", clear);

  return {
    keys,
    pressed(code) {
      const v = !!justPressed[code];
      justPressed[code] = false;
      return v;
    },
    setEnabled(v) {
      enabled = v;
      if (!v) clear();
    },
    clear,
    destroy() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clear);
    },
  };
}
