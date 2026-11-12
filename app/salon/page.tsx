import type { Metadata } from "next";
import { Suspense } from "react";
import { DataFallback } from "@/components/data-fallback";
import { HallOfFame } from "@/components/hall-of-fame";
import { listGames } from "@/lib/db/games";
import { getTopScores } from "@/lib/db/scores";
import type { ScoreRow } from "@/lib/scores";

export const metadata: Metadata = { title: "Salón de la Fama · Arcade Vault" };

async function HallData() {
  const games = await listGames();
  const entries = await Promise.all(
    games.map(async (g) => [g.slug, await getTopScores(g.slug, 12)] as const),
  );
  const scoresBySlug: Record<string, ScoreRow[]> = Object.fromEntries(entries);
  return <HallOfFame games={games} scoresBySlug={scoresBySlug} />;
}

export default function HallPage() {
  return (
    <Suspense fallback={<DataFallback />}>
      <HallData />
    </Suspense>
  );
}
