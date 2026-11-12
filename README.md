## Arcade Vault

Es una plataforma para jugar online y competir por la mayor cantidad de puntos.

## Usa Spec Driven Design

Basado en /spec y /spec-impl

Siguiendo las buenas practicas recomendadas aquí:
https://github.com/Klerith/fernando-skills

## Skills usadas

```bash
npx skills@latest add Klerith/fernando-skills
```

## Skill `/add-game` — agregar juegos a la plataforma

Skill del proyecto (`.agents/skills/add-game/`, enlazada en `.claude/skills/add-game`) que genera el **spec** para integrar un juego en Arcade Vault. Sigue el patrón de SPEC 05 (Asteroides) y SPEC 06 (tablas `games`/`scores`).

### Características

- **Solo genera el spec** (`specs/NN-<slug>-game.md`, estado `Borrador`). No escribe código, no toca la BD ni `references/`. La implementación se hace luego con `/spec-impl`.
- **Un juego por spec.**
- **Juego existente**: si hay carpeta en `references/started-games/` (hoy `02-asteroids`, `03-tetris`, `04-arkanoid`), la lee completa y documenta qué se porta (constantes, entidades, controles, puntuación, niveles, assets) y qué se elimina porque lo manda la plataforma (HUD, overlays, pausa y reinicio propios).
- **Juego nuevo**: si no hay referencia, pregunta las mecánicas (género, controles, puntuación, vidas, niveles, condición de fin, tamaño de canvas) y el spec define el motor TS directo en `lib/games/<slug>/`.
- **Preguntas comunes**: título, `short`/`long`, `category`, `color`, portada `cover-<slug>`, stats del HUD, sonido/mouse, conflictos de teclas.
- **Contrato de integración** (`platform-contract.md`): motor `create<Name>(canvas, callbacks)` → `{ pause, resume, restart, end, destroy }` sin globales de DOM, componente `components/games/<slug>-canvas.tsx`, fila en `games` vía migración MCP, `.cover-<slug>` en `globals.css`, assets en `public/games/<slug>/`, verificación con Playwright MCP.
- **Plantilla** (`template.md`): mismo formato que SPEC 05/06 (alcance, modelo de datos, plan, criterios, decisiones, riesgos).
- **Invocación**: manual (`/add-game`) o automática cuando se pide agregar, portar o crear un juego.

### Uso

```text
/add-game tetris                          # portar un juego de references/started-games
/add-game 04-arkanoid                     # por nombre de carpeta
/add-game "serpiente con comida y muros"  # juego nuevo, sin referencia
```

Flujo completo:

1. `/add-game <juego>` → responder las preguntas → se crea `specs/NN-<slug>-game.md`.
2. Revisar el spec y cambiar su estado a `Aprobado`.
3. `/spec-impl NN-<slug>-game` para implementarlo.

### Contrato de juegos (SPEC 07, implementado)

`GamePlayer` ya no depende de un juego concreto. Cada juego se integra con:

- Contrato en `lib/games/types.ts` (`GameCallbacks`, `GameEngine`, `GameCanvasProps`/`GameCanvasHandle`, `GameEntry`).
- Una entrada en `GAME_REGISTRY` (`components/games/registry.ts`): `slug → { Canvas, controls, hud }`. `GamePlayer` toma de ahí el canvas, el hint de controles y los stats de HUD (vidas/nivel).
- Un slug en `games` sin entrada en el registro muestra "PRÓXIMAMENTE".

La skill genera specs que ya asumen este contrato (`Depende de: SPEC 05, 06, 07`).

## Commands

- `npm run dev` — dev server (localhost:3000)
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)
- No test runner configured yet.

## Supabase

1. `npm install`
2. Copia `.env.example` a `.env.local` y completa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Dashboard → Settings → API Keys).
3. Clientes en `lib/supabase/` (`client.ts` para el navegador, `server.ts` para el servidor) y tipos en `database.types.ts`.
4. Si cambia el esquema, regenera los tipos (MCP de Supabase configurado en `.mcp.json`, herramienta `generate_typescript_types`).

### Datos

- Tablas `games` (catálogo; hoy solo `asteroides`) y `scores` (ranking), más la vista `game_stats` (`best` y `plays` derivados). Las tablas se crearon con la migración `create_games_and_scores` (MCP `apply_migration`); no hay carpeta `supabase/` local.
- RLS: lectura pública; cualquiera puede insertar en `scores` (nombre de 1 a 16 caracteres, puntuación de 0 a 9 999 999). No hay update ni delete. Las filas con `is_seed = true` son datos demo.
- Acceso a datos en `lib/db/` (`games.ts`, `scores.ts`). Las lecturas usan un cliente sin cookies; el guardado de puntuación se hace desde el navegador.
- El ranking muestra las mejores partidas de todos los jugadores (un mismo nombre puede repetirse). Sin auth, los nombres no están verificados.

Estado actual: catálogo y ranking reales en Supabase; auth, perfiles y anti-trampa llegan en specs posteriores.
