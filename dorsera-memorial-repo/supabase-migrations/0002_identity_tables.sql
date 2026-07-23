-- ============================================================================
-- Dorsera Memorial · Migración 0002
-- Identidad: profiles, persons, family_groups, membresías, funerarias
-- ============================================================================

-- Extiende auth.users de Supabase con datos de perfil de la aplicación
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  avatar_url    text,
  global_role   app_global_role not null default 'user',
  locale        text not null default 'es',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Persona real (viva o fallecida). Comparte UUID con Dorsera core.
-- Esta tabla es la "fuente de verdad" que evita duplicidad entre Dorsera y Dorsera Memorial.
create table public.persons (
  id                 uuid primary key default gen_random_uuid(),
  dorsera_person_id  uuid unique,             -- referencia al UUID en Dorsera core (nullable hasta integrar)
  full_name          text not null,
  birth_date         date,
  death_date         date,
  birth_place        text,
  death_place        text,
  gender             text,
  created_by         uuid references public.profiles(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on column public.persons.dorsera_person_id is
  'UUID compartido con la tabla persons de Dorsera core. Null hasta que se establezca la integración.';

-- Unidad administrativa: una familia gestionando uno o más memoriales
create table public.family_groups (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  created_by    uuid not null references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Membresía de un usuario en un family_group con un rol específico
create table public.family_group_members (
  id               uuid primary key default gen_random_uuid(),
  family_group_id  uuid not null references public.family_groups(id) on delete cascade,
  profile_id       uuid not null references public.profiles(id) on delete cascade,
  role             family_role not null default 'family_collaborator',
  invited_by       uuid references public.profiles(id),
  created_at       timestamptz not null default now(),
  unique (family_group_id, profile_id)
);

-- Empresa funeraria (tenant comercial B2B2C)
create table public.funeral_homes (
  id            uuid primary key default gen_random_uuid(),
  legal_name    text not null,
  display_name  text not null,
  tax_id        text,
  contact_email citext,
  contact_phone text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Staff de la funeraria (personal con acceso al panel B2B)
create table public.funeral_home_staff (
  id               uuid primary key default gen_random_uuid(),
  funeral_home_id  uuid not null references public.funeral_homes(id) on delete cascade,
  profile_id       uuid not null references public.profiles(id) on delete cascade,
  created_at       timestamptz not null default now(),
  unique (funeral_home_id, profile_id)
);

-- Relación funeraria ↔ familia cliente (la funeraria origina el memorial,
-- luego transfiere administración plena a la familia)
create table public.funeral_home_clients (
  id               uuid primary key default gen_random_uuid(),
  funeral_home_id  uuid not null references public.funeral_homes(id) on delete cascade,
  family_group_id  uuid not null references public.family_groups(id) on delete cascade,
  created_at       timestamptz not null default now(),
  unique (funeral_home_id, family_group_id)
);

create index idx_persons_dorsera_person_id on public.persons (dorsera_person_id);
create index idx_family_group_members_profile on public.family_group_members (profile_id);
create index idx_funeral_home_staff_profile on public.funeral_home_staff (profile_id);
