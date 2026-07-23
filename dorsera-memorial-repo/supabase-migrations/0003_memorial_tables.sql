-- ============================================================================
-- Dorsera Memorial · Migración 0003
-- Memorial: QR, medios, línea de tiempo, árbol genealógico, tributos
-- ============================================================================

-- El memorial digital
create table public.memorials (
  id               uuid primary key default gen_random_uuid(),
  person_id        uuid not null references public.persons(id),
  family_group_id  uuid not null references public.family_groups(id) on delete cascade,
  slug             text unique not null,          -- para URL amigable /m/juan-perez-a1b2
  visibility       memorial_visibility not null default 'public',
  headline         text,                          -- frase corta bajo el nombre
  biography        text,                          -- historia de vida (rich text / markdown)
  values           text[],                         -- valores
  favorite_quotes  text[],
  favorite_verses  text[],
  favorite_songs   jsonb,                         -- [{title, artist, url}]
  achievements     jsonb,                         -- [{title, description, year}]
  cover_photo_url  text,
  is_published     boolean not null default false,
  created_by       uuid not null references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_memorials_family_group on public.memorials (family_group_id);
create index idx_memorials_person on public.memorials (person_id);
create unique index idx_memorials_slug on public.memorials (slug);

-- Código QR único por memorial
create table public.qr_codes (
  id            uuid primary key default gen_random_uuid(),
  memorial_id   uuid not null unique references public.memorials(id) on delete cascade,
  short_code    text unique not null,              -- ej. "dm/x7K9q"
  png_url       text,
  svg_url       text,
  pdf_url       text,
  scan_count    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- Álbumes para organizar galería
create table public.albums (
  id            uuid primary key default gen_random_uuid(),
  memorial_id   uuid not null references public.memorials(id) on delete cascade,
  title         text not null,
  description   text,
  sort_order    integer not null default 0,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);

-- Fotos, videos, audios, cartas, documentos
create table public.media_items (
  id                uuid primary key default gen_random_uuid(),
  memorial_id       uuid not null references public.memorials(id) on delete cascade,
  album_id          uuid references public.albums(id) on delete set null,
  type              media_type not null,
  storage_path      text not null,                 -- ruta en Supabase Storage
  thumbnail_path    text,
  caption           text,
  alt_text          text not null,                 -- accesibilidad: obligatorio
  taken_at          date,
  ai_restored       boolean not null default false,
  ai_colorized      boolean not null default false,
  uploaded_by       uuid references public.profiles(id),
  created_at        timestamptz not null default now()
);

create index idx_media_items_memorial on public.media_items (memorial_id);
create index idx_media_items_album on public.media_items (album_id);

-- Eventos de la línea de tiempo
create table public.timeline_events (
  id            uuid primary key default gen_random_uuid(),
  memorial_id   uuid not null references public.memorials(id) on delete cascade,
  event_date    date not null,
  title         text not null,
  description   text,
  location      text,
  cover_media_id uuid references public.media_items(id) on delete set null,
  sort_order    integer not null default 0,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);

create index idx_timeline_events_memorial on public.timeline_events (memorial_id, event_date);

-- Personas relacionadas a un evento de timeline (N:N)
create table public.timeline_event_persons (
  timeline_event_id  uuid not null references public.timeline_events(id) on delete cascade,
  person_id          uuid not null references public.persons(id) on delete cascade,
  primary key (timeline_event_id, person_id)
);

-- Relaciones del árbol genealógico (grafo dirigido persona -> persona)
create table public.family_tree_relationships (
  id              uuid primary key default gen_random_uuid(),
  person_id       uuid not null references public.persons(id) on delete cascade,
  related_person_id uuid not null references public.persons(id) on delete cascade,
  kinship         kinship_type not null,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  check (person_id <> related_person_id),
  unique (person_id, related_person_id, kinship)
);

create index idx_family_tree_person on public.family_tree_relationships (person_id);
create index idx_family_tree_related on public.family_tree_relationships (related_person_id);

-- Libro de recuerdos: mensajes, velas, flores, oraciones, reacciones
create table public.tributes (
  id            uuid primary key default gen_random_uuid(),
  memorial_id   uuid not null references public.memorials(id) on delete cascade,
  author_id     uuid references public.profiles(id),   -- null si es anónimo/invitado
  author_name   text,                                    -- para invitados sin cuenta
  type          tribute_type not null,
  content       text,                                    -- mensaje/anécdota/oración
  photo_url     text,                                     -- foto adjunta opcional
  status        tribute_status not null default 'pending',
  moderated_by  uuid references public.profiles(id),
  moderated_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index idx_tributes_memorial on public.tributes (memorial_id, status);

-- Invitaciones de acceso privado (para memoriales 'private' o eventos unlisted)
create table public.memorial_invites (
  id            uuid primary key default gen_random_uuid(),
  memorial_id   uuid not null references public.memorials(id) on delete cascade,
  token         text unique not null,
  invited_email citext,
  created_by    uuid not null references public.profiles(id),
  expires_at    timestamptz,
  created_at    timestamptz not null default now()
);
