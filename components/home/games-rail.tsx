import { listGames } from "@/lib/db/games";
import { MiniCard } from "./mini-card";

/** Carril de juegos del home, leído de Supabase (usar dentro de <Suspense>). */
export async function GamesRail() {
  const games = await listGames();
  return (
    <div className="mini-rail">
      {games.slice(0, 6).map((g) => (
        <MiniCard key={g.slug} game={g} />
      ))}
    </div>
  );
}
