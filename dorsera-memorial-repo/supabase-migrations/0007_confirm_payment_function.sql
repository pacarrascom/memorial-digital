-- ============================================================================
-- Dorsera Memorial · Migración 0007
-- Función confirm_payment — ya aplicada en producción vía SQL Editor.
-- Este archivo solo la deja versionada en el repo (no ejecutar de nuevo salvo
-- que se esté reconstruyendo la base desde cero).
--
-- Depende de tablas que todavía no están en supabase-migrations/:
-- payments, organizations, organization_credits, memorial_entitlements,
-- audit_logs (esta última sí está en 0004, pero con columnas distintas a las
-- usadas acá — revisar antes de aplicar en un entorno nuevo).
-- ============================================================================

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
