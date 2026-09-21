# Migraciones SQL — Dorsera Memorial

**Regeneradas el 2026-09-21 a partir del esquema real** del proyecto Supabase
"Memorial Digital" (`xsnqcssrlhbwxistwiqx`). La versión anterior de esta carpeta
(0001-0010) quedó desactualizada: buena parte del esquema de producción se
construyó directo en el SQL Editor del dashboard sin pasar por archivos
versionados, y terminó divergiendo de lo que había acá (tablas con otro
nombre, columnas distintas, tablas enteras — `organizations`, `payments`,
`organization_credits`, `memorial_entitlements` — que no existían en el repo).
Este set reemplaza esos archivos y sí reconstruye producción desde cero.

## Orden de ejecución

1. `0001_extensions_enums.sql` — extensiones (pgcrypto, unaccent), tipos ENUM, y el event trigger `rls_auto_enable` que activa RLS automáticamente en cualquier tabla nueva de `public`
2. `0002_core_tables.sql` — roles, organizations (funerarias), subscriptions, memorials, user_roles (RBAC), person_profile
3. `0003_content_tables.sql` — timeline_events, albums, media_assets, árbol genealógico (family_tree_nodes/family_relationships), guestbook_entries, reactions, qr_codes, candles, ai_jobs
4. `0004_commerce_tables.sql` — payments, organization_credits, memorial_entitlements, audit_logs
5. `0005_auth_functions.sql` — funciones de permisos (is_super_admin, has_memorial_role, has_organization_role, is_organization_member, memorial_is_public, can_manage_memorial_collaborators, cupos mensuales de organización)
6. `0006_business_functions.sql` — creación de memoriales (individual / por funeraria / en lote), colaboradores, alta y aprobación de funerarias, `confirm_payment` (usada por el webhook de Mercado Pago)
7. `0007_rls_policies.sql` — políticas RLS de las 20 tablas
8. `0008_storage.sql` — bucket `memorial-assets` (público, sin policies propias — ver notas dentro del archivo)

Aplícalas en ese orden, tal cual, en el **SQL Editor de Supabase** (Dashboard → SQL Editor → New query → pegar → Run), una migración a la vez. Si usas la CLI de Supabase (`supabase db push` / `supabase migration up`), renómbralas con el timestamp que genera `supabase migration new` y colócalas en `supabase/migrations/`.

## Notas importantes

- **La integración Vercel–Supabase vía GitHub no aplica estas migraciones retroactivamente** en un proyecto ya creado — deben correrse manualmente por SQL Editor o CLI la primera vez.
- No hay tabla `profiles`: el RBAC se resuelve directo contra `auth.users` vía `user_roles` + `roles` (ver `0002` y `0005`). No hay trigger de alta automática de perfil porque no hace falta.
- Las tablas `audit_logs` y las columnas internas de `payments`/`memorial_entitlements` están pensadas para que el **service_role** (usado en el webhook de Mercado Pago, nunca expuesto al cliente) o funciones `security definer` hagan la mayoría de las escrituras sensibles.
- `roles`, `subscriptions` y `family_relationships` tienen RLS activado pero **sin ninguna policy** — a propósito: nadie necesita leerlas/escribirlas directo desde el cliente. Las funciones `security definer` (dueñas de la tabla) igual pueden leerlas por dentro; cualquier acceso directo del cliente queda bloqueado por RLS por defecto.
- `person_profile.person_uuid` queda `null` hasta que exista la integración con Dorsera core. Cuando ese evento ocurra, se actualiza este campo — no se duplica la fila.
- Cuidado con los joins `!inner` de PostgREST sobre `guestbook_entries` o `media_assets` al pedir un memorial: si un memorial nuevo aún no tiene contenido, un `!inner` hará que la fila completa del memorial desaparezca del resultado (404 falso). Usa el join por defecto (left) en la query de la página pública del memorial.
- En producción existen además dos funciones "huérfanas" de una iteración anterior que el frontend ya no llama: `create_memorial_for_org` con 6 argumentos (sin los `family_contact_*`) y `request_organization` con 2 argumentos (sin `rut`/`contact_phone`). No se recrean en `0006` — conviene hacer `drop function` de esas firmas en el proyecto real para no confundir a futuro.
- Todas las tablas quedan con RLS activado por el event trigger de `0001`, no por `alter table ... enable row level security` explícito en cada `create table` — si agregas una tabla nueva fuera de estas migraciones, igual quedará protegida por defecto.

## Verificar que coincide con producción

Antes de asumir que este repo sigue reflejando la base real, compará contra el proyecto vivo (asumiendo acceso vía MCP de Supabase o el dashboard):

```sql
-- Tablas
select table_name from information_schema.tables where table_schema = 'public' order by 1;
-- Funciones
select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' order by 1;
-- Policies
select tablename, policyname from pg_policies where schemaname = 'public' order by 1, 2;
```

Si aparece algo acá que no está en estas migraciones (o viceversa), el repo volvió a desincronizarse — hay que regenerar de nuevo antes de confiar en él para reconstruir un ambiente nuevo.
