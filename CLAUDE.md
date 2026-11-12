# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault: online game platform where players compete for highest score. Early stage — UI de `specs/01-ui-mvp.md` con un único juego real (Asteroides) y catálogo/ranking en Supabase. `references/templates/` tiene el diseño de referencia (HTML/JSX/CSS) de las 5 pantallas.

README says project follows Spec Driven Design (`/spec` and `/spec-impl` skills, installed via `npx skills@latest add Klerith/fernando-skills`).

## Skills de proyecto

- `/add-game <nombre|ruta>`: genera el spec (`specs/NN-<slug>-game.md`) para portar un juego de `references/started-games/` o crear uno nuevo, siguiendo SPEC 05/06. Solo spec; implementar con `/spec-impl`. Se apoya en el contrato genérico de juegos y el registro (SPEC 07, implementado).
  - Archivos: `.agents/skills/add-game/{SKILL.md,template.md,platform-contract.md}` (symlink en `.claude/skills/`). El contrato de integración vive en `platform-contract.md`: si cambia el patrón de juegos (motor, registro, `games`), actualizarlo ahí.
  - Se invoca manual o automáticamente al pedir agregar/crear/portar un juego. Un juego por spec; nunca modifica `references/`.
  - Flujo: `/add-game <juego>` → spec `Borrador` → aprobar → `/spec-impl NN-<slug>-game`. Detalle de uso en `README.md`.

## Commands

- `npm run dev` — dev server (localhost:3000)
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)
- No test runner configured yet.

## UI work

- Para cualquier tarea de desarrollo de interfaces (páginas, componentes, layouts, estilos, diseño visual, accesibilidad, responsive), usar las skills instaladas globalmente `frontend-design` y `ui-ux-pro-max` vía Skill tool antes de escribir código UI.

## Verificación visual (UI)

- Para verificar UI contra `references/templates/` (y en checks de aceptación) usar **Playwright MCP** + Chromium instalado: navegar, capturar screenshots en desktop (1280px) y móvil (375px), revisar consola y scroll horizontal (`document.documentElement.scrollWidth <= innerWidth`). Para comparar, abrir `references/templates/Arcade Vault.html` en el navegador.
- Dev server: `npm run dev` (puerto 3000; usar `-p` si está ocupado). Detenerlo al terminar.
- `next dev` reescribe un bloque en `AGENTS.md`; no es cambio propio.

## Stack / gotchas

- Next.js 16.4.5, React 19.3, App Router (`app/`), TypeScript, Tailwind CSS v4 (`@import "tailwindcss"` in `globals.css`, theme via `@theme inline`; no tailwind config file).
- Supabase (`@supabase/supabase-js` + `@supabase/ssr`), proyecto `ddkhfkjsavwfegmgdxcr`; MCP `supabase` en `.mcp.json`. Ver sección Supabase.
- Per `AGENTS.md`: this Next.js version has breaking changes vs. training data. Read relevant guide in `node_modules/next/dist/docs/` (`01-app`, `02-pages`, `03-architecture`, `04-community`) before writing Next code; heed deprecations.
- `next.config.ts` tiene `cacheComponents: true`: `await params` en una página fuera de `<Suspense>` da el error "instant-shell-url-data". Para rutas dinámicas que deben responder 404 real, usar `generateStaticParams` + `export const instant = false`.
- `globals.css` conserva el CSS legado (clases `av-*`, `btn`, etc.) sin `@layer`: gana a las utilidades de Tailwind. Para sobreescribirlo usar el modificador `!` (ej. `text-magenta!`). El preflight de Tailwind además resetea el padding de `<input>`; el CSS legado asume el padding por defecto del navegador.

## Supabase

- Helpers: `lib/supabase/client.ts` (browser) y `lib/supabase/server.ts` (`await createClient()`, uno por request, `cookies()` dentro de la factoría). Tipos generados en `lib/supabase/database.types.ts`; regenerar con MCP `generate_typescript_types` tras cambiar el esquema.
- Env: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable key, no anon legacy) en `.env.local`; plantilla en `.env.example`. `SUPABASE_DB` (en `.env`) es secreto: nunca exponer ni commitear.
- Con `cacheComponents`, `createClient()` de `server.ts` fuera de `<Suspense>` en una página rompe el prerender.
- Estado (SPEC 06): tablas `games` (solo `asteroides`) y `scores` con RLS; vista `game_stats` (`best`, `plays` derivados, `security_invoker`). Sin auth ni `proxy.ts`; `session-provider.tsx` solo guarda el usuario en localStorage.
- RLS: `games` y `scores` con `select` público; `insert` en `scores` para `anon`/`authenticated` solo con `is_seed = false`; sin update/delete (además los `GRANT` de `anon`/`authenticated` están recortados a `select`/`insert`: Supabase concede ALL por defecto en tablas nuevas, así que tras crear tablas hay que hacer `revoke all` y re-otorgar lo mínimo). `CHECK`: `name` 1-16 chars, `score` 0..9 999 999. Ranking = Top N de todas las partidas.
- Capa de datos `lib/db/`: `client.ts` (`createPublicClient`, supabase-js sin cookies, para lecturas y `generateStaticParams`), `games.ts` (`listGames`, `getGame`, `listGameSlugs`), `scores.ts` (`getTopScores`, `insertScore` desde el navegador). El catálogo vive en BD; `lib/games.ts` solo tiene tipos, `CATS` y `formatPlays`.
- Lecturas a BD en páginas: siempre dentro de `<Suspense>` (con `DataFallback`) por `cacheComponents`; si cambias el esquema, regenera tipos.
- Añadir un juego = fila en `games` (slug, cover `cover-<slug>` en `globals.css`) + motor TS en `lib/games/<slug>/` + canvas `components/games/<slug>-canvas.tsx` + entrada en `GAME_REGISTRY` (`components/games/registry.ts`). `GamePlayer` no se toca: monta `entry.Canvas` y toma controles y stats de HUD (vidas/nivel) del registro. Slug sin entrada → "PRÓXIMAMENTE".
- Contrato de juegos (SPEC 07) en `lib/games/types.ts`: `GameCallbacks` (`onScore`/`onGameOver` obligatorios; `onLives`/`onLevel` opcionales), `GameEngine`, `GameCanvasProps`/`GameCanvasHandle`, `GameEntry`. Canvas fijo 800×600 (4:3), clase `.game-canvas`.
- Antes de cambiar el esquema, inspeccionar con MCP `list_tables`; usar `apply_migration` para DDL y `get_advisors` para revisar seguridad/RLS.
