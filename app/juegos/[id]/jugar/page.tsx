import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GamePlayer } from "@/components/game-player";
import { getGameInfo, listGameSlugs } from "@/lib/db/games";

export async function generateStaticParams() {
  const slugs = await listGameSlugs();
  return slugs.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/juegos/[id]/jugar">): Promise<Metadata> {
  const { id } = await params;
  const game = await getGameInfo(id);
  return { title: game ? `Jugando ${game.title} · Arcade Vault` : "Juego no encontrado" };
}

// Ids desconocidos deben responder 404 real (sin streaming), así que la ruta puede bloquear.
export const instant = false;

export default async function PlayPage({ params }: PageProps<"/juegos/[id]/jugar">) {
  const { id } = await params;
  const game = await getGameInfo(id);
  if (!game) notFound();
  return <GamePlayer game={game} />;
}
