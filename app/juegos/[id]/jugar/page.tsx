import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GamePlayer } from "@/components/game-player";
import { GAMES, getGame } from "@/lib/games";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/juegos/[id]/jugar">): Promise<Metadata> {
  const { id } = await params;
  const game = getGame(id);
  return { title: game ? `Jugando ${game.title} · Arcade Vault` : "Juego no encontrado" };
}

// Ids desconocidos deben responder 404 real (sin streaming), así que la ruta puede bloquear.
export const instant = false;

export default async function PlayPage({ params }: PageProps<"/juegos/[id]/jugar">) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();
  return <GamePlayer game={game} />;
}
