import { cacheLife } from "next/cache";
import type { Category, Game, GameColor, GameInfo } from "@/lib/games";
import type { Tables } from "@/lib/supabase/database.types";
import { createPublicClient } from "./client";

type GameRow = Tables<"games">;
type StatsRow = Tables<"game_stats">;

// `category` y `color` tienen CHECK en BD, por eso el cast a la unión literal es seguro.
function toInfo(row: GameRow): GameInfo {
  return {
    slug: row.slug,
    title: row.title,
    short: row.short,
    long: row.long,
    category: row.category as Exclude<Category, "TODOS">,
    cover: row.cover,
    color: row.color as GameColor,
  };
}

function toGame(row: GameRow, stats?: Pick<StatsRow, "best" | "plays">): Game {
  return { ...toInfo(row), best: stats?.best ?? 0, plays: stats?.plays ?? 0 };
}

/** Todos los juegos con sus estadísticas, en orden de creación. */
export async function listGames(): Promise<Game[]> {
  const supabase = createPublicClient();
  const [games, stats] = await Promise.all([
    supabase.from("games").select("*").order("created_at", { ascending: true }),
    supabase.from("game_stats").select("*"),
  ]);
  if (games.error) throw new Error(`listGames: ${games.error.message}`);
  if (stats.error) throw new Error(`listGames: ${stats.error.message}`);

  const bySlug = new Map(stats.data.map((s) => [s.game_slug, s]));
  return games.data.map((g) => toGame(g, bySlug.get(g.slug)));
}

/**
 * Ficha de un juego por slug (`null` si no existe). Cacheada: permite que las rutas
 * `/juegos/[id]` resuelvan `notFound()` en el prerender y respondan 404 real.
 */
export async function getGameInfo(slug: string): Promise<GameInfo | null> {
  "use cache";
  cacheLife("minutes");
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("games").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`getGameInfo: ${error.message}`);
  return data ? toInfo(data) : null;
}

/** Estadísticas en vivo de un juego (sin caché): usar dentro de <Suspense>. */
export async function getGameStats(slug: string): Promise<{ best: number; plays: number }> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("game_stats")
    .select("best, plays")
    .eq("game_slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getGameStats: ${error.message}`);
  return { best: data?.best ?? 0, plays: data?.plays ?? 0 };
}

/** Slugs para `generateStaticParams`. */
export async function listGameSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("games").select("slug");
  if (error) throw new Error(`listGameSlugs: ${error.message}`);
  return data.map((g) => g.slug);
}
