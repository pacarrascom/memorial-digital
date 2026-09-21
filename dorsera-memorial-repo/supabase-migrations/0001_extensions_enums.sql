-- ============================================================================
-- Dorsera Memorial · Migración 0001
-- Extensiones y tipos ENUM
-- Regenerado desde el esquema real de producción (proyecto Supabase
-- "Memorial Digital", 2026-09-21) — ver supabase-migrations/README.md.
-- ============================================================================

create extension if not exists pgcrypto with schema public;
create extension if not exists unaccent with schema public;

create type public.role_name as enum (
  'super_admin',
  'funeraria',
  'admin_familiar',
  'colaborador_familiar',
  'visitante',
  'invitado_privado'
);

create type public.memorial_visibility as enum (
  'publico',
  'privado',
  'solo_invitados'
);

create type public.media_type as enum (
  'foto',
  'video',
  'audio',
  'documento',
  'carta'
);

create type public.moderation_status as enum (
  'pendiente',
  'aprobado',
  'rechazado'
);

create type public.reaction_type as enum (
  'vela',
  'flor',
  'corazon'
);

create type public.ai_job_type as enum (
  'generar_biografia',
  'organizar_fotos',
  'reconocer_personas',
  'restaurar_foto',
  'colorear_foto',
  'generar_timeline',
  'video_homenaje'
);

create type public.ai_job_status as enum (
  'en_cola',
  'procesando',
  'completado',
  'fallido'
);

create type public.plan_name as enum (
  'gratuito',
  'premium_familiar',
  'premium_ilimitado'
);

-- Nota: en el proyecto real, RLS queda activado en toda tabla nueva de
-- `public` automáticamente por el event trigger `ensure_rls` que Supabase
-- instala por defecto en todo proyecto (no es algo que este repo defina).
-- Para que estas migraciones reconstruyan el esquema en cualquier Postgres
-- (no solo en Supabase), cada `create table` de 0002-0004 activa RLS
-- explícitamente con su propio `alter table ... enable row level security`.
