# SPEC 03 — Página Acerca de + formulario de contacto

**Estado:** Implementado
**Depende de:** SPEC 01, SPEC 02
**Fecha:** 2026-11-09
**Objetivo:** Construir la página `/acerca` (misión + formulario de contacto) según `references/templates/home-about/about.jsx`, enviando el mensaje por correo con Resend (free tier) y limitando el envío a 1 por hora por usuario.

## Alcance

### Dentro
- Nueva ruta `/acerca` con las secciones de `about.jsx`:
  1. **Hero "ACERCA DE"**: kicker, `h1` "ACERCA DE ARCADE VAULT", misión, 3 highlights con iconos pixel (HEART, BROWSER, PLANT).
  2. **Divider** decorativo (`aria-hidden`) con 24 píxeles animados.
  3. **Contacto**: intro (kicker, "CONTÁCTANOS", 3 tips con LED) + formulario (nombre, correo, mensaje).
- Envío real vía **Server Action** + paquete `resend` (free tier).
  - Remitente `arcadevault@resend.dev`; destino en env `RESEND_TO` (el free tier sin dominio solo permite enviar al correo propio); `Reply-To` = correo del visitante.
  - API key en env `RESEND_API_KEY` (`.env.local`, nunca en el cliente); documentar ambas en `.env.example`.
- Validación en servidor (no vacíos, email válido, límites de longitud: nombre ≤ 60, mensaje ≤ 2000) y en cliente (shake si faltan campos, como el template).
- **Rate limit 1 envío/hora por usuario**: cookie `httpOnly` con timestamp del último envío exitoso **+** chequeo por IP en un `Map` en memoria del servidor (refuerzo). Se registra solo tras envío exitoso. Si se excede: mensaje con minutos restantes.
- Estados UI: inicial, enviando (botón deshabilitado), éxito (terminal "VAULT-OS" con `ENVIAR OTRO MENSAJE`, que al estar limitado mostrará el aviso de espera si se reintenta), error de validación, error de límite, error de Resend/servidor.
- Nav: ítem "Acerca de" → `/acerca` con link activo (desktop y menú móvil).
- Portar a `app/globals.css` el CSS de `about-*`, `highlight*`, `hl-*`, `contact-*`, `tip*`, `terminal-success`/`term-*`, `shake`, `about-divider`/`div-*` desde `references/templates/home-about/styles.css` (estilo legado, sin `@layer`).
- Reveal al scroll reutilizando `components/home/reveal.tsx`; `prefers-reduced-motion` respetado.
- Responsive (375 / 1280), a11y básica (labels asociados a inputs, `aria-live` para resultado, un solo `h1`, foco visible).
- Textos en español.

### Fuera (para otros specs)
- Dominio propio verificado en Resend, plantillas HTML elaboradas (se envía texto plano), confirmación al visitante.
- Rate limit persistente (Redis/KV/DB) o distribuido entre instancias; CAPTCHA/honeypot avanzado.
- Contador "CRÉDITOS" y rediseño del nav de `nav.jsx`.
- Tests automatizados, i18n, SEO avanzado.
- Guardar mensajes en BD.

## Modelo de datos
Sin esquema persistente. Estructuras:
- `ContactInput { name: string; email: string; message: string }` (FormData → validado en servidor).
- `ContactState = { status: "idle" } | { status: "success"; name: string } | { status: "error"; code: "VALIDATION" | "RATE_LIMIT" | "SEND_FAILED"; message: string; retryAfterMin?: number; fields?: Partial<Record<keyof ContactInput, string>> }`.
- Cookie `av_contact_at` (httpOnly, sameSite=lax, maxAge 3600 s, valor = epoch ms del último envío).
- `Map<string, number>` (IP → epoch ms) en módulo del servidor, con limpieza de entradas > 1 h.
- Env: `RESEND_API_KEY`, `RESEND_TO`.
- Ubicación propuesta: `lib/contact.ts` (tipos, validación, rate limit), `app/acerca/actions.ts` (Server Action), `app/acerca/page.tsx`, `components/about/contact-form.tsx`, `components/about/highlight-icon.tsx`.

## Plan de implementación
1. Leer guías en `node_modules/next/dist/docs/` (Server Actions, `cookies()`/`headers()`, `cacheComponents`, forms/`useActionState`) y usar skills `frontend-design` + `ui-ux-pro-max`.
2. CSS: portar a `globals.css` los estilos de about/contacto; `npm run lint` pasa.
3. Instalar `resend`; crear `.env.example`; verificar que `.env*` esté ignorado por git.
4. `lib/contact.ts`: tipos, `validateContact`, helpers de rate limit (cookie + IP).
5. `app/acerca/actions.ts`: Server Action `sendContact` (`"use server"`): valida → chequea límite → envía con Resend → fija cookie y registra IP → devuelve `ContactState`.
6. Componentes: `highlight-icon.tsx`, `contact-form.tsx` (client, `useActionState`, shake, estados, terminal de éxito).
7. `app/acerca/page.tsx` ensamblando hero + divider + contacto (respetando `cacheComponents`: lectura de cookies/headers solo dentro de la action).
8. Nav: ítem "Acerca de" con link activo y reflejo en menú móvil.
9. Verificación con Playwright MCP a 1280 y 375 contra `arcade-vault-standalone.html`; probar envío real con clave de prueba, el segundo envío (bloqueado) y fallo de Resend; `npm run lint` y `npm run build`.

## Criterios de aceptación
- [x] `/acerca` muestra hero, divider y contacto en ese orden, con los textos del template.
- [x] Nav muestra "Acerca de" (desktop y móvil), activo solo en `/acerca`.
- [x] Enviar con campos vacíos o email inválido no llama a Resend y muestra error de validación (shake en cliente).
- [x] Con `RESEND_API_KEY`/`RESEND_TO` válidos, un envío correcto entrega el correo a `RESEND_TO` con `Reply-To` = correo del visitante y muestra la terminal de éxito con el nombre en mayúsculas.
- [x] Un segundo envío dentro de 60 min (misma cookie) se rechaza sin llamar a Resend y muestra minutos restantes.
- [x] Borrar la cookie y reenviar desde la misma IP dentro de 60 min también se rechaza.
- [x] Un envío fallido de Resend muestra error genérico y **no** consume el límite.
- [x] `RESEND_API_KEY` no aparece en el bundle cliente ni en el repo; `.env.example` existe y `.env.local` está ignorado.
- [x] Botón deshabilitado y texto de estado mientras envía; el resultado se anuncia vía `aria-live`.
- [x] Sin errores de consola ni de hidratación en `/acerca`.
- [x] Sin scroll horizontal a 375px (`scrollWidth <= innerWidth`).
- [x] Capturas a 1280 y 375 equivalentes al template.
- [x] Un único `h1`; decorativos con `aria-hidden`; inputs con `label` asociado.
- [x] Las demás rutas siguen funcionando.
- [x] `npm run lint` y `npm run build` sin errores.

## Decisiones tomadas y descartadas
- **Server Action + `resend`** (elegido) vs Route Handler `/api/contacto`: idiomático en Next 16, sin endpoint REST explícito.
- **Rate limit cookie + IP en memoria** (elegido) vs solo IP / solo cookie / Redis: sin infraestructura extra; la cookie cubre al usuario normal y la IP frena el borrado trivial de cookies. Limitación aceptada: el `Map` se pierde al reiniciar y no se comparte entre instancias serverless; usuarios tras la misma NAT comparten límite.
- **Registrar el límite solo tras envío exitoso**: un fallo de Resend no penaliza al usuario.
- **Remitente `arcadevault@resend.dev` → `RESEND_TO`** (elegido) vs dominio propio: el free tier sin dominio verificado solo envía al correo del dueño de la cuenta.
- **Ruta `/acerca`** (elegida) coherente con rutas en español (`/biblioteca`, `/salon`); ítem "Acerca de" en nav sin portar créditos ni rediseño.
- **Texto plano** en el correo (sin plantilla HTML) para mantener el alcance acotado.
- El "éxito" del template era simulado (solo `setSent`); aquí pasa a depender de la respuesta del servidor.

## Riesgos
- **Límite en memoria no fiable en serverless/multi-instancia**: aceptado; migrar a KV si el sitio se despliega así.
- **IP no disponible o falsificable** (`x-forwarded-for`): usar la primera IP del header; si falta, aplicar solo la cookie.
- **Cuota free de Resend** (≈100 correos/día, 3000/mes): suficiente con el límite por usuario; un abuso distribuido podría agotarla.
- **`cacheComponents`**: `cookies()`/`headers()` fuera de `Suspense` en la página rompe el prerender; confinarlos a la action.
- **Header injection / spam**: validar y sanear `name` y `email` antes de usarlos en asunto y `Reply-To`.
- **Colisión de nombres CSS** (`.shake`, `.tip`, `.field`) con el CSS legado: revisar al portar.
