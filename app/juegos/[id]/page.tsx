import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DataFallback } from "@/components/data-fallback";
import { getGameInfo, getGameStats, listGameSlugs } from "@/lib/db/games";
import { getTopScores } from "@/lib/db/scores";
import { formatPlays } from "@/lib/games";

export async function generateStaticParams() {
  const slugs = await listGameSlugs();
  return slugs.map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps<"/juegos/[id]">): Promise<Metadata> {
  const { id } = await params;
  const game = await getGameInfo(id);
  return { title: game ? `${game.title} · Arcade Vault` : "Juego no encontrado" };
}

// Ids desconocidos deben responder 404 real (sin streaming), así que la ruta puede bloquear.
export const instant = false;

const BEST_CLASS = "v text-magenta! [text-shadow:0_0_6px_rgba(255,0,110,0.5)]!";

function GameStatCells({ plays, best }: { plays?: number; best?: number }) {
  return (
    <>
      <div>
        <div className="l">Partidas</div>
        <div className="v">{plays === undefined ? "—" : formatPlays(plays)}</div>
      </div>
      <div>
        <div className="l">Mejor global</div>
        <div className={BEST_CLASS}>{best === undefined ? "—" : best.toLocaleString("es-ES")}</div>
      </div>
    </>
  );
}

async function LiveGameStatCells({ slug }: { slug: string }) {
  const { best, plays } = await getGameStats(slug);
  return <GameStatCells plays={plays} best={best} />;
}

async function TopScores({ slug }: { slug: string }) {
  const scores = await getTopScores(slug, 10);
  if (scores.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="pixel text-[12px] text-magenta mb-2">SÉ EL PRIMERO</div>
        <div className="text-ink-faint">Aún no hay puntuaciones.</div>
      </div>
    );
  }
  return (
    <>
      {scores.map((r, i) => (
        <div
          key={`${r.rank}-${r.name}`}
          className={"lb-row" + (i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : "")}
        >
          <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
          <div className="pl">
            {r.name}
            <div className="text-[10px] tracking-[0.1em] text-ink-faint">{r.date}</div>
          </div>
          <div className="sc">{r.score.toLocaleString("es-ES")}</div>
        </div>
      ))}
    </>
  );
}

export default async function GameDetailPage({ params }: PageProps<"/juegos/[id]">) {
  const { id } = await params;
  const game = await getGameInfo(id);
  if (!game) notFound();

  return (
    <div className="av-detail fade-in">
      <div>
        <div className="detail-cover">
          <div className={"cover-bg " + game.cover}></div>
        </div>
        <div className="detail-info mt-5">
          <div className="detail-tags">
            <span>{game.category}</span>
            <span>1 JUGADOR</span>
            <span>TECLADO / TÁCTIL</span>
            <span>RETRO 1985</span>
          </div>
          <h2 className="neon-cyan">{game.title}</h2>
          <p>{game.long}</p>
          <div className="stat-strip">
            <Suspense fallback={<GameStatCells />}>
              <LiveGameStatCells slug={game.slug} />
            </Suspense>
            <div>
              <div className="l">Dificultad</div>
              <div
                className="v text-yellow! [text-shadow:0_0_6px_rgba(245,255,0,0.5)]!"
                aria-label="Dificultad: 3 de 5"
              >
                ★ ★ ★ ☆ ☆
              </div>
            </div>
          </div>
          <div className="detail-actions">
            <Link href={`/juegos/${game.slug}/jugar`} className="btn xl pulse">
              ▶ JUGAR AHORA
            </Link>
            <Link href="/biblioteca" className="btn ghost lg">
              VOLVER AL VAULT
            </Link>
          </div>
        </div>
      </div>

      <aside>
        <div className="leaderboard">
          <h3>MEJORES PUNTUACIONES</h3>
          <Suspense fallback={<DataFallback />}>
            <TopScores slug={game.slug} />
          </Suspense>
        </div>
      </aside>
    </div>
  );
}
