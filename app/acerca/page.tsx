import type { Metadata } from "next";
import { ContactForm } from "@/components/about/contact-form";
import { HighlightIcon, type HighlightKind } from "@/components/about/highlight-icon";
import { Reveal } from "@/components/home/reveal";

export const metadata: Metadata = { title: "Acerca de · Arcade Vault" };

const HIGHLIGHTS: { kind: HighlightKind; text: string; color: "magenta" | "cyan" | "green" }[] = [
  { kind: "HEART", text: "HECHO CON ❤️ PARA JUGADORES", color: "magenta" },
  { kind: "BROWSER", text: "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR", color: "cyan" },
  { kind: "PLANT", text: "PROYECTO EN CONSTANTE CRECIMIENTO", color: "green" },
];

const TIPS: { text: string; led: string }[] = [
  { text: "RESPUESTA EN 24-48H", led: "" },
  { text: "SUGERENCIAS BIENVENIDAS", led: " y" },
  { text: "SIN SPAM, JAMÁS", led: " m" },
];

export default function AcercaPage() {
  return (
    <div className="about fade-in">
      {/* ACERCA DE */}
      <section className="about-hero">
        <div className="kicker pixel neon-yellow" aria-hidden="true">
          ▸ ACERCA DE
        </div>
        <h1 className="about-title">ACERCA DE ARCADE VAULT</h1>
        <p className="about-mission">
          ARCADE VAULT nació del amor por los videojuegos clásicos. Nuestra misión es preservar y
          celebrar los arcades que definieron una generación, haciéndolos accesibles para todos, en
          cualquier lugar y sin costo.
        </p>

        <div className="highlight-row">
          {HIGHLIGHTS.map((h, i) => (
            <div
              key={h.kind}
              className={`highlight ${h.color}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <HighlightIcon kind={h.kind} />
              <div className="hl-text pixel">{h.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DIVIDER */}
      <Reveal as="div" className="about-divider">
        <div aria-hidden="true" style={{ display: "contents" }}>
          <div className="div-bar"></div>
          <div className="div-pixels">
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} style={{ animationDelay: `${i * 80}ms` }}></span>
            ))}
          </div>
          <div className="div-bar"></div>
        </div>
      </Reveal>

      {/* CONTACTO */}
      <Reveal className="about-contact">
        <div className="contact-grid">
          <div className="contact-intro">
            <div className="kicker pixel neon-cyan" aria-hidden="true">
              ▸ CONTACTO
            </div>
            <h2 className="contact-title">CONTÁCTANOS</h2>
            <p className="contact-sub">
              ¿Tienes alguna sugerencia, quieres proponer un juego, o simplemente quieres saludar?
              Escríbenos.
            </p>
            <div className="contact-tips">
              {TIPS.map((t) => (
                <div key={t.text} className="tip">
                  <span className={`tip-led${t.led}`} aria-hidden="true"></span>
                  {t.text}
                </div>
              ))}
            </div>
          </div>

          <ContactForm />
        </div>
      </Reveal>
    </div>
  );
}
