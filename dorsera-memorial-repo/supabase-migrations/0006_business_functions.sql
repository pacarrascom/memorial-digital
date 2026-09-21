-- ============================================================================
-- Dorsera Memorial · Migración 0006
-- Funciones de negocio: creación de memoriales, colaboradores, alta y
-- aprobación de funerarias, confirmación de pagos (webhook Mercado Pago).
--
-- Nota: solo se versionan las firmas que el frontend usa hoy
-- (ver apps-web/lib/actions/*). En producción existen además dos
-- overloads viejos de create_memorial_for_org (6 args) y request_organization
-- (2 args) que quedaron huérfanos de una iteración anterior — no se
-- recrean aquí; conviene eliminarlos (drop function) del proyecto real.
-- ============================================================================

create or replace function public.create_memorial(
  p_full_name text,
  p_birth_date date default null,
  p_death_date date default null,
  p_birth_place text default null,
  p_biography text default null
)
returns table(memorial_id uuid, slug text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_memorial_id uuid;
  v_slug text;
  v_user_id uuid := auth.uid();
  v_account_type text;
begin
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  select raw_user_meta_data->>'account_type' into v_account_type
  from auth.users where id = v_user_id;

  if v_account_type = 'funeraria' then
    raise exception 'Tu cuenta es institucional. Crea memoriales desde el panel de tu funeraria, no como memorial individual.';
  end if;

  if p_full_name is null or trim(p_full_name) = '' then
    raise exception 'El nombre completo es obligatorio';
  end if;

  v_slug := lower(unaccent(trim(p_full_name)));
  v_slug := regexp_replace(v_slug, '[^a-z0-9]+', '-', 'g');
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then
    v_slug := 'memorial';
  end if;

  while exists (select 1 from memorials m where m.slug = v_slug) loop
    v_slug := v_slug || '-' || substr(md5(random()::text), 1, 4);
  end loop;

  insert into memorials (slug, visibility, created_by)
  values (v_slug, 'publico', v_user_id)
  returning id into v_memorial_id;

  insert into person_profile (memorial_id, full_name, birth_date, death_date, birth_place, biography)
  values (v_memorial_id, trim(p_full_name), p_birth_date, p_death_date, p_birth_place, p_biography);

  insert into user_roles (user_id, role_id, memorial_id)
  values (v_user_id, (select id from roles where name = 'admin_familiar'), v_memorial_id);

  return query select v_memorial_id, v_slug;
end;
$$;

create or replace function public.create_memorial_for_org(
  p_organization_id uuid,
  p_full_name text,
  p_birth_date date default null,
  p_death_date date default null,
  p_birth_place text default null,
  p_biography text default null,
  p_family_contact_name text default null,
  p_family_contact_email text default null,
  p_family_contact_phone text default null
)
returns table(memorial_id uuid, slug text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_memorial_id uuid;
  v_slug text;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  if not is_super_admin() and not is_organization_member(p_organization_id, array['funeraria'::role_name]) then
    raise exception 'No tienes permiso para crear memoriales en esta organización';
  end if;

  if not is_super_admin() and organization_monthly_usage(p_organization_id) >= organization_monthly_quota(p_organization_id) then
    raise exception 'Se alcanzó el cupo mensual de memoriales de esta organización. Compra un bloque adicional para continuar.';
  end if;

  if p_full_name is null or trim(p_full_name) = '' then
    raise exception 'El nombre completo es obligatorio';
  end if;

  v_slug := lower(unaccent(trim(p_full_name)));
  v_slug := regexp_replace(v_slug, '[^a-z0-9]+', '-', 'g');
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then
    v_slug := 'memorial';
  end if;

  while exists (select 1 from memorials m where m.slug = v_slug) loop
    v_slug := v_slug || '-' || substr(md5(random()::text), 1, 4);
  end loop;

  insert into memorials (
    slug, visibility, created_by, organization_id,
    family_contact_name, family_contact_email, family_contact_phone
  )
  values (
    v_slug, 'publico', v_user_id, p_organization_id,
    nullif(trim(coalesce(p_family_contact_name, '')), ''),
    nullif(trim(coalesce(p_family_contact_email, '')), ''),
    nullif(trim(coalesce(p_family_contact_phone, '')), '')
  )
  returning id into v_memorial_id;

  insert into person_profile (memorial_id, full_name, birth_date, death_date, birth_place, biography)
  values (v_memorial_id, trim(p_full_name), p_birth_date, p_death_date, p_birth_place, p_biography);

  return query select v_memorial_id, v_slug;
end;
$$;

create or replace function public.create_memorials_bulk_for_org(p_organization_id uuid, p_memorials jsonb)
returns table(row_index integer, success boolean, memorial_id uuid, slug text, error_message text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_item jsonb;
  v_index int := 0;
  v_full_name text;
  v_slug text;
  v_memorial_id uuid;
  v_quota int;
  v_usage int;
begin
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  if not is_super_admin() and not is_organization_member(p_organization_id, array['funeraria'::role_name]) then
    raise exception 'No tienes permiso para crear memoriales en esta organización';
  end if;

  v_quota := organization_monthly_quota(p_organization_id);

  for v_item in select * from jsonb_array_elements(p_memorials)
  loop
    v_index := v_index + 1;
    v_usage := organization_monthly_usage(p_organization_id);

    if not is_super_admin() and v_usage >= v_quota then
      row_index := v_index;
      success := false;
      memorial_id := null;
      slug := null;
      error_message := 'Cupo mensual agotado. Compra un bloque adicional para continuar.';
      return next;
      continue;
    end if;

    v_full_name := trim(v_item->>'full_name');

    if v_full_name is null or v_full_name = '' then
      row_index := v_index;
      success := false;
      memorial_id := null;
      slug := null;
      error_message := 'Nombre completo vacío';
      return next;
      continue;
    end if;

    begin
      v_slug := lower(unaccent(v_full_name));
      v_slug := regexp_replace(v_slug, '[^a-z0-9]+', '-', 'g');
      v_slug := trim(both '-' from v_slug);
      if v_slug = '' then
        v_slug := 'memorial';
      end if;

      while exists (select 1 from memorials m where m.slug = v_slug) loop
        v_slug := v_slug || '-' || substr(md5(random()::text), 1, 4);
      end loop;

      insert into memorials (
        slug, visibility, created_by, organization_id,
        family_contact_name, family_contact_email, family_contact_phone
      )
      values (
        v_slug, 'publico', v_user_id, p_organization_id,
        nullif(v_item->>'family_contact_name',''),
        nullif(v_item->>'family_contact_email',''),
        nullif(v_item->>'family_contact_phone','')
      )
      returning id into v_memorial_id;

      insert into person_profile (memorial_id, full_name, birth_date, death_date, birth_place, biography)
      values (
        v_memorial_id,
        v_full_name,
        nullif(v_item->>'birth_date','')::date,
        nullif(v_item->>'death_date','')::date,
        nullif(v_item->>'birth_place',''),
        nullif(v_item->>'biography','')
      );

      row_index := v_index;
      success := true;
      memorial_id := v_memorial_id;
      slug := v_slug;
      error_message := null;
      return next;
    exception when others then
      row_index := v_index;
      success := false;
      memorial_id := null;
      slug := null;
      error_message := sqlerrm;
      return next;
    end;
  end loop;

  return;
end;
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

-- Límite de colaboradores (rol colaborador_familiar, sin contar al
-- admin_familiar dueño): default 1 para memoriales individuales, 2 para
-- memoriales de una organización (ver trigger en 0002).
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

create or replace function public.set_cover_photo(p_media_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_memorial_id uuid;
begin
  select memorial_id into v_memorial_id from media_assets where id = p_media_id;

  if v_memorial_id is null then
    raise exception 'Foto no encontrada';
  end if;

  if not is_super_admin()
     and not has_memorial_role(v_memorial_id, array['admin_familiar'::role_name, 'colaborador_familiar'::role_name])
     and not has_organization_role(v_memorial_id, array['funeraria'::role_name])
  then
    raise exception 'No tienes permiso para editar este memorial';
  end if;

  update media_assets set is_cover = false where memorial_id = v_memorial_id;
  update media_assets set is_cover = true where id = p_media_id;

  return true;
end;
$$;

-- Alta de una funeraria directamente por un super_admin (queda 'aprobada').
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

-- Autoservicio: un usuario recién registrado como cuenta institucional pide
-- su funeraria (queda 'pendiente' hasta que un super_admin la apruebe).
create or replace function public.request_organization(
  p_name text,
  p_contact_email text,
  p_rut text default null,
  p_contact_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_org_id uuid;
begin
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  if p_name is null or trim(p_name) = '' then
    raise exception 'El nombre de la funeraria es obligatorio';
  end if;

  -- Evita solicitudes duplicadas del mismo usuario mientras una esté pendiente
  if exists (
    select 1 from organizations
    where requested_by = v_user_id and status = 'pendiente'
  ) then
    select id into v_org_id from organizations
    where requested_by = v_user_id and status = 'pendiente'
    limit 1;
    return v_org_id;
  end if;

  insert into organizations (name, type, contact_email, rut, contact_phone, status, requested_by)
  values (trim(p_name), 'funeraria', p_contact_email, p_rut, p_contact_phone, 'pendiente', v_user_id)
  returning id into v_org_id;

  return v_org_id;
end;
$$;

create or replace function public.approve_organization(p_organization_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requested_by uuid;
begin
  if not is_super_admin() then
    raise exception 'Solo un administrador puede aprobar organizaciones';
  end if;

  select requested_by into v_requested_by from organizations where id = p_organization_id;

  if v_requested_by is null then
    raise exception 'Organización no encontrada o sin solicitante asociado';
  end if;

  update organizations set status = 'aprobada' where id = p_organization_id;

  insert into user_roles (user_id, role_id, organization_id)
  select v_requested_by, r.id, p_organization_id
  from roles r
  where r.name = 'funeraria'
  on conflict do nothing;

  return true;
end;
$$;

create or replace function public.reject_organization(p_organization_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_super_admin() then
    raise exception 'Solo un administrador puede rechazar organizaciones';
  end if;

  update organizations set status = 'rechazada' where id = p_organization_id;
  return true;
end;
$$;

-- Confirmación de pago (llamada por el webhook de Mercado Pago vía
-- service_role — ver apps-web/app/api/webhooks/mercadopago/route.ts).
-- Idempotente: si el pago ya no está 'pendiente', no vuelve a aplicar
-- efectos (evita duplicar entitlements/créditos ante notificaciones repetidas).
create or replace function public.confirm_payment(
  p_payment_id uuid,
  p_mp_payment_id text,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment payments%rowtype;
begin
  if auth.uid() is not null and not is_super_admin() then
    raise exception 'No autorizado';
  end if;

  if p_status not in ('aprobado', 'rechazado') then
    raise exception 'Estado de pago inválido: %', p_status;
  end if;

  select * into v_payment from payments where id = p_payment_id for update;

  if not found then
    raise exception 'Pago % no encontrado', p_payment_id;
  end if;

  if v_payment.status <> 'pendiente' then
    return true;
  end if;

  update payments
    set status = p_status, mp_payment_id = p_mp_payment_id, updated_at = now()
    where id = p_payment_id;

  if p_status <> 'aprobado' then
    return true;
  end if;

  case v_payment.type
    when 'individual_fotos' then
      insert into memorial_entitlements (memorial_id, photos_unlimited)
      values (v_payment.memorial_id, true)
      on conflict (memorial_id) do update set photos_unlimited = true, updated_at = now();
    when 'individual_timeline' then
      insert into memorial_entitlements (memorial_id, timeline_unlimited)
      values (v_payment.memorial_id, true)
      on conflict (memorial_id) do update set timeline_unlimited = true, updated_at = now();
    when 'individual_bundle' then
      insert into memorial_entitlements (memorial_id, photos_unlimited, timeline_unlimited)
      values (v_payment.memorial_id, true, true)
      on conflict (memorial_id) do update set photos_unlimited = true, timeline_unlimited = true, updated_at = now();
    when 'org_subscription' then
      update organizations
        set subscription_active_until = greatest(coalesce(subscription_active_until, now()), now()) + interval '30 days'
        where id = v_payment.organization_id;
    when 'org_extra_block' then
      insert into organization_credits (organization_id, quantity, mp_payment_id)
      values (v_payment.organization_id, 25, p_mp_payment_id);
    else
      raise exception 'Tipo de pago desconocido: %', v_payment.type;
  end case;

  insert into audit_logs (user_id, memorial_id, action, metadata)
  values (
    v_payment.user_id, v_payment.memorial_id, 'payment_confirmed',
    jsonb_build_object(
      'payment_id', p_payment_id, 'type', v_payment.type,
      'mp_payment_id', p_mp_payment_id, 'organization_id', v_payment.organization_id,
      'amount_clp', v_payment.amount_clp
    )
  );

  return true;
end;
$$;
