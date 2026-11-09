"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { StoredScore } from "@/lib/scores";

export interface SessionUser {
  name: string;
}

interface SessionContextValue {
  /** null = invitado (o aún sin hidratar). */
  user: SessionUser | null;
  login: (user: SessionUser | null) => void;
  signOut: () => void;
  saveScore: (entry: Omit<StoredScore, "at">) => void;
}

const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";
const CHANGE_EVENT = "av:session-change";

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // localStorage bloqueado: la sesión simplemente no persiste.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

const getSnapshot = () => readStorage(USER_KEY);
const getServerSnapshot = () => null;

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const user = useMemo<SessionUser | null>(() => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed?.name === "string" ? { name: parsed.name } : null;
    } catch {
      return null;
    }
  }, [raw]);

  const login = useCallback((u: SessionUser | null) => {
    writeStorage(USER_KEY, u ? JSON.stringify(u) : null);
  }, []);

  const signOut = useCallback(() => writeStorage(USER_KEY, null), []);

  const saveScore = useCallback((entry: Omit<StoredScore, "at">) => {
    let all: StoredScore[] = [];
    try {
      const parsed = JSON.parse(readStorage(SCORES_KEY) || "[]");
      if (Array.isArray(parsed)) all = parsed;
    } catch {}
    all.push({ ...entry, at: Date.now() });
    writeStorage(SCORES_KEY, JSON.stringify(all));
  }, []);

  const value = useMemo(
    () => ({ user, login, signOut, saveScore }),
    [user, login, signOut, saveScore],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de <SessionProvider>");
  return ctx;
}
