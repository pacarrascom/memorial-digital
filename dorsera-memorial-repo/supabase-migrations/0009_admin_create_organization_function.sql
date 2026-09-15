-- ============================================================================
-- Dorsera Memorial · Migración 0009
-- Función admin_create_organization — ya aplicada en producción vía SQL Editor.
-- Este archivo solo la deja versionada en el repo.
--
-- Reemplaza el flujo de "solicitar cuenta institucional" post-registro: ahora
-- solo el super_admin puede activar una cuenta de funeraria para un usuario ya
-- registrado, buscándolo por correo. El toggle Funeraria en /register (que crea
-- la solicitud automática vía request_organization) sigue siendo el único punto
-- de entrada donde el propio usuario puede pedirlo al momento de registrarse.
-- ============================================================================

create or replace function public.admin_create_organization(
  p_user_email text,
  p_name text,
  p_rut text default null,
  p_contact_email text default null,
  p_contact_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_org_id uuid;
begin
  if not is_super_admin() then
    raise exception 'Solo un administrador puede crear cuentas de funeraria';
  end if;

  if p_name is null or trim(p_name) = '' then
    raise exception 'El nombre de la funeraria es obligatorio';
  end if;

  select id into v_user_id from auth.users where email = p_user_email;
  if v_user_id is null then
    raise exception 'No existe un usuario registrado con ese correo';
  end if;

  insert into organizations (name, type, contact_email, rut, contact_phone, status, requested_by)
  values (trim(p_name), 'funeraria', p_contact_email, p_rut, p_contact_phone, 'aprobada', v_user_id)
  returning id into v_org_id;

  insert into user_roles (user_id, role_id, organization_id)
  select v_user_id, r.id, v_org_id
  from roles r
  where r.name = 'funeraria'
  on conflict do nothing;

  return v_org_id;
end;
$$;
