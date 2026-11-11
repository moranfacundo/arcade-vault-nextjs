export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;
}

/** Puntuación a insertar en `scores` (el resto de columnas las pone la BD). */
export interface NewScore {
  game_slug: string;
  name: string;
  score: number;
}
