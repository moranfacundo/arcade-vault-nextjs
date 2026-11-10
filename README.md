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

Estado actual: solo cimientos; auth y tablas llegan en specs posteriores.
