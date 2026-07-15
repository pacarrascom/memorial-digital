-- ============================================================
-- Dorsera Memorial — Esquema inicial de base de datos
-- PostgreSQL / Supabase
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
create type role_name as enum (
  'super_admin',
  'funeraria',
  'admin_familiar',
  'colaborador_familiar',
  'visitante',
  'invitado_privado'
);

create type memorial_visibility as enum ('publico', 'privado', 'solo_invitados');
create type media_type as enum ('foto', 'video', 'audio', 'documento', 'carta');
create type moderation_status as enum ('pendiente', 'aprobado', 'rechazado');
create type reaction_type as enum ('vela', 'flor', 'corazon');
create type plan_name as enum ('gratuito', 'premium_familiar', 'premium_ilimitado');
create type ai_job_type as enum (
  'generar_biografia', 'organizar_fotos', 'reconocer_personas',
  'restaurar_foto', 'colorear_foto', 'generar_timeline', 'video_homenaje'
);
create type ai_job_status as enum ('en_cola', 'procesando', 'completado', 'fallido');

-- ------------------------------------------------------------
-- ORGANIZACIONES (empresas funerarias)
-- ------------------------------------------------------------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'funeraria',
  contact_email text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- SUBSCRIPCIONES / PLANES
-- ------------------------------------------------------------
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  plan plan_name not null default 'gratuito',
  limits jsonb not null default '{}'::jsonb, -- ej: {"max_fotos": 10, "max_storage_mb": 200}
  started_at timestamptz not null default now(),
  renewed_at timestamptz,
  is_active boolean not null default true
);

-- ------------------------------------------------------------
-- ROLES (catálogo)
-- ------------------------------------------------------------
create table roles (
  id uuid primary key default gen_random_uuid(),
  name role_name not null unique,
  permissions jsonb not null default '{}'::jsonb
);

insert into roles (name, permissions) values
  ('super_admin', '{"all": true}'),
  ('funeraria', '{"manage_org_memorials": true}'),
  ('admin_familiar', '{"manage_memorial": true}'),
  ('colaborador_familiar', '{"edit_content": true}'),
  ('visitante', '{"view_public": true, "participate_guestbook": true}'),
  ('invitado_privado', '{"view_private": true, "participate_guestbook": true}');

-- ------------------------------------------------------------
-- MEMORIALES
-- ------------------------------------------------------------
create table memorials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete set null,
  subscription_id uuid references subscriptions(id) on delete set null,
  slug text unique not null,
  visibility memorial_visibility not null default 'publico',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_memorials_org on memorials(organization_id);
create index idx_memorials_slug on memorials(slug);

-- ------------------------------------------------------------
-- ROLES DE USUARIO (RBAC — tabla central de permisos)
-- ------------------------------------------------------------
create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references roles(id),
  memorial_id uuid references memorials(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, role_id, memorial_id, organization_id)
);

create index idx_user_roles_user on user_roles(user_id);
create index idx_user_roles_memorial on user_roles(memorial_id);

-- ------------------------------------------------------------
-- PERFIL DE LA PERSONA (datos biográficos)
-- ------------------------------------------------------------
create table person_profile (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null unique references memorials(id) on delete cascade,
  person_uuid uuid, -- vínculo opcional con Dorsera (árbol en vida)
  full_name text not null,
  birth_date date,
  death_date date,
  birth_place text,
  death_place text,
  biography text,
  life_story text,
  studies text,
  profession text,
  values text[],
  hobbies text[],
  favorite_quotes jsonb default '[]'::jsonb,
  favorite_verses jsonb default '[]'::jsonb,
  favorite_songs jsonb default '[]'::jsonb,
  achievements jsonb default '[]'::jsonb,
  awards jsonb default '[]'::jsonb,
  legacy_statement text,
  updated_at timestamptz not null default now()
);

create index idx_person_profile_person_uuid on person_profile(person_uuid);

-- ------------------------------------------------------------
-- LÍNEA DE TIEMPO
-- ------------------------------------------------------------
create table timeline_events (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references memorials(id) on delete cascade,
  event_date date,
  title text not null,
  description text,
  location jsonb, -- {"lat":..,"lng":..,"label":".."}
  sort_order integer default 0,
  created_at timestamptz not null default now()
);

create index idx_timeline_memorial on timeline_events(memorial_id);

-- ------------------------------------------------------------
-- ÁLBUMES Y MEDIOS
-- ------------------------------------------------------------
create table albums (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references memorials(id) on delete cascade,
  category text not null default 'general',
  title text,
  created_at timestamptz not null default now()
);

create table media_assets (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references memorials(id) on delete cascade,
  album_id uuid references albums(id) on delete set null,
  timeline_event_id uuid references timeline_events(id) on delete set null,
  type media_type not null,
  storage_path text not null,
  caption text,
  uploaded_by uuid references auth.users(id),
  uploaded_at timestamptz not null default now()
);

create index idx_media_memorial on media_assets(memorial_id);
create index idx_media_album on media_assets(album_id);

-- ------------------------------------------------------------
-- ÁRBOL GENEALÓGICO
-- ------------------------------------------------------------
create table family_tree_nodes (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid references memorials(id) on delete set null, -- null si aún no tiene memorial propio
  person_uuid uuid, -- vínculo con Dorsera
  full_name text not null,
  birth_date date,
  death_date date,
  created_at timestamptz not null default now()
);

create table family_relationships (
  id uuid primary key default gen_random_uuid(),
  node_from_id uuid not null references family_tree_nodes(id) on delete cascade,
  node_to_id uuid not null references family_tree_nodes(id) on delete cascade,
  relationship_type text not null, -- 'padre', 'madre', 'hijo', 'conyuge', 'hermano', etc.
  created_at timestamptz not null default now(),
  check (node_from_id <> node_to_id)
);

create index idx_family_rel_from on family_relationships(node_from_id);
create index idx_family_rel_to on family_relationships(node_to_id);

-- ------------------------------------------------------------
-- LIBRO DE RECUERDOS
-- ------------------------------------------------------------
create table guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references memorials(id) on delete cascade,
  author_user_id uuid references auth.users(id),
  author_display_name text, -- para visitantes anónimos
  entry_type text not null default 'mensaje', -- mensaje / oracion / anecdota
  content text not null,
  moderation_status moderation_status not null default 'pendiente',
  moderated_by uuid references auth.users(id),
  moderated_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_guestbook_memorial on guestbook_entries(memorial_id);
create index idx_guestbook_status on guestbook_entries(moderation_status);

create table reactions (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references memorials(id) on delete cascade,
  guestbook_entry_id uuid references guestbook_entries(id) on delete cascade,
  user_id uuid references auth.users(id),
  type reaction_type not null,
  created_at timestamptz not null default now()
);

create index idx_reactions_memorial on reactions(memorial_id);

-- ------------------------------------------------------------
-- CÓDIGOS QR
-- ------------------------------------------------------------
create table qr_codes (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null unique references memorials(id) on delete cascade,
  public_url text not null,
  short_code text unique not null,
  png_path text,
  svg_path text,
  pdf_path text,
  generated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TRABAJOS DE IA
-- ------------------------------------------------------------
create table ai_jobs (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references memorials(id) on delete cascade,
  job_type ai_job_type not null,
  status ai_job_status not null default 'en_cola',
  input jsonb default '{}'::jsonb,
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index idx_ai_jobs_memorial on ai_jobs(memorial_id);
create index idx_ai_jobs_status on ai_jobs(status);

-- ------------------------------------------------------------
-- AUDITORÍA
-- ------------------------------------------------------------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  memorial_id uuid references memorials(id),
  action text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_memorial on audit_logs(memorial_id);

-- ============================================================
-- FUNCIONES AUXILIARES PARA RLS
-- ============================================================

-- ¿El usuario actual tiene alguno de los roles dados sobre este memorial?
create or replace function has_memorial_role(p_memorial_id uuid, p_roles role_name[])
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from user_roles ur
    join roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and ur.memorial_id = p_memorial_id
      and r.name = any(p_roles)
  );
$$;

-- ¿El usuario actual es super_admin?
create or replace function is_super_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from user_roles ur
    join roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and r.name = 'super_admin'
  );
$$;

-- ¿El memorial es visible públicamente?
create or replace function memorial_is_public(p_memorial_id uuid)
returns boolean
language sql
stable
as $$
  select visibility = 'publico' from memorials where id = p_memorial_id;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table memorials enable row level security;
alter table person_profile enable row level security;
alter table timeline_events enable row level security;
alter table media_assets enable row level security;
alter table albums enable row level security;
alter table guestbook_entries enable row level security;
alter table reactions enable row level security;
alter table qr_codes enable row level security;
alter table user_roles enable row level security;
alter table family_tree_nodes enable row level security;
alter table ai_jobs enable row level security;
alter table audit_logs enable row level security;

-- MEMORIALS: lectura pública si es público; gestión solo admin/colaborador/super_admin
create policy memorials_select on memorials for select
  using (
    visibility = 'publico'
    or is_super_admin()
    or has_memorial_role(id, array['admin_familiar','colaborador_familiar','invitado_privado']::role_name[])
  );

create policy memorials_insert on memorials for insert
  with check (auth.uid() is not null);

create policy memorials_update on memorials for update
  using (is_super_admin() or has_memorial_role(id, array['admin_familiar']::role_name[]));

create policy memorials_delete on memorials for delete
  using (is_super_admin() or has_memorial_role(id, array['admin_familiar']::role_name[]));

-- PERSON_PROFILE / TIMELINE / MEDIA / ALBUMS: heredan visibilidad del memorial
create policy person_profile_select on person_profile for select
  using (memorial_is_public(memorial_id) or is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar','invitado_privado']::role_name[]));

create policy person_profile_write on person_profile for all
  using (is_super_admin() or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[]))
  with check (is_super_admin() or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[]));

create policy timeline_select on timeline_events for select
  using (memorial_is_public(memorial_id) or is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar','invitado_privado']::role_name[]));

create policy timeline_write on timeline_events for all
  using (is_super_admin() or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[]))
  with check (is_super_admin() or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[]));

create policy media_select on media_assets for select
  using (memorial_is_public(memorial_id) or is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar','invitado_privado']::role_name[]));

create policy media_write on media_assets for all
  using (is_super_admin() or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[]))
  with check (is_super_admin() or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[]));

create policy albums_all on albums for all
  using (is_super_admin() or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[]))
  with check (is_super_admin() or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[]));

-- GUESTBOOK: cualquiera autenticado puede insertar (queda pendiente); solo aprobado es visible públicamente
create policy guestbook_select on guestbook_entries for select
  using (
    moderation_status = 'aprobado'
    or is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[])
    or author_user_id = auth.uid()
  );

create policy guestbook_insert on guestbook_entries for insert
  with check (memorial_is_public(memorial_id) or has_memorial_role(memorial_id, array['invitado_privado','admin_familiar','colaborador_familiar']::role_name[]));

create policy guestbook_moderate on guestbook_entries for update
  using (is_super_admin() or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[]));

create policy reactions_select on reactions for select using (true);
create policy reactions_insert on reactions for insert with check (auth.uid() is not null or memorial_is_public(memorial_id));

-- QR_CODES: visible si el memorial es visible; solo admin_familiar puede regenerar
create policy qr_select on qr_codes for select
  using (memorial_is_public(memorial_id) or is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[]));

create policy qr_write on qr_codes for all
  using (is_super_admin() or has_memorial_role(memorial_id, array['admin_familiar']::role_name[]))
  with check (is_super_admin() or has_memorial_role(memorial_id, array['admin_familiar']::role_name[]));

-- USER_ROLES: cada usuario ve sus propios roles; admin_familiar ve los de su memorial
create policy user_roles_select on user_roles for select
  using (user_id = auth.uid() or is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar']::role_name[]));

create policy user_roles_write on user_roles for all
  using (is_super_admin() or has_memorial_role(memorial_id, array['admin_familiar']::role_name[]))
  with check (is_super_admin() or has_memorial_role(memorial_id, array['admin_familiar']::role_name[]));

-- FAMILY_TREE_NODES: visibilidad ligada al memorial si existe, si no autenticado
create policy family_tree_select on family_tree_nodes for select
  using (memorial_id is null or memorial_is_public(memorial_id) or is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[]));

create policy family_tree_write on family_tree_nodes for all
  using (is_super_admin() or (memorial_id is not null and has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[])))
  with check (is_super_admin() or (memorial_id is not null and has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[])));

-- AI_JOBS y AUDIT_LOGS: solo administración del memorial / super admin
create policy ai_jobs_all on ai_jobs for all
  using (is_super_admin() or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[]))
  with check (is_super_admin() or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[]));

create policy audit_logs_select on audit_logs for select
  using (is_super_admin() or (memorial_id is not null and has_memorial_role(memorial_id, array['admin_familiar']::role_name[])));

create policy audit_logs_insert on audit_logs for insert
  with check (auth.uid() is not null);
