# SPEC 02 — Home landing de Arcade Vault

**Estado:** Aprobado
**Depende de:** SPEC 01
**Fecha:** 2026-11-09
**Objetivo:** Reemplazar el contenido visual de `/` por la landing de `references/templates/home-about/` (hero, features, juegos, stats, actividad, precios, CTA final) y mover la Biblioteca a `/biblioteca`.

## Alcance

### Dentro
- Nueva página `/` con las secciones del template `home.jsx`, en este orden:
  1. **Hero**: eyebrow "INSERTA UNA MONEDA_", título 3 líneas, subtítulo, 2 CTAs, indicador "DESLIZA", siluetas pixel flotantes (8 SVG).
  2. **// 01 ¿Por qué Arcade Vault?**: 4 feature cards con iconos pixel.
  3. **// 02 Juegos disponibles ahora**: rail de 6 `MiniCard` (primeros 6 de `GAMES`) + botón "VER TODOS LOS JUEGOS →".
  4. **Stats**: 3 bloques (12+ / MILES / GLOBAL).
  5. **// 03 Actividad en vivo**: "Últimas puntuaciones" (7 filas) + "Top jugadores · hoy" (5 filas con barra).
  6. **// 04 Precios**: tarjeta "Jugador Vault $0" + 3 FAQs.
  7. **CTA final**: "¿LISTO PARA JUGAR?" + "INSERTAR MONEDA →".
- Mover la Biblioteca actual de `/` a `/biblioteca` (misma UI, filtro, `GameCard`).
- Actualizar enlaces que apuntaban a `/` como Biblioteca: `Nav` (nuevo ítem "Inicio" → `/`, "Biblioteca" → `/biblioteca`, lógica de link activo), "Salir"/volver en `app/juegos/[id]/page.tsx` y `components/game-player.tsx`. El redirect post-login de `components/auth-form.tsx` queda en `/`.
- Portar a `app/globals.css` el CSS de home que existe en `references/templates/home-about/styles.css` y no en `globals.css` (clases `home-*`, `feature-*`, `mini-*`, `stat-*`, `activity-*`, `ticker`, `top-*`, `pricing-*`, `price-card`, `faq-*`, `silo`, `reveal`, keyframes asociados), manteniendo el estilo de CSS legado (sin `@layer`).
- Reveal al scroll con `IntersectionObserver` (client component); siluetas y animaciones desactivadas con `prefers-reduced-motion` (contenido visible sin animar).
- Datos mock estáticos tipados en `lib/home.ts` (últimas puntuaciones, top jugadores, features, stats, FAQs).
- Responsive (375 / 1280) y a11y básica (decorativos `aria-hidden`, un solo `h1`, CTAs como `Link`, foco visible).
- Textos en español.

### Fuera (para otros specs)
- Pantalla "Acerca de" (`about.jsx`) y su ruta/ítem de nav.
- Nav nuevo completo de `home-about/nav.jsx`: contador "CRÉDITOS · 03", ítem "Acerca de" y rediseño del nav.
- Actividad real (derivada de `av_scores`/backend); precios o registro reales.
- Cambios visuales en las otras 5 pantallas fuera de los enlaces mencionados.
- SEO avanzado, tests automatizados, i18n.

## Modelo de datos
Solo mock tipado, sin cambios de esquema externo (`lib/home.ts`):
- `ActivityRow { player: string; game: string; score: number; ago: string; color: GameColor }` — 7 filas.
- `TopPlayer { rank: number; player: string; score: number }` — 5 filas.
- `Feature { icon: "GAMEPAD"|"FREE"|"TROPHY"|"ROCKET"; title; desc; color: GameColor }` — 4.
- `Stat { n; u; s }` — 3. `Faq { q; a }` — 3.
- `GAMES` (SPEC 01) se reutiliza para el rail; sin cambios.
- Números formateados con `toLocaleString("es-ES")` (determinista para evitar mismatch de hidratación).

## Plan de implementación
1. Leer guías relevantes en `node_modules/next/dist/docs/` (routing, client components) y usar skills `frontend-design` + `ui-ux-pro-max`.
2. Mover la Biblioteca: crear `app/biblioteca/page.tsx` con `<Library />`; `/` queda temporalmente apuntando a un placeholder. Actualizar `Nav` (Inicio / Biblioteca, link activo: `/biblioteca` activo también en `/juegos/*`) y enlaces en detalle y reproductor. App compila y navega.
3. CSS: portar a `globals.css` los estilos home que faltan; `npm run lint` pasa.
4. Datos: `lib/home.ts` tipado.
5. Componentes en `components/home/`: `floating-silhouettes.tsx`, `feature-icon.tsx`, `mini-card.tsx`, `reveal.tsx` (client, IntersectionObserver).
6. `app/page.tsx`: ensamblar hero + secciones 01–04 + stats + CTA final con `Link` en lugar de `navigate`.
7. Revisión visual desktop (1280) y móvil (375) contra `references/templates/home-about/arcade-vault-standalone.html` con Playwright MCP; ajustes; `npm run lint` y `npm run build`.

## Criterios de aceptación
- [ ] `/` muestra las 7 secciones en el orden indicado, con textos del template.
- [ ] `/biblioteca` muestra la Biblioteca con sus 8 juegos y filtros funcionando como antes.
- [ ] CTA "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" llevan a `/biblioteca`; "CREAR CUENTA" y "EMPEZAR GRATIS →" a `/auth`; "VER SALÓN →" a `/salon`; cada MiniCard a `/juegos/[id]`.
- [ ] Nav: "Inicio" activo solo en `/`; "Biblioteca" activo en `/biblioteca` y `/juegos/*`; menú móvil refleja lo mismo.
- [ ] "Volver" desde detalle y "salir" del reproductor llevan a `/biblioteca`; login/invitado redirige a `/`.
- [ ] Sin errores de consola ni de hidratación en `/` y `/biblioteca`.
- [ ] Sin scroll horizontal a 375px (`scrollWidth <= innerWidth`) en `/`.
- [ ] Capturas de `/` a 1280 y 375 equivalentes al template (colores, tipografías, layout, siluetas).
- [ ] Las secciones con `reveal` aparecen al hacer scroll; con `prefers-reduced-motion` son visibles de inmediato y sin animaciones.
- [ ] Un único `h1` en `/`; decorativos con `aria-hidden`.
- [ ] El resto de rutas (`/juegos/[id]`, `/jugar`, `/auth`, `/salon`) siguen funcionando.
- [ ] `npm run lint` y `npm run build` sin errores.

## Decisiones tomadas y descartadas
- **Home en `/`, Biblioteca en `/biblioteca`** (elegido) vs Biblioteca en `/juegos` (colisión con `/juegos/[id]`) vs landing encima de la Biblioteca (página larga, se aleja del template).
- **Nav: solo lo necesario** (elegido): se añade "Inicio"/"Biblioteca"; no se porta el nav completo ni "Acerca de" ni créditos.
- **Alcance de secciones**: todas las del template excepto About (pedido explícito del usuario).
- **Actividad con mock estático** (elegido) vs derivar de `localStorage`: determinista y sin riesgo de hidratación; vacío para usuarios nuevos descartado.
- **CSS legado sin `@layer`** (continuidad con SPEC 01): para sobreescribir utilidades Tailwind usar `!`.
- Copy del template (p. ej. "Sin anuncios", "Nuevos juegos cada mes") se porta tal cual; es contenido mock.

## Riesgos
- **Hidratación:** `toLocaleString`, reveal y animaciones solo en cliente; no usar `Math.random`/fechas en render.
- **Next 16 con `cacheComponents`:** `app/page.tsx` debe ser estática o con `Suspense`; consultar docs locales.
- **Enlaces rotos a `/`** tras mover la Biblioteca: cubierto por criterios de navegación.
- **Rendimiento/overflow en móvil** por siluetas flotantes y ticker: verificar a 375px.
- **Colisión de nombres CSS** (`.reveal`, `.silo`, `.ticker`) con el CSS legado: revisar al portar.
