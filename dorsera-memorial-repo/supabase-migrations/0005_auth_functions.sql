-- ============================================================================
-- Dorsera Memorial · Migración 0005
-- Funciones de permisos (RBAC), usadas tanto por las policies de RLS (0007)
-- como por las Server Actions del frontend.
-- ============================================================================

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from user_roles ur
    join roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and r.name = 'super_admin'
  );
$$;

create or replace function public.has_memorial_role(p_memorial_id uuid, p_roles role_name[])
returns boolean
language sql
stable
security definer
set search_path = public
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

create or replace function public.is_organization_member(p_organization_id uuid, p_roles role_name[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from user_roles ur
    join roles r on r.id = ur.role_id
    where ur.organization_id = p_organization_id
      and ur.user_id = auth.uid()
      and r.name = any(p_roles)
  );
$$;

-- Igual que is_organization_member, pero resuelto a partir del memorial
-- (para políticas y Server Actions que solo tienen memorial_id a mano).
create or replace function public.has_organization_role(p_memorial_id uuid, p_roles role_name[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from memorials m
    join user_roles ur on ur.organization_id = m.organization_id
    join roles r on r.id = ur.role_id
    where m.id = p_memorial_id
      and m.organization_id is not null
      and ur.user_id = auth.uid()
      and r.name = any(p_roles)
  );
$$;

create or replace function public.memorial_is_public(p_memorial_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select visibility = 'publico' from memorials where id = p_memorial_id;
$$;

-- ¿El usuario autenticado puede administrar colaboradores de este memorial?
-- admin_familiar del memorial, funeraria dueña, o super_admin.
create or replace function public.can_manage_memorial_collaborators(p_memorial_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    is_super_admin()
    or has_memorial_role(p_memorial_id, array['admin_familiar']::role_name[])
    or exists (
      select 1
      from memorials m
      where m.id = p_memorial_id
        and m.organization_id is not null
        and is_organization_member(m.organization_id, array['funeraria']::role_name[])
    );
$$;

-- Cupo mensual de una funeraria: 25 memoriales base + bloques comprados
-- ese mismo mes (organization_credits, 0004).
create or replace function public.organization_monthly_quota(p_organization_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select 25 + coalesce((
    select sum(quantity)
    from organization_credits
    where organization_id = p_organization_id
      and date_trunc('month', purchased_at) = date_trunc('month', now())
  ), 0);
$$;

create or replace function public.organization_monthly_usage(p_organization_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from memorials
  where organization_id = p_organization_id
    and date_trunc('month', created_at) = date_trunc('month', now());
$$;
