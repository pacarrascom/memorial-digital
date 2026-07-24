import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Crea un cliente de Supabase para usar en Server Components,
 * Route Handlers y Server Actions dentro del App Router.
 *
 * Requiere las variables de entorno:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 * (o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, según el nombre que haya
 * quedado configurado en la integración de Vercel con Supabase)
 */
export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Faltan las variables de entorno de Supabase (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). Revisa la configuración en Vercel → Environment Variables.'
    )
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as CookieOptions)
          })
        } catch {
          // El método `setAll` fue llamado desde un Server Component.
          // Esto puede ignorarse si hay middleware refrescando la sesión.
        }
      },
    },
  })
}

/**
 * Obtiene el usuario autenticado actual (o null) junto con su rol,
 * consultando la tabla de perfiles/roles del esquema RBAC.
 */
export async function getCurrentUserWithRole() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('user_roles')
    .select('role, family_group_id')
    .eq('user_id', user.id)
    .single()

  return {
    ...user,
    role: profile?.role ?? 'visitante',
    familyGroupId: profile?.family_group_id ?? null,
  }
}
