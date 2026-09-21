-- ============================================================================
-- Dorsera Memorial · Migración 0007
-- Políticas RLS de las 20 tablas. RLS ya quedó activado en cada tabla por
-- el event trigger rls_auto_enable (0001); acá solo se agregan las policies.
--
-- Tablas SIN policy de insert propia a propósito (subscriptions, roles,
-- ai_jobs se maneja por rol de memorial, analytics futuros, etc.): sin una
-- policy de insert/update para un comando dado, RLS lo bloquea por defecto
-- para cualquier rol que no sea service_role (usado en Edge Functions /
-- Server Actions con supabase-js admin client, nunca expuesto al cliente).
-- ============================================================================

-- memorials ------------------------------------------------------------------
create policy memorials_select on public.memorials for select
  using (
    visibility = 'publico'
    or is_super_admin()
    or has_memorial_role(id, array['admin_familiar','colaborador_familiar','invitado_privado']::role_name[])
    or has_organization_role(id, array['funeraria']::role_name[])
  );

create policy memorials_insert on public.memorials for insert
  with check (auth.uid() is not null);

create policy memorials_update on public.memorials for update
  using (
    is_super_admin()
    or has_memorial_role(id, array['admin_familiar']::role_name[])
    or has_organization_role(id, array['funeraria']::role_name[])
  );

create policy memorials_delete on public.memorials for delete
  using (is_super_admin() or has_memorial_role(id, array['admin_familiar']::role_name[]));

-- organizations ----------------------------------------------------------
create policy organizations_select on public.organizations for select
  using (
    is_super_admin()
    or is_organization_member(id, array['funeraria']::role_name[])
    or requested_by = auth.uid()
  );

-- organization_credits -----------------------------------------------------
create policy organization_credits_select on public.organization_credits for select
  using (is_super_admin() or is_organization_member(organization_id, array['funeraria']::role_name[]));

-- user_roles -----------------------------------------------------------------
create policy user_roles_select on public.user_roles for select
  using (
    user_id = auth.uid()
    or is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar']::role_name[])
  );

create policy user_roles_write on public.user_roles for all
  using (is_super_admin() or has_memorial_role(memorial_id, array['admin_familiar']::role_name[]))
  with check (is_super_admin() or has_memorial_role(memorial_id, array['admin_familiar']::role_name[]));

-- person_profile ---------------------------------------------------------
create policy person_profile_select on public.person_profile for select
  using (
    memorial_is_public(memorial_id)
    or is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar','invitado_privado']::role_name[])
    or has_organization_role(memorial_id, array['funeraria']::role_name[])
  );

create policy person_profile_write on public.person_profile for all
  using (
    is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[])
    or has_organization_role(memorial_id, array['funeraria']::role_name[])
  )
  with check (
    is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[])
    or has_organization_role(memorial_id, array['funeraria']::role_name[])
  );

-- timeline_events --------------------------------------------------------
create policy timeline_select on public.timeline_events for select
  using (
    memorial_is_public(memorial_id)
    or is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar','invitado_privado']::role_name[])
    or has_organization_role(memorial_id, array['funeraria']::role_name[])
  );

create policy timeline_write on public.timeline_events for all
  using (
    is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[])
    or has_organization_role(memorial_id, array['funeraria']::role_name[])
  )
  with check (
    is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[])
    or has_organization_role(memorial_id, array['funeraria']::role_name[])
  );

-- albums -------------------------------------------------------------------
create policy albums_all on public.albums for all
  using (
    is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[])
    or has_organization_role(memorial_id, array['funeraria']::role_name[])
  )
  with check (
    is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[])
    or has_organization_role(memorial_id, array['funeraria']::role_name[])
  );

-- media_assets ---------------------------------------------------------------
create policy media_select on public.media_assets for select
  using (
    memorial_is_public(memorial_id)
    or is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar','invitado_privado']::role_name[])
    or has_organization_role(memorial_id, array['funeraria']::role_name[])
  );

create policy media_write on public.media_assets for all
  using (
    is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[])
    or has_organization_role(memorial_id, array['funeraria']::role_name[])
  )
  with check (
    is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[])
    or has_organization_role(memorial_id, array['funeraria']::role_name[])
  );

-- family_tree_nodes ------------------------------------------------------
create policy family_tree_select on public.family_tree_nodes for select
  using (
    memorial_id is null
    or memorial_is_public(memorial_id)
    or is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[])
  );

create policy family_tree_write on public.family_tree_nodes for all
  using (is_super_admin() or (memorial_id is not null and has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[])))
  with check (is_super_admin() or (memorial_id is not null and has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[])));

-- guestbook_entries (libro de recuerdos) --------------------------------
create policy guestbook_select on public.guestbook_entries for select
  using (
    moderation_status = 'aprobado'
    or is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[])
    or has_organization_role(memorial_id, array['funeraria']::role_name[])
    or author_user_id = auth.uid()
  );

create policy guestbook_insert on public.guestbook_entries for insert
  with check (
    memorial_is_public(memorial_id)
    or has_memorial_role(memorial_id, array['invitado_privado','admin_familiar','colaborador_familiar']::role_name[])
  );

create policy guestbook_moderate on public.guestbook_entries for update
  using (
    is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[])
    or has_organization_role(memorial_id, array['funeraria']::role_name[])
  );

-- reactions (velas, flores, corazones) ------------------------------------
create policy reactions_select on public.reactions for select using (true);

create policy reactions_insert on public.reactions for insert
  with check (auth.uid() is not null or memorial_is_public(memorial_id));

-- qr_codes -------------------------------------------------------------------
create policy qr_select on public.qr_codes for select
  using (
    memorial_is_public(memorial_id)
    or is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[])
    or has_organization_role(memorial_id, array['funeraria']::role_name[])
  );

create policy qr_write on public.qr_codes for all
  using (
    is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar']::role_name[])
    or has_organization_role(memorial_id, array['funeraria']::role_name[])
  )
  with check (
    is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar']::role_name[])
    or has_organization_role(memorial_id, array['funeraria']::role_name[])
  );

-- candles ------------------------------------------------------------------
create policy candles_select on public.candles for select
  using (
    memorial_is_public(memorial_id)
    or is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar','invitado_privado']::role_name[])
    or has_organization_role(memorial_id, array['funeraria']::role_name[])
  );

create policy candles_insert on public.candles for insert
  with check (
    memorial_is_public(memorial_id)
    or has_memorial_role(memorial_id, array['invitado_privado','admin_familiar','colaborador_familiar']::role_name[])
  );

-- ai_jobs --------------------------------------------------------------------
create policy ai_jobs_all on public.ai_jobs for all
  using (is_super_admin() or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[]))
  with check (is_super_admin() or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[]));

-- payments -------------------------------------------------------------------
create policy payments_select on public.payments for select
  using (
    is_super_admin()
    or user_id = auth.uid()
    or (memorial_id is not null and has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[]))
    or (organization_id is not null and is_organization_member(organization_id, array['funeraria']::role_name[]))
  );

create policy payments_insert on public.payments for insert
  with check (user_id = auth.uid());

-- memorial_entitlements ------------------------------------------------------
create policy memorial_entitlements_select on public.memorial_entitlements for select
  using (
    is_super_admin()
    or has_memorial_role(memorial_id, array['admin_familiar','colaborador_familiar']::role_name[])
    or has_organization_role(memorial_id, array['funeraria']::role_name[])
  );

-- audit_logs -----------------------------------------------------------------
-- Insert queda abierto a cualquier usuario autenticado porque las Server
-- Actions insertan auditoría desde el cliente autenticado (no solo desde
-- funciones security definer); select sigue acotado al dueño del memorial.
create policy audit_logs_insert on public.audit_logs for insert
  with check (auth.uid() is not null);

create policy audit_logs_select on public.audit_logs for select
  using (is_super_admin() or (memorial_id is not null and has_memorial_role(memorial_id, array['admin_familiar']::role_name[])));
