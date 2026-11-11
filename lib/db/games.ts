import type { Category, Game, GameColor } from "@/lib/games";
import type { Tables } from "@/lib/supabase/database.types";
import { createPublicClient } from "./client";

type GameRow = Tables<"games">;
type StatsRow = Tables<"game_stats">;

// `category` y `color` tienen CHECK en BD, por eso el cast a la unión literal es seguro.
function toGame(row: GameRow, stats?: Pick<StatsRow, "best" | "plays">): Game {
  return {
    slug: row.slug,
    title: row.title,
    short: row.short,
    long: row.long,
    category: row.category as Exclude<Category, "TODOS">,
    cover: row.cover,
    color: row.color as GameColor,
    best: stats?.best ?? 0,
    plays: stats?.plays ?? 0,
  };
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

/** Un juego por slug, o `null` si no existe. */
export async function getGame(slug: string): Promise<Game | null> {
  const supabase = createPublicClient();
  const [game, stats] = await Promise.all([
    supabase.from("games").select("*").eq("slug", slug).maybeSingle(),
    supabase.from("game_stats").select("*").eq("game_slug", slug).maybeSingle(),
  ]);
  if (game.error) throw new Error(`getGame: ${game.error.message}`);
  if (stats.error) throw new Error(`getGame: ${stats.error.message}`);
  if (!game.data) return null;
  return toGame(game.data, stats.data ?? undefined);
}

/** Slugs para `generateStaticParams`. */
export async function listGameSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("games").select("slug");
  if (error) throw new Error(`listGameSlugs: ${error.message}`);
  return data.map((g) => g.slug);
}
