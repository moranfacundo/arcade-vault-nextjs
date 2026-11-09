export interface ContactInput {
  name: string;
  email: string;
  message: string;
}

export type ContactErrorCode = "VALIDATION" | "RATE_LIMIT" | "SEND_FAILED";

export type ContactState =
  | { status: "idle" }
  | { status: "success"; name: string }
  | {
      status: "error";
      code: ContactErrorCode;
      message: string;
      retryAfterMin?: number;
      fields?: Partial<Record<keyof ContactInput, string>>;
    };

export const CONTACT_COOKIE = "av_contact_at";
export const RATE_LIMIT_MS = 60 * 60 * 1000;
export const RATE_LIMIT_SECONDS = RATE_LIMIT_MS / 1000;

export const NAME_MAX = 60;
export const MESSAGE_MAX = 2000;

const EMAIL_RE = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]{2,}$/;
const EMAIL_MAX = 254;

/** Quita saltos de línea y caracteres de control (anti header injection). */
export function stripControl(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
}

export type ValidationResult =
  | { ok: true; data: ContactInput }
  | { ok: false; fields: Partial<Record<keyof ContactInput, string>> };

export function validateContact(formData: FormData): ValidationResult {
  const rawName = formData.get("name");
  const rawEmail = formData.get("email");
  const rawMessage = formData.get("message");

  const name = stripControl(typeof rawName === "string" ? rawName : "");
  const email = stripControl(typeof rawEmail === "string" ? rawEmail : "");
  const message = (typeof rawMessage === "string" ? rawMessage : "").replace(/\r\n/g, "\n").trim();

  const fields: Partial<Record<keyof ContactInput, string>> = {};

  if (!name) fields.name = "Escribe tu nombre.";
  else if (name.length > NAME_MAX) fields.name = `Máximo ${NAME_MAX} caracteres.`;

  if (!email) fields.email = "Escribe tu correo.";
  else if (email.length > EMAIL_MAX || !EMAIL_RE.test(email)) fields.email = "Correo no válido.";

  if (!message) fields.message = "Escribe tu mensaje.";
  else if (message.length > MESSAGE_MAX) fields.message = `Máximo ${MESSAGE_MAX} caracteres.`;

  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, data: { name, email, message } };
}

// --- Rate limit: 1 envío/hora (cookie + IP en memoria) ---

const globalForLimit = globalThis as unknown as { __avContactIps?: Map<string, number> };
const ipMap: Map<string, number> = (globalForLimit.__avContactIps ??= new Map());

function purgeExpired(now: number) {
  for (const [ip, at] of ipMap) {
    if (now - at > RATE_LIMIT_MS) ipMap.delete(ip);
  }
}

function minutesLeft(lastAt: number, now: number): number {
  return Math.max(1, Math.ceil((lastAt + RATE_LIMIT_MS - now) / 60000));
}

/** Primera IP de `x-forwarded-for` (o `x-real-ip`); null si no hay. */
export function getClientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || null;
}

/** Devuelve minutos restantes si el usuario está limitado, o null si puede enviar. */
export function checkRateLimit(opts: {
  cookieValue: string | undefined;
  ip: string | null;
  now?: number;
}): number | null {
  const now = opts.now ?? Date.now();
  purgeExpired(now);

  const cookieAt = Number(opts.cookieValue);
  if (Number.isFinite(cookieAt) && cookieAt > 0 && now - cookieAt < RATE_LIMIT_MS) {
    return minutesLeft(cookieAt, now);
  }

  if (opts.ip) {
    const ipAt = ipMap.get(opts.ip);
    if (ipAt !== undefined && now - ipAt < RATE_LIMIT_MS) {
      return minutesLeft(ipAt, now);
    }
  }
  return null;
}

/** Registra el envío exitoso por IP (la cookie la fija la action). */
export function recordSend(ip: string | null, now: number = Date.now()) {
  purgeExpired(now);
  if (ip) ipMap.set(ip, now);
}
