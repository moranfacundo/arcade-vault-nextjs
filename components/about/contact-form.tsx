"use client";

import { useActionState, useId, useState } from "react";
import { sendContact } from "@/app/acerca/actions";
import { MESSAGE_MAX, NAME_MAX, type ContactState } from "@/lib/contact";

const INITIAL: ContactState = { status: "idle" };
const EMPTY = { name: "", email: "", message: "" };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContact, INITIAL);
  const [values, setValues] = useState(EMPTY);
  const [shake, setShake] = useState(false);
  // Estado de éxito que el usuario ya cerró con "ENVIAR OTRO MENSAJE".
  const [dismissed, setDismissed] = useState<ContactState | null>(null);

  const uid = useId();
  const ids = { name: `${uid}-name`, email: `${uid}-email`, message: `${uid}-message` };

  const showTerminal = state.status === "success" && dismissed !== state;
  const error = state.status === "error" ? state : null;
  const fieldErrors = error?.fields ?? {};

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!values.name.trim() || !values.email.trim() || !values.message.trim()) {
      e.preventDefault();
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  function describe(field: keyof typeof ids) {
    return fieldErrors[field] ? `${ids[field]}-err` : undefined;
  }

  return (
    <form
      className={"contact-form" + (shake ? " shake" : "")}
      action={formAction}
      onSubmit={onSubmit}
      noValidate
    >
      {!showTerminal && (
        <>
          <div className="field">
            <label htmlFor={ids.name}>NOMBRE</label>
            <input
              id={ids.name}
              name="name"
              autoComplete="name"
              maxLength={NAME_MAX}
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
              placeholder="px_kai"
              aria-invalid={fieldErrors.name ? true : undefined}
              aria-describedby={describe("name")}
            />
            {fieldErrors.name && (
              <p id={`${ids.name}-err`} className="text-magenta text-xs">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor={ids.email}>CORREO ELECTRÓNICO</label>
            <input
              id={ids.email}
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(e) => setValues({ ...values, email: e.target.value })}
              placeholder="jugador@vault.gg"
              aria-invalid={fieldErrors.email ? true : undefined}
              aria-describedby={describe("email")}
            />
            {fieldErrors.email && (
              <p id={`${ids.email}-err`} className="text-magenta text-xs">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor={ids.message}>MENSAJE</label>
            <textarea
              id={ids.message}
              name="message"
              rows={5}
              maxLength={MESSAGE_MAX}
              value={values.message}
              onChange={(e) => setValues({ ...values, message: e.target.value })}
              placeholder="Cuéntanos qué tienes en mente…"
              aria-invalid={fieldErrors.message ? true : undefined}
              aria-describedby={describe("message")}
            />
            {fieldErrors.message && (
              <p id={`${ids.message}-err`} className="text-magenta text-xs">
                {fieldErrors.message}
              </p>
            )}
          </div>

          <button
            className="btn xl press disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            style={{ width: "100%" }}
            disabled={pending}
          >
            {pending ? "ENVIANDO…" : "▶  ENVIAR MENSAJE"}
          </button>
        </>
      )}

      <div aria-live="polite" aria-atomic="true">
        {pending && !showTerminal && (
          <p className="mt-3 text-sm text-(--ink-dim)">Enviando mensaje…</p>
        )}
        {!pending && !showTerminal && error && (
          <p className="mt-3 text-sm text-magenta">{error.message}</p>
        )}
        {showTerminal && state.status === "success" && (
          <div className="terminal-success">
            <div className="term-bar" aria-hidden="true">
              <span className="dot r"></span>
              <span className="dot y"></span>
              <span className="dot g"></span>
              <span className="term-title">VAULT-OS // TERMINAL</span>
            </div>
            <div className="term-body">
              <div className="line">
                <span className="prompt">vault@arcade:~$</span> ./send_message --to=team
              </div>
              <div className="line dim">[OK] Conectando con servidor…</div>
              <div className="line dim">[OK] Validando contenido…</div>
              <div className="line dim">[OK] Transmitiendo paquete…</div>
              <div className="line success">
                &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {state.name.toUpperCase()}.
                <span className="caret" aria-hidden="true">_</span>
              </div>
              <div style={{ marginTop: 18 }}>
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() => {
                    setDismissed(state);
                    setValues(EMPTY);
                  }}
                >
                  ENVIAR OTRO MENSAJE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
