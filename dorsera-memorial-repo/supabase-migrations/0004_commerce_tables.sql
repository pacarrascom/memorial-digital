-- ============================================================================
-- Dorsera Memorial · Migración 0004
-- Comercial: pagos (Mercado Pago), créditos de organización, entitlements
-- desbloqueados por pago, y auditoría.
-- ============================================================================

create table public.payments (
  id                uuid primary key default gen_random_uuid(),
  type              text not null
                      check (type in (
                        'individual_fotos', 'individual_timeline', 'individual_bundle',
                        'org_subscription', 'org_extra_block'
                      )),
  user_id           uuid not null references auth.users(id),
  memorial_id       uuid references public.memorials(id),
  organization_id   uuid references public.organizations(id),
  amount_clp        integer not null,
  mp_preference_id  text,
  mp_payment_id     text,
  status            text not null default 'pendiente'
                      check (status in ('pendiente', 'aprobado', 'rechazado')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Bloques de memoriales extra comprados por una funeraria (25 memoriales
-- c/u — ver organization_monthly_quota en 0006).
create table public.organization_credits (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id),
  quantity         integer not null,
  purchased_at     timestamptz not null default now(),
  mp_payment_id    text
);

-- Desbloqueos por pago individual (fotos ilimitadas / timeline ilimitado).
create table public.memorial_entitlements (
  memorial_id         uuid primary key references public.memorials(id),
  photos_unlimited    boolean not null default false,
  timeline_unlimited  boolean not null default false,
  updated_at          timestamptz not null default now()
);

-- Auditoría de acciones sensibles (pagos confirmados, cambios de permisos, etc).
create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id),
  memorial_id uuid references public.memorials(id),
  action      text not null,
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index idx_audit_memorial on public.audit_logs (memorial_id);

alter table public.payments enable row level security;
alter table public.organization_credits enable row level security;
alter table public.memorial_entitlements enable row level security;
alter table public.audit_logs enable row level security;
