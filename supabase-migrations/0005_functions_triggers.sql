-- ============================================================================
-- Dorsera Memorial · Migración 0005
-- Funciones auxiliares para RLS + triggers de mantenimiento
-- ============================================================================

-- updated_at automático
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at        before update on public.profiles        for each row execute function public.touch_updated_at();
create trigger trg_persons_updated_at         before update on public.persons         for each row execute function public.touch_updated_at();
create trigger trg_family_groups_updated_at   before update on public.family_groups   for each row execute function public.touch_updated_at();
create trigger trg_funeral_homes_updated_at   before update on public.funeral_homes   for each row execute function public.touch_updated_at();
create trigger trg_memorials_updated_at       before update on public.memorials       for each row execute function public.touch_updated_at();
create trigger trg_subscriptions_updated_at   before update on public.subscriptions   for each row execute function public.touch_updated_at();

-- ¿El usuario autenticado es super_admin?
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and global_role = 'super_admin'
  );
$$;

-- ¿El usuario autenticado pertenece al family_group dado (cualquier rol)?
create or replace function public.is_family_member(p_family_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.family_group_members
    where family_group_id = p_family_group_id
      and profile_id = auth.uid()
  );
$$;

-- ¿El usuario autenticado es family_admin del family_group dado?
create or replace function public.is_family_admin(p_family_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.family_group_members
    where family_group_id = p_family_group_id
      and profile_id = auth.uid()
      and role = 'family_admin'
  );
$$;

-- ¿El usuario autenticado es staff de la funeraria dada?
create or replace function public.is_funeral_home_staff(p_funeral_home_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.funeral_home_staff
    where funeral_home_id = p_funeral_home_id
      and profile_id = auth.uid()
  );
$$;

-- Dado un memorial_id, devuelve su family_group_id (usado por policies de tablas hijas)
create or replace function public.family_group_of_memorial(p_memorial_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select family_group_id from public.memorials where id = p_memorial_id;
$$;

-- Genera un código corto legible (para qr_codes.short_code)
create or replace function public.generate_short_code(len int default 7)
returns text
language sql
volatile
as $$
  select substr(md5(gen_random_uuid()::text), 1, len);
$$;

-- Crea automáticamente el perfil cuando se registra un usuario en auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
