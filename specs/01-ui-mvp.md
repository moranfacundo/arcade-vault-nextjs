# SPEC 01 — MVP visual de Arcade Vault

**Estado:** Implementado
**Depende de:** ninguna
**Fecha:** 2026-11-08
**Objetivo:** Portar a Next.js (App Router + Tailwind v4) las 5 pantallas de `references/templates` (biblioteca, detalle, reproductor, auth, salón de la fama) con fidelidad visual, datos mock y sin juegos reales.

## Alcance

### Dentro
- Layout global: `Nav` (desktop + panel móvil), footer, fondo `av-bg`/`av-noise` (ya en `layout.tsx`).
- Pantallas y rutas:
  - `/` Biblioteca (filtro por categoría `CATS`, grilla de `GAMES`)
  - `/juegos/[id]` Detalle (mock: descripción, mejor puntaje, top scores `seededScores`)
  - `/juegos/[id]/jugar` Reproductor: HUD, marco CRT, arena CSS animada, puntaje simulado con `setInterval`, pausa, modal "FIN DEL JUEGO" con guardado de puntuación
  - `/auth` Login / crear cuenta (tabs), invitado, botones sociales sin acción
  - `/salon` Salón de la Fama (rankings mock por juego)
- Sesión mock en `localStorage` (`av_user`) vía contexto client; scores en `av_scores`. Login acepta cualquier valor.
- Covers de juegos (`cover-*`), colores neón, animaciones (`fade-in`, `slide-in`, etc.) reescritos en Tailwind v4.
- Responsive (menú hamburguesa móvil) y a11y básica (foco visible, labels, `aria-label`, `prefers-reduced-motion`).
- Textos en español.

### Fuera
- Juegos reales, input de teclado/gamepad, física, canvas.
- Backend, DB, auth real, OAuth real (Google/GitHub son decorativos).
- Rankings reales; persistencia de scores más allá de `localStorage` (y el Salón no los lee en este spec salvo que el template lo haga).
- Tests automatizados, i18n, SEO avanzado.

## Modelo de datos
Solo mock tipado, sin cambios de esquema externo:
- `Game { id, title, short, long, cat, cover, color: "cyan"|"magenta"|"green"|"yellow", best, plays }` — 8 juegos copiados de `data.jsx`.
- `Category = "TODOS"|"ARCADE"|"PUZZLE"|"SHOOTER"|"VERSUS"`.
- `ScoreRow { rank, name, score, date }` generado por `seededScores(seed, count)` (determinista; evita mismatch de hidratación).
- `SessionUser { name }` en `localStorage["av_user"]`; `StoredScore { game, score, name, at }[]` en `localStorage["av_scores"]`.
- Ubicación propuesta: `lib/games.ts`, `lib/scores.ts`, `components/session-provider.tsx`.

## Plan de implementación
1. Leer guías relevantes en `node_modules/next/dist/docs/` (routing, client components, fonts) y usar skills `frontend-design` + `ui-ux-pro-max`.
2. Tokens de diseño: portar variables de `styles.css` (colores, `--line`, `--ink*`, fuentes) a `@theme inline` en `app/globals.css`; keyframes y utilidades custom (glow neón, scanlines CRT, `grid-floor`) ahí. App compila y lint pasa.
3. Datos: `lib/games.ts` (GAMES, CATS) y `lib/scores.ts` (seededScores) tipados.
4. `SessionProvider` (client) con `user`, `login`, `signOut`, `saveScore`, protegiendo accesos a `localStorage` con try/catch.
5. `components/nav.tsx` (+ panel móvil) y footer en `app/layout.tsx`; link activo con `usePathname`.
6. Biblioteca `/` con filtro de categorías y `GameCard`.
7. Detalle `/juegos/[id]` con `notFound()` si el id no existe.
8. Reproductor `/juegos/[id]/jugar` (client): HUD, CRT, arena, pausa, fin de juego, guardado vía `saveScore`.
9. Auth `/auth` (client): tabs, submit → `login` + redirect a `/`, invitado.
10. Salón `/salon`.
11. Revisión visual desktop (≥1280) y móvil (375) contra `references/templates/Arcade Vault.html`; ajustes finales; `npm run lint` y `npm run build`.

## Criterios de aceptación
- [x] Las 5 rutas existen y renderizan sin errores de consola ni de hidratación.
- [x] `/juegos/inexistente` (y `/jugar`) muestra la página 404 (con `noindex`). Nota: con `cacheComponents` la primera visita a un id desconocido responde HTTP 200 y las siguientes 404.
- [x] Biblioteca muestra 8 juegos; cada filtro de categoría muestra solo sus juegos.
- [x] Click en un juego → detalle → "Jugar" → reproductor, y "Salir" regresa al detalle.
- [x] Reproductor: puntaje sube solo, PAUSA lo detiene, FIN abre modal, GUARDAR escribe en `localStorage["av_scores"]`, JUGAR DE NUEVO reinicia a 0.
- [x] Auth: ambos tabs funcionan; submit guarda `av_user` y el Nav muestra el nombre (mayúsculas, ≤10 chars); cerrar sesión lo borra; "invitado" no guarda usuario.
- [x] Nav: link activo correcto en cada ruta; menú hamburguesa abre/cierra en <768px.
- [x] Sin scroll horizontal a 375px.
- [x] Capturas desktop y móvil de cada pantalla son visualmente equivalentes al template (mismos colores, fuentes, layout).
- [x] Animaciones se desactivan con `prefers-reduced-motion`.
- [x] `npm run lint` y `npm run build` terminan sin errores.
- [x] Los tokens (colores, fuentes, glow, animaciones) están en `@theme inline` de `globals.css`; el CSS legado `av-*` se conserva en `globals.css` (ver decisiones) y el código nuevo usa utilidades Tailwind donde no hay conflicto.

## Decisiones tomadas y descartadas
- **App Router con rutas reales** (elegido) vs hash-router SPA del template: URLs compartibles, idiomático en Next.
- **Reescribir a Tailwind v4** (elegido, decisión del usuario) vs portar CSS global / CSS Modules: coherente con el stack; costo: más trabajo y riesgo de divergencia visual → mitigado con el criterio de comparación visual. Keyframes y efectos complejos (CRT, glow) pueden quedar como CSS custom en `globals.css`.
- **`localStorage` mock** (elegido) vs sin persistencia: replica el template, permite probar flujo auth/score.
- **Reproductor con simulación visual** (elegido): sin juego real, según pedido.
- Rutas en español (`/juegos`, `/salon`) por consistencia con la UI.
- Cada juego usa el mismo reproductor genérico; la arena no cambia por juego.
- **Enmienda (Paso 2):** `globals.css` ya contenía el `styles.css` completo portado (PR #2). Por decisión del usuario se conserva y solo se amplía `@theme`; reemplaza la decisión de reescribir todo a Tailwind. Consecuencia: el CSS legado no está en `@layer` y gana a las utilidades (usar `!`), y el preflight de Tailwind resetea el padding de `<input>`.
- **Enmienda (404):** `dynamicParams` no existe con `cacheComponents`; se usa `generateStaticParams` + `export const instant = false` y se acepta que la primera visita a un id desconocido dé 200 con la UI 404.
- **Ajustes frente al template:** nivel del reproductor derivado (`1 + floor(score / 2500)`, el template lo subía con puntajes bajos); botón de sesión oculto en móvil (<840px) y accesible desde el menú; columnas de la tabla del Salón recalculadas a 375px; `references/**` excluido de ESLint.
- Decisión sin aclaración detallada: método de verificación visual (manual / Playwright MCP) queda a criterio de la implementación.

## Riesgos
- **Hidratación:** `localStorage`, `Math.random` y fechas en render → leer en `useEffect`; `seededScores` determinista.
- **Next 16 con breaking changes:** consultar docs locales antes de codificar.
- **Divergencia visual** al reescribir 950 líneas de CSS a Tailwind → comparar por pantalla.
- **Spec grande** (5 pantallas + sistema de estilos): si se retrasa, dividir en 01a (tokens+nav+biblioteca/detalle) y 01b (reproductor/auth/salón).
