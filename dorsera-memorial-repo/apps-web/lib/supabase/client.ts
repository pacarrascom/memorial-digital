import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente de Supabase para usar en Client Components ('use client').
 * No estaba entre los módulos que faltaban, pero LoginForm y
 * RegisterForm lo necesitan para llamar signInWithPassword / signUp
 * desde el navegador.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
