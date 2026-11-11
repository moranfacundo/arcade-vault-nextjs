# SPEC 04 — Cimientos de Supabase

**Estado:** Implementado
**Depende de:** SPEC 03 (convención de `.env.example` / env solo servidor)
**Fecha:** 2026-11-10
**Objetivo:** Dejar Supabase listo en el proyecto (paquetes, variables de entorno, clientes browser/server, tipos generados y memoria de Claude actualizada) sin cambiar ninguna pantalla ni introducir auth ni tablas.

## Alcance

### Dentro
- Instalar `@supabase/supabase-js` y `@supabase/ssr`.
- Variables de entorno públicas `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (valores obtenidos vía MCP `get_project_url` / `get_publishable_keys`, proyecto `ddkhfkjsavwfegmgdxcr` de `.mcp.json`); documentarlas en `.env.example` y definirlas en `.env.local`.
- Helpers de cliente:
  - `lib/supabase/client.ts`: `createBrowserClient` (para Client Components).
  - `lib/supabase/server.ts`: `createServerClient` con `cookies()` (para Server Components/Actions/Route Handlers).
- Tipos generados con el MCP (`generate_typescript_types`) en `lib/supabase/database.types.ts` y clientes tipados con `Database`.
- Verificación de conexión (consulta trivial vía MCP `list_tables` y una llamada desde el cliente servidor en un script/ruta temporal que **no** se deja en el repo).
- Actualizar memoria de Claude/agentes: `CLAUDE.md` (stack, env, helpers, gotchas, MCP Supabase) y `AGENTS.md` / `README.md` (setup de Supabase para otros devs/agentes), sin tocar los bloques que `next dev` reescribe en `AGENTS.md`.

### Fuera (para otros specs)
- Supabase Auth (cualquier método), reemplazo de `session-provider.tsx`, `proxy.ts` de refresco de sesión.
- Modo invitado (sin cambios).
- Tablas, migraciones, RLS, `profiles`/`scores`, ranking/salón real.
- Supabase CLI, skill `supabase/agent-skills`, entorno local con Docker.
- Storage, Realtime, Edge Functions.
- Tests automatizados.

## Modelo de datos
Sin esquema persistente nuevo (no se crean tablas). Estructuras:
- `Database` (tipo generado) en `lib/supabase/database.types.ts`; con BD vacía será mínimo (`public` sin tablas).
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (públicas por diseño). `.env` ya contiene `SUPABASE_DB` (secreto): no se usa en cliente ni se lee en este spec.
- Ubicación: `lib/supabase/{client,server,database.types}.ts`.

## Plan de implementación
1. Leer guías en `node_modules/next/dist/docs/` (`cookies()`, env vars, `cacheComponents`) y la doc de Supabase para Next.js SSR vía MCP `search_docs` (patrón actual de `@supabase/ssr` y nombre de la publishable key).
2. `npm i @supabase/supabase-js @supabase/ssr`; `npm run build` sigue pasando.
3. Esperar al usuario que cargue URL y publishable key en archivo .env.local; solo actualizar `.env.example` con las dos variables (vacías) y comentario. Confirmar que `.env*` sigue ignorado (salvo `.env.example`).
4. Generar `lib/supabase/database.types.ts` con `generate_typescript_types`.
5. Crear `lib/supabase/client.ts` y `lib/supabase/server.ts` tipados con `Database`; `server.ts` usa `await cookies()` solo dentro de la función factoría (compatible con `cacheComponents`).
6. Verificar conexión: `list_tables` por MCP y una consulta/ping desde el cliente servidor en un script temporal (borrado luego); sin errores de red/clave.
7. Actualizar `CLAUDE.md` (stack, env, helpers, MCP Supabase, regla de no exponer `SUPABASE_DB`), y `AGENTS.md`/`README.md` con sección de setup (instalar, copiar `.env.example`, regenerar tipos).
8. `npm run lint` y `npm run build` sin errores; revisión de que ninguna pantalla cambió (smoke test de `/`, `/biblioteca`, `/acerca`, `/auth`, `/salon`).

## Criterios de aceptación
- [x] `package.json` incluye `@supabase/supabase-js` y `@supabase/ssr`.
- [x] `.env.example` documenta `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; `.env.local` las define y está ignorado por git.
- [x] `lib/supabase/client.ts` y `lib/supabase/server.ts` existen, exportan factorías tipadas con `Database` y compilan.
- [x] `lib/supabase/database.types.ts` existe y proviene de `generate_typescript_types`.
- [x] Una consulta de prueba con el cliente servidor llega al proyecto sin error de conexión/clave; el script temporal no queda en el repo.
- [x] `SUPABASE_DB` y cualquier secreto no aparecen en el bundle cliente ni en el repo.
- [x] `CLAUDE.md` documenta stack, variables, helpers y MCP de Supabase; `AGENTS.md` / `README.md` documentan el setup.
- [x] Los bloques `BEGIN/END` autogenerados de `AGENTS.md` no se modificaron.
- [x] `/`, `/biblioteca`, `/acerca`, `/auth`, `/salon` y `/juegos/[id]` siguen funcionando sin errores de consola.
- [x] `npm run lint` y `npm run build` sin errores.

## Decisiones tomadas y descartadas
- **Solo cimientos** (elegido) vs cimientos + auth vs + puntuaciones: auth y datos se separan en specs propios (decisión del usuario: no entra auth).
- **`supabase-js` + `@supabase/ssr` con helpers client/server** (elegido) vs solo `supabase-js`: evita reescribir los helpers cuando llegue auth con cookies.
- **Sin `proxy.ts` de refresco de sesión**: solo tiene sentido con auth.
- **BD intacta; solo tipos generados** (elegido) vs crear tablas base: sin tablas vacías ni RLS sin uso (deuda).
- **Sin Supabase CLI ni skill `agent-skills`** (elegido): el MCP configurado en `.mcp.json` basta por ahora.
- **Memoria: `CLAUDE.md` + `AGENTS.md`/`README.md`** (elegido); no se incluye la memoria automática del usuario.
- **Publishable key** (clave pública) en lugar de anon legacy si el proyecto la ofrece; confirmar con MCP.
- **Modo invitado y `session-provider.tsx`** quedan fuera de alcance.

## Riesgos
- **Nombre/forma de la key** (publishable vs anon legacy) puede variar según el proyecto: confirmar con `get_publishable_keys` antes de nombrar la variable.
- **`cacheComponents`**: `cookies()` en `server.ts` fuera de `Suspense` rompe el prerender; confinarlo a la factoría y no usarla en páginas aún.
- **Fuga de secretos**: `.env` contiene `SUPABASE_DB`; no usar prefijo `NEXT_PUBLIC_` ni commitear. Verificar `git status` antes de commit.
- **Tipos vacíos/desactualizados** con BD sin tablas: regenerar en cada spec que cambie el esquema.
- **Código sin uso** (helpers sin consumidores) puede disparar lint de imports no usados: no aplica, pero verificar `build`.
- **`next dev` reescribe `AGENTS.md`**: editar solo fuera de los bloques autogenerados.
