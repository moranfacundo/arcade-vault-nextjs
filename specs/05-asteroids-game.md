# SPEC 05 — Primer juego jugable: Asteroides (ROCAS)

**Estado:** Aprobado
**Depende de:** SPEC 01 (UI MVP: `GamePlayer`, ruta `/juegos/[id]/jugar`, `session-provider`)
**Fecha:** 2026-11-11
**Objetivo:** Reemplazar la simulación del mock "ROCAS" (`id: "rocas"`) por el juego real Asteroides, portando a TypeScript el canvas de `references/started-games/02-asteroids/` y presentándolo dentro del reproductor de Arcade Vault con su HUD, pausa y guardado de puntuación.

## Alcance

### Dentro
- Portar `references/started-games/02-asteroids/game.js` (clases `Bullet`, `Asteroid`, `Ship`, `Particle`, power-ups, loop, colisiones, niveles) a un **motor TS sin globales de DOM** en `lib/games/asteroids/`.
- Componente cliente `components/games/asteroids-canvas.tsx`: monta un `<canvas>` 800×600 (escalado responsive por CSS manteniendo 4:3), crea el motor en `useEffect`, lo destruye al desmontar (cancela `requestAnimationFrame`, quita listeners `keydown`/`keyup`).
- Integración en `components/game-player.tsx`: si `game.id === "rocas"` renderiza el canvas dentro de `.crt-screen` en vez de `.game-arena` simulada; el resto de juegos conserva el mock actual.
- **La plataforma manda la UI**: el HUD (jugador, puntuación, vidas, nivel), PAUSA/REANUDAR, FIN, modal "FIN DEL JUEGO", guardado (`saveScore`) y "JUGAR DE NUEVO" son los de `GamePlayer`. El canvas solo dibuja el mundo: se eliminan el HUD interno y el overlay "GAME OVER" del original.
- API del motor: `createAsteroids(canvas, callbacks)` → `{ pause(), resume(), restart(), destroy() }`, con callbacks `onScore(n)`, `onLives(n)`, `onLevel(n)`, `onGameOver(finalScore)`.
- Pausa: botón PAUSA detiene `update` (no el render) y retira foco de teclas; el motor ignora el input mientras está en pausa o en game over.
- Controles solo teclado: `←`/`→` rotar, `↑` propulsar, `Espacio` disparar (como el original). `preventDefault` en flechas/espacio mientras el juego está montado para evitar scroll de página.
- Aviso en la UI (texto bajo el CRT) de controles; en pantallas táctiles/estrechas, aviso "REQUIERE TECLADO".
- Quitar el reinicio con Espacio del original (el reinicio lo hace "JUGAR DE NUEVO" de la plataforma).
- `prefers-reduced-motion`: sin cambio en el juego (es el contenido); se respeta en el resto de la UI como hoy.
- Textos en español; actualizar `lib/games.ts` solo si el texto de `rocas` debe reflejar mecánicas reales (power-ups, sin OVNIs si el original no los trae).
- Cambiar todas las referencia de nombres "roca" o "rocas" a "asteroides.

### Fuera (para otros specs)
- Controles táctiles / gamepad.
- Supabase: tabla `scores`, ranking real, auth. El guardado sigue por `saveScore` (localStorage de `session-provider`).
- Los demás 7 juegos (siguen con la simulación mock).
- Sonido/música.
- Mejoras de gameplay respecto al original (OVNIs, dificultad nueva, etc.).
- Tests automatizados.
- Modificar `references/started-games/02-asteroids/` (es solo referencia).

## Modelo de datos
Sin esquema persistente nuevo. Estructuras:
- `AsteroidsCallbacks { onScore(score: number): void; onLives(lives: number): void; onLevel(level: number): void; onGameOver(finalScore: number): void }`.
- `AsteroidsGame { pause(): void; resume(): void; restart(): void; destroy(): void }`.
- Estado interno del motor (encapsulado, no global): `ship`, `bullets`, `asteroids`, `particles`, `powerUps`, `score`, `lives`, `level`, `state: "playing" | "dead" | "gameover"`.
- Constantes (`RADII`, `SPEEDS`, `POINTS`, `ROT`, power-ups) conservan los valores del original.
- Ubicación: `lib/games/asteroids/{engine,entities,input,constants}.ts`, `components/games/asteroids-canvas.tsx`.
- `GamePlayer`: para `rocas`, `score`/`lives`/`level` pasan de ser simulados (`setInterval`) a venir de los callbacks; `POINTS_PER_LEVEL` solo aplica a los mocks.

## Plan de implementación
1. Leer guías de Next en `node_modules/next/dist/docs/` (Client Components, `cacheComponents`) y usar skills `frontend-design` + `ui-ux-pro-max` para el marco del canvas.
2. Leer completo `game.js` y listar comportamientos a preservar (power-ups, división de asteroides, niveles, invulnerabilidad al reaparecer).
3. Crear `lib/games/asteroids/` (constantes, entidades, input por instancia, motor) con la API `createAsteroids`; sin referencias a `document`/`window` fuera de `createAsteroids`/`destroy`. `npm run lint` y `tsc` pasan.
4. Crear `components/games/asteroids-canvas.tsx` (ciclo de vida limpio, compatible con React StrictMode: doble montaje no duplica loops ni listeners).
5. Integrar en `GamePlayer`: rama `rocas`, callbacks → estado, PAUSA/FIN/reinicio conectados al motor, modal de game over abierto por `onGameOver`; `FIN` termina la partida con la puntuación actual.
6. CSS: estilos mínimos del canvas dentro de `.crt-screen` (escalado, centrado, `image-rendering`, aviso de controles) en `globals.css`, sin romper el CSS legado.
7. Ajustar textos de `rocas` en `lib/games.ts` si no coinciden con el juego real.
8. Verificación con Playwright MCP a 1280 y 375: abrir `/juegos/rocas/jugar`, jugar con teclado, pausa, perder las 3 vidas, guardar puntuación, jugar de nuevo, salir y volver; revisar consola y scroll horizontal. `npm run lint` y `npm run build`.

## Criterios de aceptación
- [ ] `/juegos/asteroides/jugar` muestra el canvas de Asteroides dentro del marco CRT; el resto de juegos sigue mostrando el mock.
- [ ] `←`/`→` rotan, `↑` propulsa, `Espacio` dispara; las teclas no hacen scroll de la página.
- [ ] Destruir asteroides suma puntos (grande/mediano/pequeño según `POINTS`) y se refleja en el HUD de la plataforma; los asteroides se dividen como en el original.
- [ ] Chocar resta una vida visible en el HUD; con 0 vidas aparece el modal "FIN DEL JUEGO" con la puntuación final correcta.
- [ ] Limpiar todos los asteroides sube el nivel en el HUD y genera una nueva oleada.
- [ ] PAUSA congela el juego y el input; REANUDAR continúa sin saltos (sin `dt` acumulado).
- [ ] `FIN` abre el modal con la puntuación actual; "GUARDAR PUNTUACIÓN" llama a `saveScore({ game: "rocas", score, name })`; "JUGAR DE NUEVO" reinicia estado, HUD y motor.
- [ ] Navegar fuera (SALIR / ruta) y volver no deja loops ni listeners duplicados (una sola velocidad de juego tras 3 entradas/salidas; sin errores de consola).
- [ ] En StrictMode (dev) no hay doble loop ni doble disparo por pulsación.
- [ ] A 375px no hay scroll horizontal (`scrollWidth <= innerWidth`), el canvas escala sin deformarse y se muestra el aviso "REQUIERE TECLADO".
- [ ] Sin errores de consola ni de hidratación en `/juegos/rocas`, `/juegos/rocas/jugar` y demás rutas.
- [ ] `references/started-games/02-asteroids/` queda sin cambios.
- [ ] `npm run lint` y `npm run build` sin errores.

## Decisiones tomadas y descartadas
- **Reemplazar el mock `rocas`** (elegido) vs añadir `asteroides` como 9º juego: evita duplicados y reutiliza id, portada y ruta existentes.
- **Port a módulo TS** (elegido) vs `<iframe>` a HTML estático en `public/`: el HUD, la pausa y el guardado de la plataforma necesitan acceso directo al estado; el iframe obligaría a `postMessage`.
- **La plataforma manda la UI** (elegido) vs canvas con su propio HUD: coherencia visual entre juegos y un único flujo de game over/guardado reutilizable por los siguientes juegos.
- **Solo teclado** (elegido) vs controles táctiles: se acota el alcance; táctil en spec propio.
- **`saveScore` actual (localStorage)** (elegido) vs Supabase `scores`: ranking real es un dominio aparte (auth + tablas + RLS).
- **Motor desacoplado del DOM** con API `create/pause/resume/restart/destroy`: patrón reutilizable para los próximos juegos.
- **Se descarta el reinicio con Espacio** del original: el reinicio pertenece a la plataforma.

## Riesgos
- **Fugas de loop/listeners** al desmontar o con StrictMode: cubierto por `destroy()` y criterio de aceptación explícito.
- **`dt` acumulado al pausar o cambiar de pestaña**: mantener el tope de 50 ms y resetear `lastTime` al reanudar.
- **Foco/teclas atascadas** (`keys` en `true` al pausar o perder foco): limpiar `keys` en pausa y en `blur`.
- **Conflicto de atajos** (espacio/flechas hacen scroll o activan botones enfocados): `preventDefault` solo mientras el juego está activo; cuidar el botón enfocado tras pulsar PAUSA.
- **Canvas en HiDPI/móvil**: escalar por CSS conservando 800×600 lógicos; verificar nitidez y proporción a 375px.
- **`cacheComponents`**: el canvas va en Client Component; la página `jugar` sigue siendo Server Component sin lecturas dinámicas.
- **Textos del mock de `rocas`** (p. ej. "OVNIs") pueden no coincidir con el juego real: revisar en el paso 7.
