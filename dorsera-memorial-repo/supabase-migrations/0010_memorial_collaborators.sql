-- ============================================================================
-- Dorsera Memorial · Migración 0010
-- Colaboradores por memorial — ya aplicada en producción vía SQL Editor.
-- Este archivo solo la deja versionada en el repo.
--
-- Límite de colaboradores (rol colaborador_familiar, sin contar al
-- admin_familiar dueño): 1 para memoriales individuales, 2 para memoriales
-- de una organización (funeraria). El límite queda en memorials.collaborator_limit
-- y un super_admin puede subirlo por memorial vía set_memorial_collaborator_limit
-- (por ejemplo, según el plan contratado por la funeraria).
-- ============================================================================

alter table public.memorials add column if not exists collaborator_limit integer not null default 1;

create or replace function public.set_memorial_collaborator_limit_default()
returns trigger
language plpgsql
as $$
begin
  new.collaborator_limit := case when new.organization_id is null then 1 else 2 end;
  return new;
end;
$$;

drop trigger if exists trg_memorials_collaborator_limit on public.memorials;
create trigger trg_memorials_collaborator_limit
  before insert on public.memorials
  for each row execute function public.set_memorial_collaborator_limit_default();

-- ¿El usuario autenticado puede administrar colaboradores de este memorial?
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

create or replace function public.list_memorial_collaborators(p_memorial_id uuid)
returns table(user_id uuid, email text, role_name text, granted_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not can_manage_memorial_collaborators(p_memorial_id) then
    raise exception 'No tienes permiso para ver los colaboradores de este memorial';
  end if;

  return query
    select u.id, u.email::text, r.name::text, ur.created_at
    from user_roles ur
    join roles r on r.id = ur.role_id
    join auth.users u on u.id = ur.user_id
    where ur.memorial_id = p_memorial_id
      and r.name in ('admin_familiar', 'colaborador_familiar')
    order by (r.name = 'admin_familiar') desc, ur.created_at asc;
end;
$$;

create or replace function public.invite_collaborator(p_memorial_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_limit int;
  v_count int;
  v_already boolean;
begin
  if not can_manage_memorial_collaborators(p_memorial_id) then
    raise exception 'No tienes permiso para invitar colaboradores a este memorial';
  end if;

  select id into v_user_id from auth.users where email = p_email;
  if v_user_id is null then
    raise exception 'No existe un usuario registrado con ese correo';
  end if;

  select exists (
    select 1 from user_roles ur
    join roles r on r.id = ur.role_id
    where ur.memorial_id = p_memorial_id
      and ur.user_id = v_user_id
      and r.name in ('admin_familiar', 'colaborador_familiar')
  ) into v_already;
  if v_already then
    raise exception 'Ese usuario ya tiene acceso a este memorial';
  end if;

  select collaborator_limit into v_limit from memorials where id = p_memorial_id;

  select count(*) into v_count
  from user_roles ur
  join roles r on r.id = ur.role_id
  where ur.memorial_id = p_memorial_id
    and r.name = 'colaborador_familiar';

  if v_count >= v_limit then
    raise exception 'Se alcanzó el límite de % colaborador(es) para este memorial', v_limit;
  end if;

  insert into user_roles (user_id, role_id, memorial_id)
  select v_user_id, r.id, p_memorial_id
  from roles r
  where r.name = 'colaborador_familiar';
end;
$$;

create or replace function public.remove_collaborator(p_memorial_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not can_manage_memorial_collaborators(p_memorial_id) then
    raise exception 'No tienes permiso para quitar colaboradores de este memorial';
  end if;

  delete from user_roles
  where memorial_id = p_memorial_id
    and user_id = p_user_id
    and role_id = (select id from roles where name = 'colaborador_familiar');
end;
$$;

-- Solo super_admin: ajustar el límite de un memorial puntual (p.ej. según plan).
create or replace function public.set_memorial_collaborator_limit(p_memorial_id uuid, p_limit int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_super_admin() then
    raise exception 'Solo un administrador puede cambiar el límite de colaboradores';
  end if;
  if p_limit < 1 then
    raise exception 'El límite debe ser al menos 1';
  end if;

  update memorials set collaborator_limit = p_limit where id = p_memorial_id;
end;
$$;
