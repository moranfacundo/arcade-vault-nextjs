import type { NewScore, ScoreRow } from "@/lib/scores";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { createPublicClient } from "./client";

const MAX_NAME = 16;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Top N de todas las partidas de un juego (una fila por partida, puede repetirse el nombre). */
export async function getTopScores(gameSlug: string, limit = 10): Promise<ScoreRow[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("scores")
    .select("name, score, created_at")
    .eq("game_slug", gameSlug)
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`getTopScores: ${error.message}`);

  return data.map((r, i) => ({
    rank: i + 1,
    name: r.name,
    score: r.score,
    date: formatDate(r.created_at),
  }));
}

/**
 * Inserta una puntuación desde el navegador (rol `anon`). La BD valida rangos con `CHECK`;
 * aquí solo se normaliza el nombre. Lanza `Error` si falla, para permitir reintento en la UI.
 */
export async function insertScore({ game_slug, name, score }: NewScore): Promise<void> {
  const supabase = createBrowserClient();
  const { error } = await supabase.from("scores").insert({
    game_slug,
    name: name.trim().slice(0, MAX_NAME),
    score: Math.max(0, Math.floor(score)),
  });
  if (error) throw new Error(error.message);
}
