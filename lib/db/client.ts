import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Cliente de solo lectura sin cookies ni sesión. Sirve para lecturas públicas
 * (catálogo, ranking) también en `generateStaticParams` y en el prerender,
 * donde `cookies()` no está disponible. Un cliente por llamada.
 */
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
