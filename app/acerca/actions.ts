"use server";

import { cookies, headers } from "next/headers";
import { Resend } from "resend";
import {
  CONTACT_COOKIE,
  RATE_LIMIT_SECONDS,
  checkRateLimit,
  getClientIp,
  recordSend,
  validateContact,
  type ContactState,
} from "@/lib/contact";

const FROM = "Arcade Vault <arcadevault@resend.dev>";

const SEND_FAILED: ContactState = {
  status: "error",
  code: "SEND_FAILED",
  message: "No pudimos enviar tu mensaje. Inténtalo de nuevo en unos minutos.",
};

export async function sendContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // 1. Validación
  const result = validateContact(formData);
  if (!result.ok) {
    return {
      status: "error",
      code: "VALIDATION",
      message: "Revisa los campos marcados.",
      fields: result.fields,
    };
  }
  const { name, email, message } = result.data;

  // 2. Límite 1/hora (cookie + IP)
  const cookieStore = await cookies();
  const ip = getClientIp(await headers());
  const retryAfterMin = checkRateLimit({
    cookieValue: cookieStore.get(CONTACT_COOKIE)?.value,
    ip,
  });
  if (retryAfterMin !== null) {
    return {
      status: "error",
      code: "RATE_LIMIT",
      message: `Ya enviaste un mensaje. Vuelve a intentarlo en ${retryAfterMin} min.`,
      retryAfterMin,
    };
  }

  // 3. Envío con Resend
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.RESEND_TO;
  if (!apiKey || !to) {
    console.error("[contact] Faltan RESEND_API_KEY o RESEND_TO");
    return SEND_FAILED;
  }

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: FROM,
      to,
      replyTo: email,
      subject: `Contacto Arcade Vault: ${name}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\n${message}`,
    });
    if (error) {
      console.error("[contact] Resend error:", error.message);
      return SEND_FAILED;
    }
  } catch (err) {
    console.error("[contact] Resend exception:", err);
    return SEND_FAILED;
  }

  // 4. Solo tras éxito: registrar límite
  const now = Date.now();
  cookieStore.set(CONTACT_COOKIE, String(now), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: RATE_LIMIT_SECONDS,
    path: "/",
  });
  recordSend(ip, now);

  return { status: "success", name };
}
