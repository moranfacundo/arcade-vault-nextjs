# SPEC 06 — Tablas `games` y `scores` en Supabase (catálogo + ranking real)

**Estado:** Aprobado
**Depende de:** SPEC 04 (clientes Supabase, tipos), SPEC 05 (Asteroides jugable, `saveScore`, `GamePlayer`)
**Fecha:** 2026-11-11
**Objetivo:** Mover el catálogo de juegos (reducido a Asteroides, único juego real) y el ranking de puntuaciones a tablas de Supabase (`games`, `scores`), de modo que biblioteca, detalle, salón y guardado de partida lean y escriban datos reales en lugar de mocks y `localStorage`.

## Alcance

### Dentro
- Migración (MCP `apply_migration`) con:
  - Tabla `public.games` con una única fila: Asteroides.
  - Tabla `public.scores` con índice `(game_slug, score desc)`.
  - Vista `public.game_stats` (`best`, `plays` derivados de `scores`, `security_invoker = true`).
  - RLS activado en ambas tablas (ver políticas abajo).
  - Seed de ~12 puntuaciones demo para Asteroides (`is_seed = true`).
- Regenerar `lib/supabase/database.types.ts` (MCP `generate_typescript_types`) y revisar `get_advisors` (seguridad/RLS) tras la migración.
- Capa de acceso a datos tipada: `lib/db/games.ts` (listar juegos, obtener por slug, stats) y `lib/db/scores.ts` (top N por juego, insertar puntuación).
- **BD como fuente de verdad del catálogo**: biblioteca (`components/library.tsx`), home (`app/page.tsx`), detalle (`app/juegos/[id]/page.tsx`), jugar (`app/juegos/[id]/jugar/page.tsx`) y salón (`components/hall-of-fame.tsx`) leen de Supabase. Se eliminan los 7 juegos mock (`bloque-buster`, `caida`, `serpentina`, `gloton`, `invasores`, `ranaria`, `duelo-pixel`) y la rama de simulación de `GamePlayer` (`REAL_GAMES`, `setInterval`, `POINTS_PER_LEVEL`).
- **Renombrado pendiente de SPEC 05**: slug `asteroides`, título `ASTEROIDES`; actualizar rutas, `cover-rocas` → clase de portada coherente (`cover-asteroides`) y cualquier referencia a `rocas` en código y CSS.
- `lib/games.ts` pasa a contener solo tipos (`Game`, `Category`, `GameColor`) y `CATS`; se borran `GAMES` y `getGame`.
- Guardado real: "GUARDAR PUNTUACIÓN" inserta en `scores` (cliente browser) con `name` del usuario/invitado; estados de carga y error en el modal.
- Ranking: **Top N de todas las partidas** (una fila por partida; un nombre puede repetirse) en detalle (10) y salón (12), con estado vacío ("SÉ EL PRIMERO").
- Se elimina `seededScores`, `PLAYERS`, `StoredScore` y `saveScore` de `session-provider.tsx` (localStorage `av_scores` deja de usarse; no se migra).
- Actualizar `CLAUDE.md` (estado de Supabase: tablas, RLS, capa `lib/db`).

### Fuera (para otros specs)
- Supabase Auth, `profiles`, vincular puntuaciones a un usuario (`user_id`), `proxy.ts`.
- Anti-trampa real (validar partida en servidor, firmas, rate limit). Aquí solo `CHECK` de rangos.
- Mejor puntuación por jugador / ranking por nombre.
- Realtime/actualización en vivo del ranking.
- Nuevos juegos (añadirlos será una fila en `games` + motor, en su propio spec).
- Panel de administración de juegos, Storage de portadas.
- Tests automatizados.

## Modelo de datos

### `public.games`
| Columna | Tipo | Notas |
|---|---|---|
| `slug` | `text` PK | `'asteroides'` |
| `title` | `text` not null | `'ASTEROIDES'` |
| `short` | `text` not null | frase corta (tarjetas) |
| `long` | `text` not null | descripción larga (detalle) |
| `category` | `text` not null | `CHECK` en `ARCADE`, `PUZZLE`, `SHOOTER`, `VERSUS`; Asteroides = `SHOOTER` |
| `cover` | `text` not null | clase CSS de portada |
| `color` | `text` not null | `CHECK` en `cyan`, `magenta`, `green`, `yellow`; Asteroides = `yellow` |
| `created_at` | `timestamptz` default `now()` | |

### `public.scores`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | `bigint` identity PK | |
| `game_slug` | `text` not null | FK → `games(slug)` |
| `name` | `text` not null | `CHECK (char_length(btrim(name)) between 1 and 16)` |
| `score` | `integer` not null | `CHECK (score >= 0 and score <= 9999999)` |
| `is_seed` | `boolean` not null default `false` | `true` en las filas demo |
| `created_at` | `timestamptz` not null default `now()` | |

Índice: `scores_game_score_idx (game_slug, score desc, created_at)`.

### `public.game_stats` (vista, `security_invoker = true`)
`game_slug`, `best` (`max(score)`, 0 si no hay filas), `plays` (`count(*)`), agrupado por juego; incluye juegos sin puntuaciones (left join desde `games`).

### RLS
- `games`: `select` para `anon` y `authenticated`; sin insert/update/delete.
- `scores`: `select` público; `insert` para `anon` y `authenticated` con `WITH CHECK (is_seed = false)`; sin update/delete.

### Tipos de aplicación
- `Game` (derivado de `Tables<'games'>` + `best`/`plays` de la vista), `ScoreRow { rank, name, score, date }` (formato `dd/mm/aaaa` en `es-ES`), `NewScore { game_slug, name, score }`.
- Ubicación: `lib/db/{games,scores}.ts`, migración vía MCP (queda en `supabase_migrations`), tipos en `lib/supabase/database.types.ts`.

## Plan de implementación
1. Leer guías en `node_modules/next/dist/docs/` (`cacheComponents`, data fetching en Server Components, `generateStaticParams`, `<Suspense>`) y `search_docs` de Supabase (RLS, vistas `security_invoker`).
2. Inspeccionar con MCP `list_tables` (hoy `public` vacío) y aplicar la migración con `apply_migration` (tablas, constraints, índice, vista, RLS, políticas, seed de `games` y ~12 `scores` demo). Ejecutar `get_advisors` (security) y corregir avisos.
3. Regenerar `lib/supabase/database.types.ts`.
4. Crear `lib/db/games.ts` y `lib/db/scores.ts` (lecturas con cliente de solo lectura sin cookies para poder usarse en `generateStaticParams` y prerender; inserción con cliente browser). Reducir `lib/games.ts` a tipos + `CATS`.
5. Migrar páginas a datos reales respetando `cacheComponents`: lecturas dentro de `<Suspense>` con fallback; convertir `library.tsx` / `hall-of-fame.tsx` a recibir juegos y puntuaciones por props (o cargar por pestaña) en vez de importar `GAMES`/`seededScores`; `generateStaticParams` de `/juegos/[id]` y `/jugar` desde `games` + `instant = false` para 404 real.
6. Renombrar `rocas` → `asteroides` (código, CSS `cover-*`, `GamePlayer`, textos); borrar mocks y simulación de `GamePlayer`.
7. Guardado: `GamePlayer` inserta en `scores` con el cliente browser (nombre del usuario o campo del invitado, recortado a 16); estados guardando/guardado/error con reintento; limpiar `saveScore`/`StoredScore` de `session-provider.tsx`.
8. Actualizar `CLAUDE.md` (estado de Supabase, tablas, `lib/db`, regla de regenerar tipos).
9. Verificación con Playwright MCP a 1280 y 375: `/`, `/biblioteca`, `/juegos/asteroides`, `/juegos/asteroides/jugar` (jugar, perder, guardar, ver puntuación en el ranking tras recargar), `/salon`, `/juegos/inexistente` (404); consola y scroll horizontal. Comprobar en BD (MCP `execute_sql`) la fila insertada y borrarla. `npm run lint` y `npm run build`.

## Criterios de aceptación
- [ ] La migración existe en `list_migrations`; `list_tables` muestra `games` y `scores` con RLS activado.
- [ ] `games` contiene exactamente 1 fila (`asteroides`); `scores` contiene ~12 filas con `is_seed = true`, todas con `game_slug = 'asteroides'`.
- [ ] `get_advisors` (security) sin errores/avisos de RLS ni de vista `security definer`.
- [ ] Con la publishable key (rol `anon`): `select` en `games`/`scores` funciona; `insert` válido funciona; `update`, `delete`, `insert` con `is_seed = true`, `name` vacío o >16 y `score` negativo o > 9 999 999 son rechazados.
- [ ] `lib/supabase/database.types.ts` incluye `games`, `scores` y `game_stats`.
- [ ] `/biblioteca` y el home muestran solo ASTEROIDES, leído de Supabase; no queda ningún juego mock ni `GAMES` en el código.
- [ ] `/juegos/asteroides` muestra `best` y `plays` derivados de `scores` y el Top 10 real; `/salon` muestra el Top 12 real con una sola pestaña de juego.
- [ ] Con 0 puntuaciones (verificado en una rama o tras borrar las filas demo temporalmente) detalle y salón muestran el estado vacío sin errores.
- [ ] `/juegos/asteroides/jugar`: al terminar y pulsar "GUARDAR PUNTUACIÓN" se crea una fila en `scores` con nombre y puntuación correctos; el modal muestra éxito y, tras recargar `/salon`, la fila aparece en su posición.
- [ ] Si el insert falla (p. ej. offline), el modal muestra el error y permite reintentar sin perder la puntuación.
- [ ] `/juegos/rocas` y `/juegos/inexistente` devuelven 404 real; `/juegos/asteroides` y `/juegos/asteroides/jugar` responden 200.
- [ ] No quedan referencias a `rocas`, `seededScores`, `PLAYERS`, `StoredScore` ni `saveScore` de localStorage en el código (`grep`).
- [ ] A 375 px no hay scroll horizontal (`scrollWidth <= innerWidth`) en las rutas anteriores; sin errores de consola ni de hidratación.
- [ ] `SUPABASE_DB` y secretos no aparecen en el bundle cliente ni en el repo.
- [ ] `npm run lint` y `npm run build` sin errores.

## Decisiones tomadas y descartadas
- **BD como fuente de verdad del catálogo** (elegido) vs mantener `lib/games.ts` con tabla decorativa: una sola fuente evita desincronización; `cover`/`color` también viven en BD.
- **Solo Asteroides en `games`** (decisión del usuario): se eliminan los 7 mocks en vez de dejarlos "próximamente".
- **`slug` text como PK** (elegido) vs uuid + slug único: rutas y consultas sin join; el coste es una migración si se renombra el slug (se cierra ahora el renombrado a `asteroides`).
- **`best`/`plays` derivados vía vista `game_stats`** (elegido) vs columnas + trigger: sin denormalización que se desincronice; `security_invoker` para respetar RLS.
- **Insert anónimo con `CHECK` + RLS** (elegido) vs Server Action vs solo lectura: sin auth no hay identidad; se acepta que el ranking sea manipulable hasta el spec de auth/anti-trampa.
- **Ranking = Top N de todas las partidas** (elegido) vs mejor por nombre: sin identidad verificable, agrupar por nombre es suplantable.
- **Seed de ~12 filas demo con `is_seed`** (elegido) vs tabla vacía: el salón no nace vacío y las demo son identificables y borrables; `WITH CHECK (is_seed = false)` impide que clientes creen filas "seed".
- **Sin migrar el `localStorage` `av_scores`**: eran datos locales de prueba.
- **Sin `user_id` en `scores`** (elegido): se añade cuando exista Auth.

## Riesgos
- **`cacheComponents` + lecturas a BD**: leer fuera de `<Suspense>` rompe el prerender; usar fallback y, para `generateStaticParams`, un cliente sin cookies (`supabase-js` directo con la publishable key).
- **Ranking manipulable**: cualquiera con la publishable key puede insertar puntuaciones válidas por `CHECK`; mitigación parcial (tope de `score`, longitud de `name`); riesgo aceptado hasta un spec de anti-trampa.
- **Spam / abuso de inserts** sin rate limit: aceptado en este spec; revisar tras Auth.
- **Contenido en `name`** (insultos, HTML): se renderiza como texto por React (sin `dangerouslySetInnerHTML`); moderación fuera de alcance.
- **Vista y RLS**: una vista sin `security_invoker` evade RLS; verificar con `get_advisors`.
- **Rutas y enlaces viejos** (`/juegos/rocas`) pasan a 404: no hay redirect (proyecto temprano); confirmar que no quedan enlaces internos.
- **Tipos desactualizados** tras la migración: regenerar antes de escribir `lib/db`.
- **Estado de red en cliente**: el guardado depende de Supabase; el modal debe conservar la puntuación para reintentar.
