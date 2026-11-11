/** Fallback de `<Suspense>` mientras se cargan datos de Supabase. */
export function DataFallback({ label = "CARGANDO…" }: { label?: string }) {
  return (
    <div className="p-20 text-center" role="status" aria-live="polite">
      <div className="pixel text-[12px] text-ink-faint">
        {label} <span className="blink">_</span>
      </div>
    </div>
  );
}
