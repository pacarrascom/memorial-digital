import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para Client Components.
 * Usa la anon key pública — todo el acceso a datos queda
 * gobernado por las políticas RLS del proyecto, nunca por este cliente.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
