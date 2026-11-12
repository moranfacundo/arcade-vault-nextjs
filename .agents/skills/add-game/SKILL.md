---
name: add-game
description: Genera el spec para agregar un juego a Arcade Vault (portar uno existente de references/started-games o diseñar uno nuevo) siguiendo el patrón de SPEC 05/06 - motor TS sin DOM, canvas cliente, fila en `games`, portada CSS, HUD de la plataforma. Usar cuando se pida agregar, integrar, portar o crear un juego en la plataforma. No escribe código.
argument-hint: '<nombre del juego o ruta en references/started-games>'
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, Bash(ls:*), Bash(cat:*), Bash(date:*)
---

# /add-game — Spec de integración de un juego en Arcade Vault

## Contexto de sesión

Fecha de hoy (úsala en el encabezado del spec, nunca la adivines):
!`date +%F`

Specs existentes:
!`ls specs/ 2>/dev/null || echo "No existe specs/"`

Juegos de referencia disponibles:
!`ls references/started-games/ 2>/dev/null || echo "No existe references/started-games/"`

---

Esta skill produce **un spec** (`specs/NN-<slug>-game.md`) para agregar **un** juego a la plataforma, reutilizando el patrón de SPEC 05 (Asteroides) y SPEC 06 (tablas `games`/`scores`). **No escribe código, no toca la BD, no modifica `references/`.** La implementación la hace luego `/spec-impl`.

Responde en el mismo idioma del prompt (por defecto español, como los specs del repo).

## Archivos de apoyo (léelos antes de preguntar)

- `platform-contract.md` (mismo directorio): checklist del contrato de integración.
- `template.md` (mismo directorio): forma exacta del spec de juego.

## Flujo

### Fase 1 — Contexto
1. Leer `CLAUDE.md`, `specs/05-asteroids-game.md` y `specs/06-games-and-scores-tables.md` (convenciones, idioma, estados, encabezados).
2. Buscar un spec de "contrato genérico de juegos / GamePlayer" (SPEC 07 esperado). Si no existe o no está `Implementado`: avisar al usuario que el refactor de `GamePlayer` (hoy acoplado a `AsteroidsCanvas`, hint de controles y vidas fijas) es prerrequisito, y declarar igualmente la dependencia en el spec. No hacer ese refactor aquí.
3. Si `$ARGUMENTS` está vacío, pedir el nombre del juego en una frase.
4. Número `NN` = mayor número en `specs/` + 1 (dos dígitos). Slug = kebab-case en español/original del juego (`tetris`, `arkanoid`, `serpiente`).

### Fase 2 — Clasificar el juego
Buscar `references/started-games/*<nombre>*` (Glob, sin distinguir mayúsculas).

**A. Existe referencia** → leerla completa (`game.js`/`levels.js`, `index.html`, `style.css`, README, CLAUDE.md, `assets/`). Inventariar y volcar en el spec:
- Estado y entidades, constantes (se conservan sus valores), loop, colisiones.
- Controles, puntuación, vidas, niveles, condición de fin.
- Lo que **se elimina** porque lo manda la plataforma: HUD interno, overlays de game over/pausa, pausa y reinicio propios, UI de puntuación.
- Dependencias de DOM/globales a encapsular (`document`, `window`, `getElementById`, listeners).
- Assets (sprites, sonidos) → destino `public/games/<slug>/`.
- Funcionalidad que no encaja con el alcance (mouse, sonido, táctil) → proponer dentro/fuera.

**B. No existe referencia** → juego nuevo. Preguntar mecánicas con `AskUserQuestion` (bloques de 3–5, recomendación primero): género/mecánica central, controles de teclado, puntuación, vidas (sí/no), niveles/dificultad, condición de fin, tamaño del canvas (por defecto 800×600). Escribir el motor TS directo en `lib/games/<slug>/`, sin crear referencia vanilla.

### Fase 3 — Preguntas comunes
Con `AskUserQuestion` (mismo bloque, sin repetir lo ya respondido):
1. `title` (MAYÚSCULAS), `short` y `long` en español (proponer borrador).
2. `category`: `ARCADE | PUZZLE | SHOOTER | VERSUS`. `color`: `cyan | magenta | green | yellow` (proponer uno no usado por los juegos ya en `games`).
3. Portada: idea visual de `.cover-<slug>` (CSS puro, como `cover-asteroides`).
4. Qué stats del HUD aplican (puntuación siempre; vidas/nivel/otros solo si el juego los tiene).
5. Sonido y mouse: dentro o fuera del alcance (por defecto fuera, como SPEC 05).
6. Conflictos con teclas de la plataforma (P/Esc/Espacio, scroll de flechas).

Parar de preguntar cuando se pueda responder sin suponer: qué archivos aparecen/cambian, primer y último paso, cómo se verifica.

### Fase 4 — Escribir el spec
1. Usar `template.md` y `platform-contract.md`; sustituir `<slug>`, `<Name>`, valores reales. Eliminar placeholders y secciones no aplicables.
2. Estado `Borrador`, `Depende de: SPEC 05, SPEC 06` (+ SPEC 07 si existe o se declara), fecha de la sesión.
3. Verificar que cada spec referenciado existe en `specs/`.
4. Guardar en `specs/NN-<slug>-game.md` sin pedir permiso (preguntar solo si ya existe).
5. Confirmar: ruta, estado `Borrador`, aviso de dependencia SPEC 07 si falta, siguiente paso `/spec-impl NN-<slug>-game` tras aprobar. **Parar ahí.**

## Reglas duras

- Nunca escribir código ni aplicar migraciones; solo el `.md` del spec.
- Un juego por spec. Si piden varios, un spec por juego.
- Nunca modificar `references/started-games/`.
- Fuera de alcance por defecto: multijugador, táctil/gamepad, auth, anti-trampa, mejoras de gameplay respecto al original.
- Criterios de aceptación booleanos y verificables; incluir siempre decisiones y riesgos.
- No asumir decisiones sin confirmar; preguntar.
