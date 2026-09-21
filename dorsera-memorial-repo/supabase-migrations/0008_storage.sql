-- ============================================================================
-- Dorsera Memorial · Migración 0008
-- Storage: bucket de medios del memorial.
--
-- El bucket es público (lectura anónima permitida, necesaria para que la
-- página pública del memorial muestre fotos sin sesión) y hoy NO tiene
-- políticas de RLS propias en storage.objects: todas las escrituras
-- (subida de fotos, generación de QR) pasan por Server Actions que usan
-- el service_role de Supabase, que bypassea RLS.
--
-- Si en el futuro se sube contenido directo desde el navegador (sin pasar
-- por una Server Action), hay que agregar policies de insert/update/delete
-- en storage.objects acotadas por prefijo de carpeta (memorial_id) y
-- verificadas contra has_memorial_role / has_organization_role.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('memorial-assets', 'memorial-assets', true)
on conflict (id) do nothing;
