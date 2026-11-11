"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Game } from "@/lib/games";
import { AsteroidsCanvas, type AsteroidsCanvasHandle } from "./games/asteroids-canvas";
import { useSession } from "./session-provider";

const POINTS_PER_LEVEL = 2500;
// Juegos con motor real: puntuación, vidas y nivel vienen del motor, no de la simulación.
const REAL_GAMES = new Set(["rocas"]);

export function GamePlayer({ game }: { game: Game }) {
  const { user, saveScore } = useSession();
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [custom, setCustom] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [realLevel, setRealLevel] = useState(1);
  const asteroidsRef = useRef<AsteroidsCanvasHandle>(null);
  const isReal = REAL_GAMES.has(game.id);

  // El nombre sigue al usuario de sesión (disponible tras hidratar) salvo que se edite en el modal.
  const name = custom ?? user?.name ?? "INVITADO";
  const level = isReal ? realLevel : 1 + Math.floor(score / POINTS_PER_LEVEL);

  useEffect(() => {
    if (isReal || over || paused) return;
    const t = setInterval(() => setScore((s) => s + Math.floor(10 + Math.random() * 90)), 220);
    return () => clearInterval(t);
  }, [isReal, over, paused]);

  const restart = () => {
    setScore(0);
    setLives(3);
    setPaused(false);
    setOver(false);
    setSaved(false);
    setRealLevel(1);
    asteroidsRef.current?.restart();
  };

  const finish = () => {
    if (isReal) asteroidsRef.current?.end();
    else setOver(true);
  };

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
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">{"♥ ".repeat(lives).trim() || "—"}</div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, "0")}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button type="button" className="btn yellow" onClick={() => setPaused((p) => !p)}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button type="button" className="btn magenta" onClick={finish}>
            FIN
          </button>
          <Link href={`/juegos/${game.id}`} className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          {isReal ? (
            <AsteroidsCanvas
              ref={asteroidsRef}
              paused={paused}
              onScore={setScore}
              onLives={setLives}
              onLevel={setRealLevel}
              onGameOver={(finalScore) => {
                setScore(finalScore);
                setOver(true);
              }}
            />
          ) : (
            <div className="game-arena">
              <div className="grid-floor"></div>
              <div className="enemy e1"></div>
              <div className="enemy e2"></div>
              <div className="enemy e3"></div>
              <div className="player-ship"></div>
            </div>
          )}
          {paused && (
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
        {isReal && (
          <p className="game-hint">
            <kbd>←</kbd> <kbd>→</kbd> GIRAR · <kbd>↑</kbd> IMPULSO · <kbd>ESPACIO</kbd> DISPARAR
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
                  onClick={() => {
                    saveScore({ game: game.id, score, name });
                    setSaved(true);
                  }}
                >
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
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
