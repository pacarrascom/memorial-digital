-- ============================================================================
-- Dorsera Memorial · Migración 0006
-- Row Level Security — todas las tablas
-- ============================================================================

alter table public.profiles                 enable row level security;
alter table public.persons                  enable row level security;
alter table public.family_groups            enable row level security;
alter table public.family_group_members     enable row level security;
alter table public.funeral_homes            enable row level security;
alter table public.funeral_home_staff       enable row level security;
alter table public.funeral_home_clients     enable row level security;
alter table public.memorials                enable row level security;
alter table public.qr_codes                 enable row level security;
alter table public.albums                   enable row level security;
alter table public.media_items              enable row level security;
alter table public.timeline_events          enable row level security;
alter table public.timeline_event_persons   enable row level security;
alter table public.family_tree_relationships enable row level security;
alter table public.tributes                 enable row level security;
alter table public.memorial_invites         enable row level security;
alter table public.subscriptions            enable row level security;
alter table public.analytics_events         enable row level security;
alter table public.audit_logs               enable row level security;

-- ---------------------------------------------------------------------------
-- PROFILES: cada quien ve/edita el suyo; super_admin ve todos
-- ---------------------------------------------------------------------------
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_super_admin());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- FAMILY_GROUPS
-- ---------------------------------------------------------------------------
create policy "family_groups_select_members"
  on public.family_groups for select
  using (public.is_family_member(id) or public.is_super_admin());

create policy "family_groups_insert_authenticated"
  on public.family_groups for insert
  with check (auth.uid() is not null and created_by = auth.uid());

create policy "family_groups_update_admin"
  on public.family_groups for update
  using (public.is_family_admin(id) or public.is_super_admin());

create policy "family_groups_delete_admin"
  on public.family_groups for delete
  using (public.is_family_admin(id) or public.is_super_admin());

-- ---------------------------------------------------------------------------
-- FAMILY_GROUP_MEMBERS
-- ---------------------------------------------------------------------------
create policy "members_select_same_group"
  on public.family_group_members for select
  using (public.is_family_member(family_group_id) or public.is_super_admin());

create policy "members_insert_admin_only"
  on public.family_group_members for insert
  with check (public.is_family_admin(family_group_id) or public.is_super_admin());

create policy "members_update_admin_only"
  on public.family_group_members for update
  using (public.is_family_admin(family_group_id) or public.is_super_admin());

create policy "members_delete_admin_only"
  on public.family_group_members for delete
  using (public.is_family_admin(family_group_id) or public.is_super_admin());

-- ---------------------------------------------------------------------------
-- PERSONS: visible si soy miembro de algún family_group cuyo memorial
-- referencia esta persona, o si yo la creé, o soy super_admin.
-- ---------------------------------------------------------------------------
create policy "persons_select_related_or_creator"
  on public.persons for select
  using (
    created_by = auth.uid()
    or public.is_super_admin()
    or exists (
      select 1 from public.memorials m
      where m.person_id = persons.id
        and public.is_family_member(m.family_group_id)
    )
  );

create policy "persons_insert_authenticated"
  on public.persons for insert
  with check (auth.uid() is not null and created_by = auth.uid());

create policy "persons_update_creator_or_family_admin"
  on public.persons for update
  using (
    created_by = auth.uid()
    or public.is_super_admin()
    or exists (
      select 1 from public.memorials m
      where m.person_id = persons.id
        and public.is_family_admin(m.family_group_id)
    )
  );

-- ---------------------------------------------------------------------------
-- FUNERAL_HOMES / STAFF / CLIENTS
-- ---------------------------------------------------------------------------
create policy "funeral_homes_select_staff_or_admin"
  on public.funeral_homes for select
  using (public.is_funeral_home_staff(id) or public.is_super_admin());

create policy "funeral_homes_update_staff_or_admin"
  on public.funeral_homes for update
  using (public.is_funeral_home_staff(id) or public.is_super_admin());

create policy "funeral_home_staff_select_self_scope"
  on public.funeral_home_staff for select
  using (public.is_funeral_home_staff(funeral_home_id) or public.is_super_admin());

create policy "funeral_home_clients_select_scope"
  on public.funeral_home_clients for select
  using (
    public.is_funeral_home_staff(funeral_home_id)
    or public.is_family_member(family_group_id)
    or public.is_super_admin()
  );

-- ---------------------------------------------------------------------------
-- MEMORIALS: público si visibility='public' y publicado; si no,
-- solo miembros de la familia / staff de la funeraria / super_admin.
-- ---------------------------------------------------------------------------
create policy "memorials_select_public"
  on public.memorials for select
  using (
    (visibility = 'public' and is_published = true)
    or public.is_family_member(family_group_id)
    or public.is_super_admin()
    or exists (
      select 1 from public.funeral_home_clients fhc
      where fhc.family_group_id = memorials.family_group_id
        and public.is_funeral_home_staff(fhc.funeral_home_id)
    )
  );

create policy "memorials_insert_family_or_funeral_home"
  on public.memorials for insert
  with check (
    public.is_family_admin(family_group_id)
    or public.is_super_admin()
    or exists (
      select 1 from public.funeral_home_clients fhc
      where fhc.family_group_id = memorials.family_group_id
        and public.is_funeral_home_staff(fhc.funeral_home_id)
    )
  );

create policy "memorials_update_family_admin"
  on public.memorials for update
  using (public.is_family_admin(family_group_id) or public.is_super_admin());

create policy "memorials_delete_family_admin"
  on public.memorials for delete
  using (public.is_family_admin(family_group_id) or public.is_super_admin());

-- ---------------------------------------------------------------------------
-- Patrón reutilizado para tablas "hijas de memorial": QR, álbumes, medios,
-- timeline, tributos. Visibilidad = misma regla que el memorial padre;
-- escritura = family_admin/collaborator del family_group dueño.
-- ---------------------------------------------------------------------------

-- QR_CODES
create policy "qr_codes_select_like_memorial"
  on public.qr_codes for select
  using (
    exists (
      select 1 from public.memorials m
      where m.id = qr_codes.memorial_id
        and ((m.visibility = 'public' and m.is_published) or public.is_family_member(m.family_group_id))
    ) or public.is_super_admin()
  );

create policy "qr_codes_write_family_admin"
  on public.qr_codes for all
  using (public.is_family_admin(public.family_group_of_memorial(memorial_id)) or public.is_super_admin())
  with check (public.is_family_admin(public.family_group_of_memorial(memorial_id)) or public.is_super_admin());

-- ALBUMS
create policy "albums_select_like_memorial"
  on public.albums for select
  using (
    exists (
      select 1 from public.memorials m
      where m.id = albums.memorial_id
        and ((m.visibility = 'public' and m.is_published) or public.is_family_member(m.family_group_id))
    ) or public.is_super_admin()
  );

create policy "albums_write_family_members"
  on public.albums for all
  using (public.is_family_member(public.family_group_of_memorial(memorial_id)) or public.is_super_admin())
  with check (public.is_family_member(public.family_group_of_memorial(memorial_id)) or public.is_super_admin());

-- MEDIA_ITEMS
create policy "media_items_select_like_memorial"
  on public.media_items for select
  using (
    exists (
      select 1 from public.memorials m
      where m.id = media_items.memorial_id
        and ((m.visibility = 'public' and m.is_published) or public.is_family_member(m.family_group_id))
    ) or public.is_super_admin()
  );

create policy "media_items_write_family_members"
  on public.media_items for all
  using (public.is_family_member(public.family_group_of_memorial(memorial_id)) or public.is_super_admin())
  with check (public.is_family_member(public.family_group_of_memorial(memorial_id)) or public.is_super_admin());

-- TIMELINE_EVENTS
create policy "timeline_events_select_like_memorial"
  on public.timeline_events for select
  using (
    exists (
      select 1 from public.memorials m
      where m.id = timeline_events.memorial_id
        and ((m.visibility = 'public' and m.is_published) or public.is_family_member(m.family_group_id))
    ) or public.is_super_admin()
  );

create policy "timeline_events_write_family_members"
  on public.timeline_events for all
  using (public.is_family_member(public.family_group_of_memorial(memorial_id)) or public.is_super_admin())
  with check (public.is_family_member(public.family_group_of_memorial(memorial_id)) or public.is_super_admin());

-- TIMELINE_EVENT_PERSONS (junction — hereda de timeline_events)
create policy "timeline_event_persons_select"
  on public.timeline_event_persons for select
  using (
    exists (
      select 1 from public.timeline_events te
      join public.memorials m on m.id = te.memorial_id
      where te.id = timeline_event_persons.timeline_event_id
        and ((m.visibility = 'public' and m.is_published) or public.is_family_member(m.family_group_id))
    ) or public.is_super_admin()
  );

create policy "timeline_event_persons_write"
  on public.timeline_event_persons for all
  using (
    exists (
      select 1 from public.timeline_events te
      where te.id = timeline_event_persons.timeline_event_id
        and (public.is_family_member(public.family_group_of_memorial(te.memorial_id)) or public.is_super_admin())
    )
  );

-- FAMILY_TREE_RELATIONSHIPS: visible/editable por quien puede ver/editar
-- alguna de las dos personas involucradas (a través de sus memoriales)
create policy "family_tree_select"
  on public.family_tree_relationships for select
  using (
    public.is_super_admin()
    or exists (
      select 1 from public.memorials m
      where m.person_id in (person_id, related_person_id)
        and public.is_family_member(m.family_group_id)
    )
  );

create policy "family_tree_write"
  on public.family_tree_relationships for all
  using (
    public.is_super_admin()
    or exists (
      select 1 from public.memorials m
      where m.person_id in (person_id, related_person_id)
        and public.is_family_member(m.family_group_id)
    )
  );

-- TRIBUTES: lectura pública solo si status='approved' y memorial público;
-- la familia ve todo (incluido pendiente) para poder moderar.
create policy "tributes_select_approved_public_or_family"
  on public.tributes for select
  using (
    (
      status = 'approved'
      and exists (
        select 1 from public.memorials m
        where m.id = tributes.memorial_id
          and m.visibility = 'public' and m.is_published
      )
    )
    or public.is_family_member(public.family_group_of_memorial(memorial_id))
    or public.is_super_admin()
  );

-- Cualquier visitante autenticado o anónimo (via función pública) puede insertar,
-- pero queda en 'pending' — el default de la columna ya lo garantiza.
create policy "tributes_insert_anyone"
  on public.tributes for insert
  with check (true);

create policy "tributes_moderate_family"
  on public.tributes for update
  using (public.is_family_member(public.family_group_of_memorial(memorial_id)) or public.is_super_admin());

create policy "tributes_delete_family_admin"
  on public.tributes for delete
  using (public.is_family_admin(public.family_group_of_memorial(memorial_id)) or public.is_super_admin());

-- MEMORIAL_INVITES: solo family_admin del memorial puede gestionar invitaciones
create policy "memorial_invites_family_admin_only"
  on public.memorial_invites for all
  using (public.is_family_admin(public.family_group_of_memorial(memorial_id)) or public.is_super_admin())
  with check (public.is_family_admin(public.family_group_of_memorial(memorial_id)) or public.is_super_admin());

-- ---------------------------------------------------------------------------
-- SUBSCRIPTIONS
-- ---------------------------------------------------------------------------
create policy "subscriptions_select_owner"
  on public.subscriptions for select
  using (
    (family_group_id is not null and public.is_family_member(family_group_id))
    or (funeral_home_id is not null and public.is_funeral_home_staff(funeral_home_id))
    or public.is_super_admin()
  );

create policy "subscriptions_write_admin_only"
  on public.subscriptions for all
  using (
    (family_group_id is not null and public.is_family_admin(family_group_id))
    or (funeral_home_id is not null and public.is_funeral_home_staff(funeral_home_id))
    or public.is_super_admin()
  );

-- ---------------------------------------------------------------------------
-- ANALYTICS_EVENTS: escritura abierta (server-side / edge function con
-- service_role), lectura restringida a la familia dueña del memorial.
-- ---------------------------------------------------------------------------
create policy "analytics_select_family_only"
  on public.analytics_events for select
  using (public.is_family_member(public.family_group_of_memorial(memorial_id)) or public.is_super_admin());

-- Nota: los inserts de analítica se hacen normalmente con la service_role key
-- desde una Edge Function, que bypassa RLS. No se define policy de insert
-- para bloquear inserciones directas desde el cliente.

-- ---------------------------------------------------------------------------
-- AUDIT_LOGS: solo super_admin lee; las escrituras las hacen triggers/
-- funciones con security definer, nunca el cliente directamente.
-- ---------------------------------------------------------------------------
create policy "audit_logs_select_super_admin_only"
  on public.audit_logs for select
  using (public.is_super_admin());
