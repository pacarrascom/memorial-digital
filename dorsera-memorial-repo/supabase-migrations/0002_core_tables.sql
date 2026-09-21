-- ============================================================================
-- Dorsera Memorial · Migración 0002
-- Tablas núcleo: roles, organizaciones, suscripciones, memoriales, RBAC,
-- perfil de la persona homenajeada.
-- ============================================================================

create table public.roles (
  id          uuid primary key default gen_random_uuid(),
  name        role_name not null unique,
  permissions jsonb not null default '{}'::jsonb
);

-- Empresa funeraria (tenant comercial B2B). "type" queda como text abierto
-- por si en el futuro se suman otros tipos de organización.
create table public.organizations (
  id                         uuid primary key default gen_random_uuid(),
  name                       text not null,
  type                       text not null default 'funeraria',
  status                     text not null default 'aprobada'
                               check (status in ('pendiente', 'aprobada', 'rechazada')),
  contact_email              text,
  contact_phone              text,
  rut                        text,
  requested_by               uuid references auth.users(id),
  requested_at               timestamptz not null default now(),
  subscription_active_until  timestamptz,
  created_at                 timestamptz not null default now()
);

create table public.subscriptions (
  id          uuid primary key default gen_random_uuid(),
  plan        plan_name not null default 'gratuito',
  limits      jsonb not null default '{}'::jsonb,
  started_at  timestamptz not null default now(),
  renewed_at  timestamptz,
  is_active   boolean not null default true
);

create table public.memorials (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid references public.organizations(id),
  subscription_id       uuid references public.subscriptions(id),
  slug                  text not null unique,
  visibility            memorial_visibility not null default 'publico',
  created_by            uuid references auth.users(id),
  family_contact_name   text,
  family_contact_email  text,
  family_contact_phone  text,
  collaborator_limit    integer not null default 1,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_memorials_org on public.memorials (organization_id);
create index idx_memorials_slug on public.memorials (slug);

-- Límite de colaboradores por defecto: 1 para memoriales individuales,
-- 2 para memoriales creados por una funeraria. Un super_admin puede
-- subirlo puntualmente vía set_memorial_collaborator_limit (0006).
create or replace function public.set_memorial_collaborator_limit_default()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.collaborator_limit := case when new.organization_id is null then 1 else 2 end;
  return new;
end;
$$;

create trigger trg_memorials_collaborator_limit
  before insert on public.memorials
  for each row execute function public.set_memorial_collaborator_limit_default();

-- RBAC: une un usuario de auth.users con un rol, acotado a un memorial y/o
-- una organización según corresponda (ambos null = alcance global, usado
-- por super_admin).
create table public.user_roles (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id),
  role_id          uuid not null references public.roles(id),
  memorial_id      uuid references public.memorials(id),
  organization_id  uuid references public.organizations(id),
  created_at       timestamptz not null default now(),
  unique (user_id, role_id, memorial_id, organization_id)
);

create index idx_user_roles_user on public.user_roles (user_id);
create index idx_user_roles_memorial on public.user_roles (memorial_id);

-- Datos de la persona homenajeada. 1:1 con memorials. person_uuid queda
-- null hasta que exista la integración con Dorsera core (no se duplica
-- la fila cuando ese evento ocurra).
create table public.person_profile (
  id               uuid primary key default gen_random_uuid(),
  memorial_id      uuid not null unique references public.memorials(id),
  person_uuid      uuid,
  full_name        text not null,
  birth_date       date,
  death_date       date,
  birth_place      text,
  death_place      text,
  biography        text,
  life_story       text,
  studies          text,
  profession       text,
  values           text[],
  hobbies          text[],
  favorite_quotes  jsonb default '[]'::jsonb,
  favorite_verses  jsonb default '[]'::jsonb,
  favorite_songs   jsonb default '[]'::jsonb,
  achievements     jsonb default '[]'::jsonb,
  awards           jsonb default '[]'::jsonb,
  legacy_statement text,
  updated_at       timestamptz not null default now()
);

create index idx_person_profile_person_uuid on public.person_profile (person_uuid);

alter table public.roles enable row level security;
alter table public.organizations enable row level security;
alter table public.subscriptions enable row level security;
alter table public.memorials enable row level security;
alter table public.user_roles enable row level security;
alter table public.person_profile enable row level security;
