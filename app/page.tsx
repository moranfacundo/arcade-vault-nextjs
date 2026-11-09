import Link from "next/link";
import { FeatureIcon } from "@/components/home/feature-icon";
import { FloatingSilhouettes } from "@/components/home/floating-silhouettes";
import { MiniCard } from "@/components/home/mini-card";
import { Reveal } from "@/components/home/reveal";
import { GAMES } from "@/lib/games";
import {
  ACTIVITY,
  FAQS,
  FEATURES,
  PRICE_PERKS,
  STATS,
  TOP_PLAYERS,
  formatScore,
} from "@/lib/home";

function SectionHead({
  kicker,
  color,
  title,
}: {
  kicker: string;
  color: "cyan" | "magenta" | "yellow" | "green";
  title: string;
}) {
  return (
    <div className="section-head">
      <div className={`kicker pixel neon-${color}`} aria-hidden="true">
        {kicker}
      </div>
      <h2 className="section-title">{title}</h2>
      <div className="section-rule" aria-hidden="true"></div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="home fade-in">
      {/* HERO */}
      <section className="home-hero">
        <FloatingSilhouettes />
        <div className="home-hero-inner">
          <div className="hero-eyebrow pixel neon-yellow">
            ▸ INSERTA UNA MONEDA<span className="blink">_</span>
          </div>
          <h1 className="home-title">
            <span className="line-1">EL ARCADE</span>
            <span className="line-2">CLÁSICO ESTÁ</span>
            <span className="line-3">DE VUELTA</span>
          </h1>
          <p className="home-sub">
            Juega los mejores clásicos directamente en tu navegador.
            <br />
            Sin descargas. Sin costo. Solo diversión.
          </p>
          <div className="home-ctas">
            <Link href="/biblioteca" className="btn xl pulse">
              ▶ EXPLORAR JUEGOS
            </Link>
            <Link href="/auth" className="btn xl magenta">
              ✦ CREAR CUENTA
            </Link>
          </div>
          <div className="hero-scroll" aria-hidden="true">
            <span>DESLIZA</span>
            <span className="arrow">▼</span>
          </div>
        </div>
      </section>

      {/* POR QUÉ */}
      <Reveal className="home-section">
        <SectionHead kicker="// 01" color="magenta" title="¿POR QUÉ ARCADE VAULT?" />
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div key={f.icon} className={"feature-card " + f.color}>
              <FeatureIcon kind={f.icon} />
              <h3 className="ft-title pixel">{f.title}</h3>
              <div className="ft-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* JUEGOS */}
      <Reveal className="home-section">
        <SectionHead kicker="// 02" color="cyan" title="JUEGOS DISPONIBLES AHORA" />
        <div className="mini-rail">
          {GAMES.slice(0, 6).map((g) => (
            <MiniCard key={g.id} game={g} />
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link href="/biblioteca" className="btn lg">
            VER TODOS LOS JUEGOS →
          </Link>
        </div>
      </Reveal>

      {/* STATS */}
      <Reveal className="home-stats">
        <div className="stats-inner">
          {STATS.map((st) => (
            <div key={st.n} className="stat-block">
              <div className="stat-n neon-yellow">{st.n}</div>
              <div className="stat-u pixel">{st.u}</div>
              <div className="stat-s">{st.s}</div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ACTIVIDAD */}
      <Reveal className="home-section">
        <SectionHead kicker="// 03" color="yellow" title="ACTIVIDAD EN VIVO" />
        <div className="activity-grid">
          <div className="activity-card">
            <div className="ac-head">
              <h3 className="ac-title pixel">▸ ÚLTIMAS PUNTUACIONES</h3>
            </div>
            <div className="ticker">
              {ACTIVITY.map((r, i) => (
                <div
                  key={r.player}
                  className="tick-row"
                  style={{ animationDelay: i * 60 + "ms" }}
                >
                  <span className={"tk-p neon-" + r.color}>{r.player}</span>
                  <span className="tk-mid">▸ {r.game}</span>
                  <span className="tk-s">+{formatScore(r.score)}</span>
                  <span className="tk-t">{r.ago}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="activity-card">
            <div className="ac-head">
              <h3 className="ac-title pixel neon-magenta">▸ TOP JUGADORES · HOY</h3>
              <Link href="/salon" className="lb-link">
                VER SALÓN →
              </Link>
            </div>
            <div className="top-list">
              {TOP_PLAYERS.map((r, i) => (
                <div
                  key={r.player}
                  className={"top-row" + (i < 3 ? ` top${i + 1}` : "")}
                >
                  <span className="tp-rk">#{String(r.rank).padStart(2, "0")}</span>
                  <span className="tp-bar" aria-hidden="true">
                    <span className="tp-fill" style={{ width: 100 - i * 16 + "%" }}></span>
                  </span>
                  <span className="tp-p">{r.player}</span>
                  <span className="tp-s">{formatScore(r.score)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {/* PRECIOS */}
      <Reveal className="home-section">
        <SectionHead kicker="// 04" color="green" title="PRECIOS" />
        <div className="pricing-grid">
          <div className="price-card">
            <div className="pc-label pixel">PLAN ÚNICO</div>
            <div className="pc-name pixel">JUGADOR VAULT</div>
            <div className="pc-amount">
              <span className="pc-amount-n">$0</span>
              <span className="pc-amount-u">/ SIEMPRE</span>
            </div>
            <div className="pc-tag">SIN TRUCOS · SIN LETRA PEQUEÑA</div>
            <ul className="pc-list">
              {PRICE_PERKS.map((p) => (
                <li key={p}>✔ {p}</li>
              ))}
            </ul>
            <Link href="/auth" className="btn xl pulse w-full">
              EMPEZAR GRATIS →
            </Link>
            <div className="pc-foot">No pedimos tarjeta. Nunca lo haremos.</div>
            <div className="pc-stamp pixel" aria-hidden="true">
              FREE
              <br />
              PLAY
            </div>
          </div>

          <div className="pricing-faq">
            {FAQS.map((f) => (
              <div key={f.q} className="faq-item">
                <h3 className="faq-q pixel">{f.q}</h3>
                <div className="faq-a">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* CTA FINAL */}
      <Reveal className="home-final">
        <h2 className="final-title pixel">¿LISTO PARA JUGAR?</h2>
        <Link href="/biblioteca" className="btn xl pulse final-cta">
          INSERTAR MONEDA →
        </Link>
        <div className="final-tag">Gratis. Sin registro obligatorio. Empieza en segundos.</div>
      </Reveal>
    </div>
  );
}
