export type GameColor = "cyan" | "magenta" | "green" | "yellow";
export type Category = "TODOS" | "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";

/** Juego del catálogo: fila de `games` + estadísticas derivadas de `scores` (`game_stats`). */
export interface Game {
  slug: string;
  title: string;
  short: string;
  long: string;
  category: Exclude<Category, "TODOS">;
  cover: string;
  color: GameColor;
  best: number;
  plays: number;
}

export const CATS: Category[] = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"];

/** Formato compacto de partidas jugadas: 950 → "950", 15600 → "15.6K". */
export function formatPlays(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k >= 100 ? Math.round(k) : Math.round(k * 10) / 10}K`;
}
