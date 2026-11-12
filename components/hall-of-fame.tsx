"use client";

import Link from "next/link";
import { useState } from "react";
import type { Game } from "@/lib/games";
import type { ScoreRow } from "@/lib/scores";
import { useSession } from "./session-provider";

const fmt = (n: number) => n.toLocaleString("es-ES");
const medal = (i: number) => (i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : "");
const EMPTY_ROW: ScoreRow = { rank: 0, name: "———", score: 0, date: "—" };

interface HallOfFameProps {
  games: Game[];
  scoresBySlug: Record<string, ScoreRow[]>;
}

export function HallOfFame({ games, scoresBySlug }: HallOfFameProps) {
  const { user } = useSession();
  const [tab, setTab] = useState(games[0]?.slug ?? "");
  const game = games.find((g) => g.slug === tab) ?? games[0];
  const rows = scoresBySlug[game?.slug ?? ""] ?? [];
  const [first, second, third] = [rows[0] ?? EMPTY_ROW, rows[1] ?? EMPTY_ROW, rows[2] ?? EMPTY_ROW];
  const mine = user ? rows.find((r) => r.name === user.name) : undefined;

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel text-[10px]">LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA</p>
      </div>

      <div className="hall-tabs" role="group" aria-label="Elegir juego">
        {games.map((g) => (
          <button
            key={g.slug}
            type="button"
            className={"chip" + (tab === g.slug ? " active" : "")}
            aria-pressed={tab === g.slug}
            onClick={() => setTab(g.slug)}
          >
            {g.title}
          </button>
        ))}
      </div>

      <div className="podium">
        <div className="podium-slot silver">
          <div className="rank-num">02</div>
          <div className="name">{second.name}</div>
          <div className="score">{rows[1] ? fmt(second.score) : "—"}</div>
          <div className="date">{second.date}</div>
        </div>
        <div className="podium-slot gold">
          <div className="pixel text-[9px] tracking-[0.18em] text-gold">CAMPEÓN</div>
          <div className="rank-num mt-1 text-[36px]!">01</div>
          <div className="name">{first.name}</div>
          <div className="score text-[20px]!">{rows[0] ? fmt(first.score) : "—"}</div>
          <div className="date">{first.date}</div>
        </div>
        <div className="podium-slot bronze">
          <div className="rank-num">03</div>
          <div className="name">{third.name}</div>
          <div className="score">{rows[2] ? fmt(third.score) : "—"}</div>
          <div className="date">{third.date}</div>
        </div>
      </div>

      <div className="hall-table">
        <div className="th">
          <div>RANGO</div>
          <div>JUGADOR</div>
          <div>PUNTUACIÓN</div>
          <div>FECHA</div>
        </div>
        {rows.length === 0 && (
          <div className="p-10 text-center">
            <div className="pixel text-[12px] text-magenta mb-2">SÉ EL PRIMERO</div>
            <div className="text-ink-faint">Aún no hay puntuaciones. Juega y deja tu marca.</div>
          </div>
        )}
        {rows.map((r, i) => (
          <div
            key={`${r.rank}-${r.name}`}
            className={"tr" + medal(i)}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
            <div className="pl">{r.name}</div>
            <div className="sc">{fmt(r.score)}</div>
            <div className="dt">{r.date}</div>
          </div>
        ))}
        {mine && game && (
          <>
            <div className="tr you-label">▸ TU MEJOR MARCA EN {game.title}</div>
            <div className="tr you" style={{ animationDelay: `${rows.length * 50 + 50}ms` }}>
              <div className="rk text-yellow!">#{String(mine.rank).padStart(2, "0")}</div>
              <div className="pl text-yellow!">{mine.name}</div>
              <div className="sc text-yellow! [text-shadow:0_0_6px_rgba(245,255,0,0.5)]!">
                {fmt(mine.score)}
              </div>
              <div className="dt">{mine.date}</div>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link href="/biblioteca" className="btn lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}
