# SPEC 07 — Contrato genérico de juegos y registro en `GamePlayer`

**Estado:** Aprobado
**Depende de:** SPEC 05 (motor y canvas de Asteroides), SPEC 06 (catálogo `games` en Supabase, `insertScore`)
**Fecha:** 2026-11-12
**Objetivo:** Desacoplar `GamePlayer` de Asteroides mediante un contrato común de motor/canvas y un registro `slug → juego`, de modo que agregar un juego nuevo (skill `/add-game`) no requiera tocar la lógica de `GamePlayer`.

## Por qué existe este spec
`components/game-player.tsx` importa `AsteroidsCanvas` directamente, tiene vidas iniciales (3), HUD de nivel y texto de controles (`← → GIRAR · ↑ IMPULSO · ESPACIO DISPARAR`) fijos para Asteroides, y el canvas usa la clase CSS `.asteroids-canvas`. Un segundo juego obligaría a meter ramas `if (slug === ...)`. Se resuelve una sola vez; después cada juego es una entrada del registro. La skill `/add-game` asume este contrato.

## Alcance

### Dentro
- Tipos del contrato en `lib/games/types.ts`:
  - `GameCallbacks { onScore(n); onGameOver(finalScore); onLives?(n); onLevel?(n) }`.
  - `GameCanvasHandle { restart(); end() }`.
  - `GameCanvasProps extends GameCallbacks { paused: boolean; ref?: Ref<GameCanvasHandle> }`.
  - `GameEngine { pause(); resume(); restart(); end(); destroy() }`.
- Registro en `components/games/registry.ts`: `GAME_REGISTRY: Record<string, GameEntry>` con
  `GameEntry { Canvas: ComponentType<GameCanvasProps>; controls: ControlHint[]; hud: { lives?: number; level?: boolean } }`
  y `ControlHint { keys: string[]; label: string }` (ej. `{ keys: ["←","→"], label: "GIRAR" }`).
  `hud.lives` = vidas iniciales (ausente = el juego no muestra vidas); `hud.level` = muestra nivel.
- Registrar `asteroides` en el registro: `hud: { lives: 3, level: true }`, controles actuales.
- `GamePlayer` consume el registro: renderiza `entry.Canvas`, el hint de controles desde `entry.controls`, y los stats de vidas/nivel según `entry.hud`. Mantiene HUD, PAUSA, FIN, modal, `insertScore` y "JUGAR DE NUEVO".
- `AsteroidsCanvas` y `lib/games/asteroids/engine.ts` pasan a implementar el contrato (tipos compartidos); comportamiento del juego sin cambios.
- CSS: `.asteroids-canvas` → `.game-canvas` (genérico) en `app/globals.css`; `.game-hint` se conserva.
- Fallback para slug presente en BD pero sin entrada en el registro: panel "PRÓXIMAMENTE" dentro del CRT, sin canvas, sin romper la página; HUD y guardado desactivados.
- Actualizar `.agents/skills/add-game/platform-contract.md` y `CLAUDE.md` con la ruta real del registro.

### Fuera (para otros specs)
- Nuevos juegos (Tetris, Arkanoid, etc.): un spec por juego vía `/add-game`.
- Canvas de tamaño o proporción distintos a 4:3 (800×600); se resolverá cuando un juego lo requiera.
- Controles táctiles / gamepad, sonido, mouse.
- Carga diferida (`next/dynamic`) de los motores; se evalúa cuando haya más de un juego.
- Cambios de esquema en Supabase.
- Tests automatizados.

## Modelo de datos
Sin esquema persistente nuevo. Estructuras:
- Tipos del contrato (ver Alcance) en `lib/games/types.ts`.
- `GameEntry` / `ControlHint` / `GAME_REGISTRY` en `components/games/registry.ts` (módulo cliente: referencia componentes).
- `GamePlayer` deriva del registro: `initialLives = entry.hud.lives ?? 0`, `showLives = entry.hud.lives !== undefined`, `showLevel = !!entry.hud.level`.
- Ubicación: `lib/games/types.ts`, `components/games/registry.ts`, cambios en `components/game-player.tsx`, `components/games/asteroids-canvas.tsx`, `lib/games/asteroids/engine.ts`, `app/globals.css`.

## Plan de implementación
1. Leer guías en `node_modules/next/dist/docs/` (Client Components, `cacheComponents`) y confirmar que `jugar/page.tsx` sigue siendo Server Component que solo pasa `game` (`GameInfo`) a `GamePlayer`.
2. Crear `lib/games/types.ts` con el contrato; hacer que `AsteroidsCallbacks`/`AsteroidsGame` extiendan/alias de los tipos genéricos. `npm run lint` y `tsc` pasan.
3. Adaptar `asteroids-canvas.tsx` a `GameCanvasProps`/`GameCanvasHandle`; renombrar clase a `.game-canvas` (código y CSS).
4. Crear `components/games/registry.ts` y registrar `asteroides`.
5. Refactorizar `GamePlayer`: resolver `entry` por `game.slug`; vidas/nivel/hint desde el registro; fallback "PRÓXIMAMENTE" si no hay entrada. Eliminar import directo de `AsteroidsCanvas` y `asteroidsRef` específico (ref genérico).
6. Actualizar `platform-contract.md` de la skill y `CLAUDE.md` (registro, contrato, regla: nuevo juego = entrada en `GAME_REGISTRY`).
7. Verificación con Playwright MCP a 1280 y 375 sobre `/juegos/asteroides/jugar`: jugar, pausa, FIN, guardar, jugar de nuevo, 3 entradas/salidas; consola y scroll horizontal. Probar el fallback quitando temporalmente la entrada del registro. `npm run lint` y `npm run build`.

## Criterios de aceptación
- [ ] `/juegos/asteroides/jugar` se comporta igual que antes del refactor: controles, puntos, vidas, nivel, PAUSA, FIN, modal, guardado en `scores` y "JUGAR DE NUEVO".
- [ ] `components/game-player.tsx` no importa nada de `asteroids` ni compara `slug` con literales (`grep`).
- [ ] Vidas y nivel del HUD, y el texto de controles, provienen de `GAME_REGISTRY["asteroides"]`.
- [ ] Con un registro simulado sin `hud.lives`/`hud.level`, el HUD oculta esos stats (verificado temporalmente).
- [ ] Slug sin entrada en el registro muestra "PRÓXIMAMENTE" sin errores de consola ni de hidratación; no ofrece guardar puntuación.
- [ ] `AsteroidsCanvas` y el motor usan los tipos de `lib/games/types.ts`.
- [ ] No quedan referencias a `.asteroids-canvas` en código ni CSS (`grep`).
- [ ] 3 entradas/salidas sin loops ni listeners duplicados; StrictMode sin doble disparo (criterios de SPEC 05 se mantienen).
- [ ] A 375 px sin scroll horizontal (`scrollWidth <= innerWidth`) y aviso "REQUIERE TECLADO" visible.
- [ ] `platform-contract.md` y `CLAUDE.md` mencionan el registro y el contrato.
- [ ] `npm run lint` y `npm run build` sin errores.

## Decisiones tomadas y descartadas
- **Registro en código `slug → entrada`** (elegido) vs columnas de config en `games` (controles, vidas): los controles y el componente son código; meterlos en BD obligaría a migración por cada ajuste y no puede guardar componentes.
- **Contrato mínimo con callbacks opcionales** (elegido) vs un contrato rígido con vidas y nivel obligatorios: Tetris no tiene vidas; Arkanoid sí; cada juego declara lo que tiene.
- **Registro estático con imports directos** (elegido) vs `next/dynamic`: con un solo juego no hay ganancia; se revisa al sumar más.
- **Fallback "PRÓXIMAMENTE"** (elegido) vs `notFound()`: una fila en `games` sin motor no es un error de ruta, y evita 404 en un juego ya listado.
- **Mantener 4:3 fijo**: acota el alcance; otros formatos se tratan cuando un juego los pida.
- **Clase `.game-canvas` genérica** vs una clase por juego: el estilo del canvas es idéntico entre juegos.

## Riesgos
- **Regresión en Asteroides** al tocar tipos y `GamePlayer`: cubierto por criterio de comportamiento idéntico y verificación completa.
- **Registro (módulo cliente) importado desde Server Components**: mantenerlo solo en `GamePlayer`; si `cacheComponents` o el bundle se quejan, aislar con `"use client"`.
- **Bundle crece** con cada motor importado estáticamente: aceptado ahora; revisar con `next/dynamic` al llegar al segundo juego.
- **Desincronización BD ↔ registro** (fila sin entrada o al revés): mitigada por el fallback; `/add-game` exige ambas piezas.
- **Callbacks opcionales mal conectados** (vidas que no se actualizan): cubierto por el criterio con registro simulado.
