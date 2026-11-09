"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "./session-provider";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/salon", label: "Salón de la Fama" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/biblioteca")
    return pathname.startsWith("/biblioteca") || pathname.startsWith("/juegos");
  return pathname === href || pathname.startsWith(href + "/");
}

export function Nav() {
  const pathname = usePathname();
  const { user, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <nav className="av-nav" aria-label="Principal">
        <Link href="/" className="logo" onClick={close}>
          <div className="logo-mark" aria-hidden="true"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={isActive(pathname, l.href) ? "active" : ""}
              aria-current={isActive(pathname, l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin" aria-hidden="true"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <button
            type="button"
            className="btn ghost auth-btn"
            onClick={signOut}
            title="Cerrar sesión"
          >
            {user.name} ▾
          </button>
        ) : (
          <Link href="/auth" className="btn auth-btn">
            Iniciar Sesión
          </Link>
        )}
        <button
          type="button"
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
        >
          ≡
        </button>
      </nav>

      <div
        className={"av-mobile-backdrop" + (open ? " open" : "")}
        onClick={close}
        aria-hidden="true"
      ></div>
      <aside
        className={"av-mobile-panel" + (open ? " open" : "")}
        aria-label="Menú móvil"
        inert={!open}
      >
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>
          MENÚ
        </div>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={isActive(pathname, l.href) ? "active" : ""}
            onClick={close}
          >
            {l.label}
          </Link>
        ))}
        {user ? (
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              signOut();
              close();
            }}
          >
            Cerrar sesión ({user.name})
          </button>
        ) : (
          <Link
            href="/auth"
            className={isActive(pathname, "/auth") ? "active" : ""}
            onClick={close}
          >
            Iniciar Sesión
          </Link>
        )}
        <div style={{ flex: 1 }}></div>
        <div className="pixel" style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}>
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
