# Migraciones SQL — Dorsera Memorial

## Orden de ejecución

1. `0001_extensions_enums.sql` — extensiones (pgcrypto, citext) y tipos ENUM
2. `0002_identity_tables.sql` — profiles, persons, family_groups, membresías, funerarias
3. `0003_memorial_tables.sql` — memorials, qr_codes, albums, media_items, timeline, árbol genealógico, tributos
4. `0004_commerce_analytics.sql` — subscriptions, analytics_events, audit_logs
5. `0005_functions_triggers.sql` — funciones auxiliares de RLS, triggers de `updated_at`, alta automática de perfil
6. `0006_rls_policies.sql` — políticas RLS de las 17 tablas

Aplícalas en ese orden, tal cual, en el **SQL Editor de Supabase** (Dashboard → SQL Editor → New query → pegar → Run), una migración a la vez. Si usas la CLI de Supabase (`supabase db push` / `supabase migration up`), renómbralas con el timestamp que genera `supabase migration new` y colócalas en `supabase/migrations/`.

## Notas importantes

- **La integración Vercel–Supabase vía GitHub no aplica estas migraciones retroactivamente** en un proyecto ya creado — deben correrse manualmente por SQL Editor o CLI la primera vez.
- Después de correr `0002`, verifica que el trigger `trg_on_auth_user_created` (en `0005`) efectivamente cree una fila en `profiles` al registrar un usuario de prueba — es la pieza que conecta `auth.users` con el resto del esquema.
- Las tablas `analytics_events` y `audit_logs` están pensadas para que solo el **service_role** (usado en Edge Functions, nunca expuesto al cliente) inserte filas. No hay policy de `insert` para esas tablas a propósito: así, si el cliente intenta insertar directamente, RLS lo bloquea por defecto.
- `persons.dorsera_person_id` queda `null` hasta que exista la integración con Dorsera core. Cuando ese evento ocurra, se actualiza este campo — no se duplica la fila.
- Si en tu build de Next.js ves errores de TypeScript proviniendo de imports estilo Deno dentro de las Edge Functions, agrega la carpeta `supabase` al arreglo `exclude` de `tsconfig.json` — el compilador de Next.js no debe intentar tipar ese código.
- Cuidado con los joins `!inner` de PostgREST sobre `tributes` o `media_items` al pedir un memorial: si un memorial nuevo aún no tiene tributos, un `!inner` hará que la fila completa del memorial desaparezca del resultado (404 falso). Usa el join por defecto (left) en la query de la página pública del memorial.
- Estas migraciones no incluyen las políticas de **Storage** (buckets de `media_items`, fotos de perfil, PDFs de QR). Esas se configuran aparte en Supabase Storage con policies que referencian las mismas funciones (`is_family_member`, etc.) — puedo generarlas como siguiente entregable si las necesitas.
