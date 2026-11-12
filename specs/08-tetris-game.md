# SPEC 08 — Juego: TETRIS (tetris)

**Estado:** Aprobado
**Depende de:** SPEC 05, SPEC 06, SPEC 07 (contrato genérico de juegos, `Implementado`)
**Fecha:** 2026-11-12
**Objetivo:** Portar Tetris (`references/started-games/03-tetris/`) como motor TS y registrarlo en el catálogo de Arcade Vault.

## Alcance

### Dentro
- Port de `references/started-games/03-tetris/game.js` a `lib/games/tetris/` (motor TS sin globales de DOM).
- Componente cliente `components/games/tetris-canvas.tsx` (canvas 800×600, escalado CSS, ciclo de vida limpio, StrictMode).
- Registro en `GAME_REGISTRY` (`components/games/registry.ts`) con clave `tetris`; la plataforma manda HUD, PAUSA, FIN, modal y guardado. `GamePlayer` no se toca.
- Fila en `games` (migración MCP, solo DML) con cover `cover-tetris` y `.cover-tetris` en `app/globals.css`.
- Layout dentro del canvas 800×600: tablero 10×20 (300×600, bloque 30 px) en `x=150`; panel lateral dibujado en canvas (x≥490) con vista previa **NEXT** (cuadrícula 4×4) y contador **LÍNEAS**. Puntuación y nivel los muestra el HUD de la plataforma.
- Controles: `←`/`→` mover, `↑` o `X` rotar, `↓` soft drop, `Espacio` hard drop. Aviso de controles y "REQUIERE TECLADO".
- Se conservan las 8 piezas del original, incluida la **N (tuerca, 3×3 con hueco)** y la pieza fantasma (alpha 0.2).
- Textos en español.

### Fuera (para otros specs)
- Controles táctiles / gamepad, multijugador, auth, anti-trampa.
- Sonido y mouse (el original no los tiene).
- Toggle de tema claro/oscuro del original (la plataforma tiene su tema); no se porta `localStorage('tetris-theme')`.
- Mejoras de gameplay respecto al original (hold, SRS, bag de 7, T-spin, lock delay, etc.).
- Tests automatizados.
- Modificar `references/started-games/`.

## Modelo de datos
- Fila `games`: `slug = 'tetris'`, `title = 'TETRIS'`, `short = 'Encaja las piezas y limpia líneas.'`, `long = 'El clásico de bloques con 8 piezas (incluida la tuerca), pieza fantasma, caída rápida e instantánea y niveles que aceleran cada 10 líneas.'`, `category = 'PUZZLE'`, `cover = 'cover-tetris'`, `color = 'cyan'`.
- `TetrisCallbacks = Required<Pick<GameCallbacks,'onScore'|'onGameOver'|'onLevel'>>` (sin `onLives`).
- `TetrisGame = GameEngine { pause; resume; restart; end; destroy }`; API `createTetris(canvas, callbacks)`.
- Estado interno (encapsulado por instancia): `board` (20×10), `current`, `next` (`{ type, shape, x, y }`), `score`, `lines`, `level`, `dropInterval`, `dropAccum`, `state: "playing" | "paused" | "gameover"`, teclas/input por instancia.
- Constantes (valores del original): `COLS=10`, `ROWS=20`, `BLOCK=30`, `COLORS` (8 colores), `PIECES` (I,O,T,S,Z,J,L,N), `LINE_SCORES=[0,100,300,500,800]`, `dropInterval=max(100, 1000−(level−1)·90)`, `level=floor(lines/10)+1`, kicks `[0,-1,1,-2,2]`.
- Ubicación: `lib/games/tetris/{engine,entities,input,constants}.ts`, `components/games/tetris-canvas.tsx`.
- Stats del HUD: puntuación (siempre) + nivel (`onLevel`). Sin vidas. Registro: `hud: { level: true }`, sin `lives`.
- Controles del registro: `{ keys:["←","→"], label:"MOVER" }`, `{ keys:["↑","X"], label:"ROTAR" }`, `{ keys:["↓"], label:"BAJAR" }`, `{ keys:["ESPACIO"], label:"CAÍDA" }`.

## Inventario del original
- Comportamientos a preservar:
  - Tablero 10×20; spawn centrado en `y=0`; 8 piezas aleatorias uniformes (`random 1..8`).
  - Rotación horaria (`rotateCW`) con wall kicks `[0,-1,1,-2,2]`; si ninguno cabe, no rota.
  - Auto-drop por acumulación de `dt` contra `dropInterval`; al no poder bajar se fija (`merge` + `clearLines` + `spawn`).
  - Soft drop: +1 punto por fila; si no puede bajar, fija la pieza. Hard drop: +2 puntos por celda y fija.
  - Puntos por líneas: `LINE_SCORES[n] × level` (nivel previo al recálculo); nivel y velocidad se recalculan tras limpiar.
  - Pieza fantasma (`ghostY`, alpha 0.2), cuadrícula, resaltado superior del bloque.
  - Fin: la pieza recién generada colisiona al aparecer.
- Se elimina por mandar la plataforma: panel HUD (SCORE/LEVEL), overlay PAUSA/GAME OVER, botón Reiniciar, tecla `P`, lista de controles del DOM, toggle de tema, título.
- Se mantiene dibujado en canvas: NEXT y LÍNEAS (no existen en el HUD de la plataforma).
- Dependencias de DOM/globales a encapsular: `getElementById` (board, next-canvas, score, lines, level, overlay, restart-btn, theme-toggle), `getComputedStyle(document.body)` para `--grid-line` (pasa a constante de color), `document.addEventListener('keydown')`, `localStorage`, `performance.now()`/`requestAnimationFrame`/`cancelAnimationFrame` globales (viven en el motor y se cancelan en `destroy`).
- Diferencias de contrato a corregir: en el original `loop` no limita `dt` ni limpia teclas; el port añade tope de 50 ms y reset de `lastTime` al reanudar. Un solo `keydown` (sin repetición de teclado nativa controlada): se acepta la repetición del navegador al mantener ←/→/↓ como en el original.

## Plan de implementación
1. Leer guías de Next en `node_modules/next/dist/docs/`; usar skills `frontend-design` + `ui-ux-pro-max` para portada y aviso de controles.
2. Releer `game.js` y fijar la lista de comportamientos de arriba.
3. Crear `lib/games/tetris/` con `createTetris(canvas, callbacks)`; `npm run lint` y `tsc` pasan.
4. Crear `components/games/tetris-canvas.tsx` siguiendo `asteroids-canvas.tsx`.
5. Añadir entrada `tetris` en `GAME_REGISTRY`.
6. CSS: `.cover-tetris` en `app/globals.css` (bloques apilados de colores sobre rejilla, CSS puro).
7. Migración `apply_migration` (INSERT en `games`); `get_advisors`.
8. Verificación con Playwright MCP a 1280 y 375 (ver criterios); `npm run lint` y `npm run build`.
9. Actualizar `CLAUDE.md` si cambia el patrón (p. ej. "solo `asteroides`" en la sección Supabase).

## Criterios de aceptación
- [ ] `/juegos/tetris` y `/juegos/tetris/jugar` responden 200; el juego aparece en `/` y `/biblioteca` leído de Supabase.
- [ ] `←`/`→` mueven, `↑`/`X` rotan con wall kick, `↓` baja (+1/fila), `Espacio` cae al instante (+2/celda); las teclas no hacen scroll de la página.
- [ ] Completar líneas suma `[100,300,500,800] × nivel`; el contador LÍNEAS del canvas y el HUD de nivel suben cada 10 líneas y la caída se acelera.
- [ ] El HUD muestra puntuación y nivel, sin vidas; controles mostrados coinciden con el registro.
- [ ] NEXT muestra la siguiente pieza (incluida la tuerca N); la pieza fantasma se ve.
- [ ] Spawn bloqueado abre el modal "FIN DEL JUEGO" con la puntuación correcta; `FIN` abre el modal con la actual.
- [ ] PAUSA congela juego e input; REANUDAR continúa sin saltos ni caída instantánea por `dt` acumulado.
- [ ] "GUARDAR PUNTUACIÓN" inserta fila en `scores` (`game_slug = 'tetris'`); aparece en detalle/salón tras recargar; estado vacío "SÉ EL PRIMERO" sin errores.
- [ ] "JUGAR DE NUEVO" reinicia tablero, HUD y motor.
- [ ] 3 entradas/salidas sin loops ni listeners duplicados; StrictMode sin doble disparo (una pulsación = un movimiento).
- [ ] A 375 px sin scroll horizontal (`scrollWidth <= innerWidth`), canvas sin deformar y aviso "REQUIERE TECLADO".
- [ ] Sin errores de consola ni de hidratación.
- [ ] Fila `tetris` verificada en `games` con `execute_sql`; filas de prueba en `scores` borradas.
- [ ] `references/started-games/*` sin cambios.
- [ ] `npm run lint` y `npm run build` sin errores.

## Decisiones tomadas y descartadas
- **Canvas 800×600 con tablero 300×600 dentro y panel lateral dibujado** (elegido) vs canvas 300×600 propio: respeta el contrato 4:3 de SPEC 07 sin ampliarlo. Costo: ~50 % del canvas es panel/espacio vacío; el tablero escala menos en móvil.
- **Port a módulo TS** vs iframe: la plataforma necesita estado (puntuación, nivel) y pausa directa.
- **La plataforma manda la UI**: se quita overlay, `P`, reinicio y toggle de tema.
- **NEXT y LÍNEAS en el canvas** vs ampliar el contrato de HUD: Tetris es el único que los pide; no justifica cambiar SPEC 07.
- **Quitar `P`** (elegido): la pausa es el botón PAUSA; evita doble pausa. Se mantiene `X` como alias de rotar (original).
- **Conservar pieza N (tuerca)**: es parte del original; "mejoras/recortes de gameplay" fuera de alcance.
- **Sin sonido ni mouse** (el original no los tiene).
- **`category = PUZZLE`, `color = cyan`**: libre frente a `asteroides` (SHOOTER, yellow).
- **Sin seed de `scores`**: estado vacío "SÉ EL PRIMERO".

## Riesgos
- Fugas de loop/listeners; `dt` acumulado al pausar (reset de `lastTime` y tope 50 ms); teclas atascadas (limpiar en pausa y `blur`); conflicto `Espacio`/flechas con botón enfocado tras PAUSA; canvas HiDPI/móvil; `cacheComponents` (lecturas a BD dentro de `<Suspense>`); `score ≤ 9 999 999` (plausible en partidas normales: holgado).
- El `loop` original llama `lockPiece` dentro del tick y puede terminar el juego antes de `draw`: el port debe disparar `onGameOver` una sola vez.
- Ghost/auto-drop usan `board` en cierre: al encapsular, el estado debe vivir por instancia (dos montajes StrictMode no comparten tablero).
- Hard drop en `keydown` con repetición del navegador: mantener `Espacio` puede encadenar caídas; mismo comportamiento que el original, aceptado.
- Texto/etiquetas del canvas (NEXT, LÍNEAS) deben legibles a 375 px (el canvas se reduce ~0.42×): verificar tamaño de fuente mínimo.
- Aleatoriedad uniforme (sin bolsa de 7) puede dar rachas largas sin pieza I: conservado del original.
