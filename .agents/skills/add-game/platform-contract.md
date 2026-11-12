# Contrato de integración de juegos (derivado de SPEC 05 y 06)

Checklist que todo spec de juego debe cubrir. `<slug>` = slug del juego, `<Name>` = PascalCase.

## Motor (`lib/games/<slug>/`)
- Archivos: `constants.ts`, `entities.ts`, `input.ts`, `engine.ts` (+ `utils.ts` si hace falta).
- API: `create<Name>(canvas, callbacks)` → `{ pause(), resume(), restart(), end(), destroy() }`.
- Callbacks: `onScore(n)`, `onGameOver(finalScore)`, más `onLives(n)` / `onLevel(n)` u otros solo si el juego los tiene.
- Sin globales de DOM: `document`/`window` solo dentro de `create<Name>`/`destroy`. Estado encapsulado por instancia (input incluido).
- Si es port: conservar valores de constantes del original y listar comportamientos a preservar.
- Eliminar HUD, overlay de game over, pausa y reinicio propios del original.
- `end()` dispara `onGameOver` con la puntuación actual y congela el juego.

## Loop y entrada
- `requestAnimationFrame`; tope de `dt` 50 ms; resetear `lastTime` al reanudar.
- Pausa detiene `update`, no el render; el input se ignora en pausa/game over.
- Limpiar teclas en pausa y en `blur`.
- `preventDefault` en flechas/espacio solo mientras el juego está montado.
- `destroy()` cancela el rAF y quita todos los listeners.

## Componente (`components/games/<slug>-canvas.tsx`)
- Client Component; patrón de `components/games/asteroids-canvas.tsx`: callbacks en ref, un motor por montaje, `destroy()` en cleanup, seguro con StrictMode, `useImperativeHandle` con `restart`/`end`, prop `paused`.
- `<canvas>` con tamaño lógico fijo, escalado por CSS manteniendo proporción, `role="img"` + `aria-label` en español.

## Plataforma (`components/game-player.tsx`)
- La plataforma manda la UI: HUD, PAUSA/REANUDAR, FIN, modal "FIN DEL JUEGO", guardado (`insertScore` de `lib/db/scores.ts`) y "JUGAR DE NUEVO".
- Registro del juego en el mecanismo de SPEC 07 (slug → canvas, hint de controles, stats de HUD). No hacer ramas `if (slug === ...)` ad hoc.
- Aviso de controles bajo el CRT y "REQUIERE TECLADO" en pantallas táctiles/estrechas.

## Datos (Supabase)
- Una fila nueva en `games` vía MCP `apply_migration` (solo DML, sin cambio de esquema): `slug`, `title`, `short`, `long`, `category` (CHECK: ARCADE/PUZZLE/SHOOTER/VERSUS), `cover` = `cover-<slug>`, `color` (CHECK: cyan/magenta/green/yellow).
- Seed de `scores` demo (`is_seed = true`) solo si el spec lo decide; si no, estado vacío "SÉ EL PRIMERO".
- Inspeccionar antes con `list_tables`; revisar `get_advisors`. No hace falta regenerar tipos si no cambia el esquema.
- Límites de `scores` (CHECK): `name` 1–16, `score` 0..9 999 999. Verificar que la puntuación máxima plausible del juego cabe.

## CSS y assets
- `.cover-<slug>` en `app/globals.css` (sin `@layer`; para sobreescribir CSS legado usar `!`); estilos mínimos del canvas dentro de `.crt-screen`.
- Assets estáticos en `public/games/<slug>/`.

## Verificación (criterios de aceptación mínimos)
- Playwright MCP a 1280 y 375 en `/`, `/biblioteca`, `/juegos/<slug>`, `/juegos/<slug>/jugar`: jugar, pausa/reanudar, FIN, perder/terminar, guardar puntuación, ver fila en el ranking tras recargar, jugar de nuevo.
- Sin errores de consola/hidratación; `document.documentElement.scrollWidth <= innerWidth`.
- 3 entradas/salidas sin loops ni listeners duplicados; StrictMode sin doble disparo.
- Fila insertada en `games` verificada con `execute_sql`; filas de prueba en `scores` borradas.
- `references/started-games/*` sin cambios.
- `npm run lint` y `npm run build` sin errores.
- Actualizar `CLAUDE.md` si cambia algo del patrón.
