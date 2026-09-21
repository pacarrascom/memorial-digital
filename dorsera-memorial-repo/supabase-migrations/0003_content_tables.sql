-- ============================================================================
-- Dorsera Memorial · Migración 0003
-- Contenido del memorial: timeline, álbumes/medios, árbol genealógico,
-- libro de recuerdos (guestbook), reacciones, QR, velas, trabajos de IA.
-- ============================================================================

create table public.timeline_events (
  id          uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references public.memorials(id),
  event_date  date,
  title       text not null,
  description text,
  location    jsonb,
  sort_order  integer default 0,
  created_at  timestamptz not null default now()
);

create index idx_timeline_memorial on public.timeline_events (memorial_id);

create table public.albums (
  id          uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references public.memorials(id),
  category    text not null default 'general',
  title       text,
  created_at  timestamptz not null default now()
);

create table public.media_assets (
  id                uuid primary key default gen_random_uuid(),
  memorial_id       uuid not null references public.memorials(id),
  album_id          uuid references public.albums(id),
  timeline_event_id uuid references public.timeline_events(id),
  type              media_type not null,
  storage_path      text not null,
  caption           text,
  uploaded_by       uuid references auth.users(id),
  uploaded_at       timestamptz not null default now(),
  is_cover          boolean not null default false
);

create index idx_media_memorial on public.media_assets (memorial_id);
create index idx_media_album on public.media_assets (album_id);

create table public.family_tree_nodes (
  id          uuid primary key default gen_random_uuid(),
  memorial_id uuid references public.memorials(id),
  person_uuid uuid,
  full_name   text not null,
  birth_date  date,
  death_date  date,
  created_at  timestamptz not null default now()
);

create table public.family_relationships (
  id                uuid primary key default gen_random_uuid(),
  node_from_id      uuid not null references public.family_tree_nodes(id),
  node_to_id        uuid not null references public.family_tree_nodes(id),
  relationship_type text not null,
  created_at        timestamptz not null default now()
);

create index idx_family_rel_from on public.family_relationships (node_from_id);
create index idx_family_rel_to on public.family_relationships (node_to_id);

-- Libro de recuerdos: mensajes, oraciones, etc. dejados por visitantes.
-- Las "velas" y "flores" viven aparte en reactions.
create table public.guestbook_entries (
  id                  uuid primary key default gen_random_uuid(),
  memorial_id         uuid not null references public.memorials(id),
  author_user_id      uuid references auth.users(id),
  author_display_name text,
  entry_type          text not null default 'mensaje',
  content             text not null,
  moderation_status   moderation_status not null default 'pendiente',
  moderated_by        uuid references auth.users(id),
  moderated_at        timestamptz,
  created_at          timestamptz not null default now()
);

create index idx_guestbook_memorial on public.guestbook_entries (memorial_id);
create index idx_guestbook_status on public.guestbook_entries (moderation_status);

create table public.reactions (
  id                  uuid primary key default gen_random_uuid(),
  memorial_id         uuid not null references public.memorials(id),
  guestbook_entry_id  uuid references public.guestbook_entries(id),
  user_id             uuid references auth.users(id),
  type                reaction_type not null,
  created_at          timestamptz not null default now()
);

create index idx_reactions_memorial on public.reactions (memorial_id);

create table public.qr_codes (
  id            uuid primary key default gen_random_uuid(),
  memorial_id   uuid not null unique references public.memorials(id),
  public_url    text not null,
  short_code    text not null unique,
  png_path      text,
  svg_path      text,
  pdf_path      text,
  generated_at  timestamptz not null default now()
);

create table public.candles (
  id            uuid primary key default gen_random_uuid(),
  memorial_id   uuid not null references public.memorials(id),
  lit_by_name   text,
  created_at    timestamptz not null default now()
);

create table public.ai_jobs (
  id            uuid primary key default gen_random_uuid(),
  memorial_id   uuid not null references public.memorials(id),
  job_type      ai_job_type not null,
  status        ai_job_status not null default 'en_cola',
  input         jsonb default '{}'::jsonb,
  result        jsonb,
  error         text,
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create index idx_ai_jobs_memorial on public.ai_jobs (memorial_id);
create index idx_ai_jobs_status on public.ai_jobs (status);

alter table public.timeline_events enable row level security;
alter table public.albums enable row level security;
alter table public.media_assets enable row level security;
alter table public.family_tree_nodes enable row level security;
alter table public.family_relationships enable row level security;
alter table public.guestbook_entries enable row level security;
alter table public.reactions enable row level security;
alter table public.qr_codes enable row level security;
alter table public.candles enable row level security;
alter table public.ai_jobs enable row level security;
