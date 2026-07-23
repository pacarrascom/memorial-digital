# Dorsera Memorial — Frontend (Next.js)

## Qué incluye este entregable

La **página pública del memorial** (`/m/[slug]`), que es el destino real de cada escaneo de QR — por eso es la primera pieza de frontend que vale la pena construir con cuidado:

- `app/layout.tsx` — fuentes (Fraunces, Public Sans, IBM Plex Mono) y metadata base
- `app/m/[slug]/page.tsx` — página con **ISR** (`revalidate = 300`), SEO (Open Graph + JSON-LD Schema.org `Person`), y el fetch a Supabase ya corregido para evitar el bug de los joins `!inner`
- `components/memorial/` — Hero (con la "cinta de luz" de marca), Timeline, Gallery, TributeBook (con vela virtual)
- `lib/supabase/client.ts` y `lib/supabase/server.ts` — clientes para Client/Server Components, más un cliente de service_role para uso exclusivo en servidor
- `types/database.ts` — tipos a mano; reemplázalos por `supabase gen types typescript` en cuanto conectes el proyecto real
- `tailwind.config.ts` / `app/globals.css` — el sistema de diseño (tokens ink/stone/moss/flame/mist/ash) aplicado en código, con soporte de modo oscuro, foco de teclado visible y `prefers-reduced-motion`

## Cómo integrarlo

1. Copia estas carpetas dentro de tu monorepo Next.js existente (respetando la estructura de `app/`, `components/`, `lib/`, `types/`).
2. Variables de entorno necesarias en `.env.local` y en Vercel:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```
   Recuerda: si la integración Vercel–Supabase te generó `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en vez de `NEXT_PUBLIC_SUPABASE_ANON_KEY`, renómbrala o actualiza el código — es el mismo mismatch que ya resolviste durante el deploy.
3. Añade `supabase` al `exclude` de tu `tsconfig.json` si no lo has hecho, para que el compilador de Next.js no intente tipar las Edge Functions.
4. Corre `npm install` y `npm run dev`.
5. Prueba con un `slug` real de un memorial ya sembrado en la base de datos.

## Autenticación (agregado)

- `middleware.ts` + `lib/supabase/middleware.ts` — refresca la sesión en cada request y protege `/admin/*`, redirigiendo a `/login?redirectTo=...` si no hay sesión.
- `lib/actions/auth.ts` — Server Actions `signUp`, `signIn`, `signOut` (usan `useActionState` en el cliente).
- `app/(auth)/login` y `app/(auth)/register` — páginas con sus formularios (`components/auth/`).
- `app/auth/callback/route.ts` — intercambia el `?code=` del enlace de confirmación por una sesión (también sirve para OAuth futuro).
- `app/admin/` — layout + página placeholder protegida, muestra las familias del usuario en sesión.

Variable de entorno adicional necesaria:
```
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com   # usado en el emailRedirectTo del registro
```

En Supabase: en **Authentication → URL Configuration**, agrega `https://tu-dominio.com/auth/callback` (y el de `localhost:3000` para desarrollo) a la lista de Redirect URLs, o el enlace de confirmación no funcionará.

## Lo que falta (siguientes entregables sugeridos)

- **Panel de administración familiar**: formulario de edición de biografía/timeline/galería, moderación de tributos (aprobar/rechazar), creación de `family_groups` y gestión de colaboradores.
- **Generación de QR**: Edge Function que crea el `short_code`, y renderiza PNG/SVG/PDF (librería `qrcode` ya está en `package.json`).
- **Panel de funeraria (B2B)**: alta de memoriales para clientes, vista agregada de sus memoriales gestionados.
- **Árbol genealógico interactivo**: componente de visualización de grafo sobre `family_tree_relationships`.

Dime cuál seguimos y lo construimos con el mismo nivel de detalle.
