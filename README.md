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
