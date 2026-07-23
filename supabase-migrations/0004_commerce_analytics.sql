-- ============================================================================
-- Dorsera Memorial · Migración 0004
-- Comercial: suscripciones, analítica, auditoría
-- ============================================================================

create table public.subscriptions (
  id                uuid primary key default gen_random_uuid(),
  family_group_id   uuid references public.family_groups(id) on delete cascade,
  funeral_home_id    uuid references public.funeral_homes(id) on delete cascade,
  plan              subscription_plan not null default 'free',
  status            subscription_status not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (
    (family_group_id is not null and funeral_home_id is null) or
    (family_group_id is null and funeral_home_id is not null)
  )
);

-- Visitas, escaneos QR, tiempo en página, país de origen, etc.
create table public.analytics_events (
  id            uuid primary key default gen_random_uuid(),
  memorial_id   uuid not null references public.memorials(id) on delete cascade,
  event_type    text not null,                 -- 'page_view' | 'qr_scan' | 'tribute_added' | ...
  country_code  text,
  session_id    text,
  duration_seconds integer,
  metadata      jsonb,
  created_at    timestamptz not null default now()
);

create index idx_analytics_memorial on public.analytics_events (memorial_id, event_type, created_at);

-- Auditoría de cambios sensibles (permisos, eliminaciones, cambios de plan)
create table public.audit_logs (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references public.profiles(id),
  action        text not null,                 -- 'memorial.deleted' | 'role.changed' | ...
  entity_type   text not null,
  entity_id     uuid not null,
  before        jsonb,
  after         jsonb,
  created_at    timestamptz not null default now()
);

create index idx_audit_logs_entity on public.audit_logs (entity_type, entity_id);
