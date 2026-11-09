"use client";

import { useEffect, useRef, useState } from "react";

type RevealProps = {
  as?: "section" | "div";
  className?: string;
  children: React.ReactNode;
};

/** Envuelve una sección y la muestra (`.reveal.in`) al entrar en el viewport. */
export function Reveal({ as: Tag = "section", className = "", children }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => setShown(true));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      className={`${className} reveal${shown ? " in" : ""}`.trim()}
    >
      {children}
    </Tag>
  );
}
