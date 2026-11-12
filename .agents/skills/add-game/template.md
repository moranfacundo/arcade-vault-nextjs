# Plantilla de spec de juego

Forma que debe respetar el spec generado por `/add-game`. No se copia literal: se rellena con datos reales y se eliminan los placeholders y secciones que no apliquen. Idioma y estilo: iguales a `specs/05-asteroids-game.md` y `specs/06-games-and-scores-tables.md`.

````markdown
# SPEC NN — Juego: <TITLE> (<slug>)

**Estado:** Borrador
**Depende de:** SPEC 05, SPEC 06, SPEC 07 (contrato genérico de juegos)
**Fecha:** YYYY-MM-DD
**Objetivo:** <Una sola frase: portar/crear <TITLE> como motor TS y registrarlo en el catálogo de Arcade Vault.>

## Alcance

### Dentro
- <Port de `references/started-games/NN-<slug>/...` a `lib/games/<slug>/` | Diseño de motor nuevo con estas mecánicas: ...>
- Componente cliente `components/games/<slug>-canvas.tsx` (canvas <W>×<H>, escalado CSS, ciclo de vida limpio, StrictMode).
- Registro en `GamePlayer` según SPEC 07; la plataforma manda HUD, PAUSA, FIN, modal y guardado.
- Fila en `games` (migración MCP) con cover `cover-<slug>` y `.cover-<slug>` en `globals.css`.
- Controles: <teclas>. Aviso de controles y "REQUIERE TECLADO".
- <Assets → `public/games/<slug>/`>
- Textos en español.

### Fuera (para otros specs)
- Controles táctiles / gamepad, multijugador, auth, anti-trampa.
- <Sonido / mouse si se excluyen>
- Mejoras de gameplay respecto al original.
- Tests automatizados.
- Modificar `references/started-games/`.

## Modelo de datos
- Fila `games`: `slug`, `title`, `short`, `long`, `category`, `cover`, `color` (valores reales).
- `<Name>Callbacks { onScore; onGameOver; [onLives]; [onLevel] }`, `<Name>Game { pause; resume; restart; end; destroy }`.
- Estado interno (encapsulado): <entidades y estados>.
- Constantes: <lista; valores del original conservados>.
- Ubicación: `lib/games/<slug>/{engine,entities,input,constants}.ts`, `components/games/<slug>-canvas.tsx`.
- Stats del HUD: <puntuación, vidas, nivel...>.

## Inventario del original (solo si es port)
- Comportamientos a preservar: <lista>.
- Se elimina por mandar la plataforma: <HUD, overlays, pausa, reinicio>.
- Dependencias de DOM/globales a encapsular: <lista>.

## Plan de implementación
1. Leer guías de Next en `node_modules/next/dist/docs/`; usar skills `frontend-design` + `ui-ux-pro-max` para marco/portada.
2. <Leer completo la referencia y listar comportamientos | Fijar reglas de juego>.
3. Crear `lib/games/<slug>/` con API `create<Name>`; `npm run lint` y `tsc` pasan.
4. Crear `components/games/<slug>-canvas.tsx`.
5. Registrar el juego en `GamePlayer` (SPEC 07).
6. CSS: `.cover-<slug>` y estilos del canvas.
7. Migración `apply_migration` (fila en `games`); `get_advisors`.
8. Verificación con Playwright MCP a 1280 y 375 (ver criterios); `npm run lint` y `npm run build`.
9. Actualizar `CLAUDE.md` si aplica.

## Criterios de aceptación
- [ ] `/juegos/<slug>` y `/juegos/<slug>/jugar` responden 200; el juego aparece en `/` y `/biblioteca` leído de Supabase.
- [ ] <Controles hacen X; puntuación suma según reglas; vidas/nivel (si aplica) se reflejan en el HUD>.
- [ ] Condición de fin abre el modal "FIN DEL JUEGO" con la puntuación correcta; `FIN` abre el modal con la actual.
- [ ] PAUSA congela juego e input; REANUDAR continúa sin saltos.
- [ ] "GUARDAR PUNTUACIÓN" inserta fila en `scores` (`game_slug = '<slug>'`); aparece en detalle/salón tras recargar; estado vacío sin errores.
- [ ] "JUGAR DE NUEVO" reinicia estado, HUD y motor.
- [ ] 3 entradas/salidas sin loops ni listeners duplicados; StrictMode sin doble disparo.
- [ ] A 375 px sin scroll horizontal y canvas sin deformar; aviso "REQUIERE TECLADO".
- [ ] Sin errores de consola ni de hidratación.
- [ ] `references/started-games/*` sin cambios.
- [ ] `npm run lint` y `npm run build` sin errores.

## Decisiones tomadas y descartadas
- <Port a módulo TS vs iframe>, <plataforma manda UI>, <alcance de sonido/mouse>, <valores de category/color>, etc., con justificación breve.

## Riesgos
- Fugas de loop/listeners; `dt` acumulado al pausar; teclas atascadas; conflicto de atajos; canvas HiDPI/móvil; `cacheComponents`; límite `score ≤ 9 999 999`; <riesgos propios del juego>.
````
