-- ============================================================================
-- Dorsera Memorial · Migración 0001
-- Extensiones y tipos ENUM
-- ============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "citext";     -- emails case-insensitive

-- Rol global de la cuenta (no confundir con el rol dentro de un family_group)
create type app_global_role as enum (
  'super_admin',
  'funeral_home_staff',
  'user'
);

-- Rol dentro de un family_group (memorial administrado por una familia)
create type family_role as enum (
  'family_admin',
  'family_collaborator'
);

-- Estado de moderación del libro de recuerdos
create type tribute_status as enum (
  'pending',
  'approved',
  'rejected'
);

-- Tipo de tributo
create type tribute_type as enum (
  'message',
  'candle',
  'flower',
  'prayer',
  'reaction'
);

-- Tipo de medio
create type media_type as enum (
  'photo',
  'video',
  'audio',
  'letter',
  'document'
);

-- Visibilidad del memorial
create type memorial_visibility as enum (
  'public',
  'private',
  'unlisted'   -- accesible solo con el link/QR, no indexable
);

-- Relación de parentesco para el árbol genealógico
create type kinship_type as enum (
  'parent',
  'child',
  'spouse',
  'sibling'
);

-- Plan de suscripción
create type subscription_plan as enum (
  'free',
  'premium_family',
  'premium_unlimited'
);

create type subscription_status as enum (
  'active',
  'trialing',
  'past_due',
  'canceled'
);
