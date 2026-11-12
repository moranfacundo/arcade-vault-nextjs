"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { insertScore } from "@/lib/db/scores";
import type { GameInfo } from "@/lib/games";
import type { GameCanvasHandle } from "@/lib/games/types";
import { GAME_REGISTRY } from "./games/registry";
import { useSession } from "./session-provider";

export function GamePlayer({ game }: { game: GameInfo }) {
  const { user } = useSession();
  // Juego en `games` sin motor registrado: se muestra "PRÓXIMAMENTE" (sin canvas, HUD ni guardado).
  const entry = GAME_REGISTRY[game.slug];
  const initialLives = entry?.hud.lives ?? 0;
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(initialLives);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [custom, setCustom] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [level, setLevel] = useState(1);
  const gameRef = useRef<GameCanvasHandle>(null);

  // El nombre sigue al usuario de sesión (disponible tras hidratar) salvo que se edite en el modal.
  const name = custom ?? user?.name ?? "INVITADO";

  const restart = () => {
    setScore(0);
    setLives(initialLives);
    setPaused(false);
    setOver(false);
    setSaved(false);
    setSaving(false);
    setSaveError(false);
    setLevel(1);
    gameRef.current?.restart();
  };

  const save = async () => {
    setSaving(true);
    setSaveError(false);
    try {
      await insertScore({ game_slug: game.slug, score, name });
      setSaved(true);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const finish = () => gameRef.current?.end();

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div className="flex flex-wrap gap-6">
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v text-ink!">{name}</div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString("es-ES")}</div>
          </div>
          {entry?.hud.lives !== undefined && (
            <div className="hud-stat lives">
              <div className="l">Vidas</div>
              <div className="v">{"♥ ".repeat(lives).trim() || "—"}</div>
            </div>
          )}
          {entry?.hud.level && (
            <div className="hud-stat level">
              <div className="l">Nivel</div>
              <div className="v">{String(level).padStart(2, "0")}</div>
            </div>
          )}
        </div>
        <div className="hud-actions">
          <button
            type="button"
            className="btn yellow"
            onClick={() => setPaused((p) => !p)}
            disabled={!entry}
          >
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button type="button" className="btn magenta" onClick={finish} disabled={!entry}>
            FIN
          </button>
          <Link href={`/juegos/${game.slug}`} className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          {entry ? (
            <entry.Canvas
              ref={gameRef}
              paused={paused}
              onScore={setScore}
              onLives={setLives}
              onLevel={setLevel}
              onGameOver={(finalScore) => {
                setScore(finalScore);
                setOver(true);
              }}
            />
          ) : (
            <div className="crt-content z-5">
              <div>
                <div className="pixel text-[22px] neon-yellow">PRÓXIMAMENTE</div>
                <div className="mt-2.5 font-mono text-[11px] tracking-[0.16em] text-ink-dim">
                  {game.title} AÚN NO ESTÁ DISPONIBLE
                </div>
              </div>
            </div>
          )}
          {entry && paused && (
            <div className="crt-content z-5 bg-black/60">
              <div>
                <div className="pixel text-[22px] neon-yellow">EN PAUSA</div>
                <div className="mt-2.5 font-mono text-[11px] tracking-[0.16em] text-ink-dim">
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
        {entry && (
          <p className="game-hint">
            {entry.controls.map((c, i) => (
              <span key={c.label}>
                {i > 0 && " · "}
                {c.keys.map((k, j) => (
                  <span key={k}>
                    {j > 0 && " "}
                    <kbd>{k}</kbd>
                  </span>
                ))}{" "}
                {c.label}
              </span>
            ))}
            <span className="need-kb">REQUIERE TECLADO</span>
          </p>
        )}
      </div>

      {over && (
        <div className="modal-bd">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="gameover-title">
            <h2 id="gameover-title">FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
            {!saved ? (
              <>
                <div className="input-row">
                  <input
                    value={name}
                    onChange={(e) => setCustom(e.target.value.toUpperCase().slice(0, 10))}
                    placeholder="TUS INICIALES"
                    aria-label="Tus iniciales"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn yellow"
                    onClick={save}
                    disabled={saving || !name.trim()}
                  >
                    {saving ? "GUARDANDO…" : saveError ? "REINTENTAR" : "GUARDAR PUNTUACIÓN"}
                  </button>
                </div>
                {saveError && (
                  <div className="mt-3 font-mono text-[11px] tracking-[0.14em] text-magenta" role="alert">
                    ▸ NO SE PUDO GUARDAR. REVISA TU CONEXIÓN E INTÉNTALO DE NUEVO_
                  </div>
                )}
              </>
            ) : (
              <div className="toast-saved" role="status">
                ▸ PUNTUACIÓN GUARDADA_
              </div>
            )}
            <div className="actions">
              <button type="button" className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <Link href="/biblioteca" className="btn magenta">
                VOLVER AL VAULT
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
