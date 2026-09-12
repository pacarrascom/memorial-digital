-- ============================================================================
-- Dorsera Memorial · Migración 0008
-- Función is_organization_member — ya aplicada en producción vía SQL Editor.
-- Este archivo solo la deja versionada en el repo (no ejecutar de nuevo salvo
-- que se esté reconstruyendo la base desde cero).
--
-- Depende de tablas user_roles y roles (esquema RBAC genérico), que no están
-- en supabase-migrations/ — distinto del modelo family_group_members /
-- funeral_home_staff que sí está en 0002. Revisar antes de aplicar en un
-- entorno nuevo.
-- ============================================================================

create or replace function public.is_organization_member(p_organization_id uuid, p_roles role_name[])
returns boolean
language sql
stable security definer
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
