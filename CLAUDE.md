# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault: online game platform where players compete for highest score. Early stage — implementando `specs/01-ui-mvp.md` (UI mock, sin juegos reales). `references/templates/` tiene el diseño de referencia (HTML/JSX/CSS) de las 5 pantallas.

README says project follows Spec Driven Design (`/spec` and `/spec-impl` skills, installed via `npx skills@latest add Klerith/fernando-skills`).

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
- Estado: solo cimientos (SPEC 04). Sin auth, tablas ni `proxy.ts`; `session-provider.tsx` sigue en localStorage.
- Antes de cambiar el esquema, inspeccionar con MCP `list_tables`; usar `apply_migration` para DDL y `get_advisors` para revisar seguridad/RLS.
