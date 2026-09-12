'use server'

import { createClient } from '@/lib/supabase/server'
import { getMpPreferenceClient } from '@/lib/mercadopago'
import { PAYMENT_CATALOG, type PaymentType } from '@/lib/payments/catalog'

type CreatePreferenceResult =
  | { success: true; checkoutUrl: string }
  | { success: false; error: string }

export async function createUnlockPreference(
  type: PaymentType,
  target: { memorialId?: string; organizationId?: string }
): Promise<CreatePreferenceResult> {
  const catalogEntry = PAYMENT_CATALOG[type]
  if (!catalogEntry) {
    return { success: false, error: 'Tipo de pago inválido.' }
  }

  const supabase = await createClient()

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) {
    return { success: false, error: 'No hay una sesión activa.' }
  }

  if (catalogEntry.scope === 'memorial') {
    if (!target.memorialId) {
      return { success: false, error: 'Falta el memorial.' }
    }
    const { data: hasPermission, error: permError } = await supabase.rpc('has_memorial_role', {
      p_memorial_id: target.memorialId,
      p_roles: ['admin_familiar', 'colaborador_familiar'],
    })
    if (permError || !hasPermission) {
      return { success: false, error: 'No tienes permiso para desbloquear este memorial.' }
    }
  } else {
    if (!target.organizationId) {
      return { success: false, error: 'Falta la organización.' }
    }
    const { data: isMember, error: memberError } = await supabase.rpc('is_organization_member', {
      p_organization_id: target.organizationId,
      p_roles: ['funeraria'],
    })
    if (memberError || !isMember) {
      return { success: false, error: 'No tienes permiso para comprar en esta organización.' }
    }
  }

  // 1. Crear el registro de pago en estado 'pendiente' (RLS: payments_insert exige user_id = auth.uid())
  const { data: payment, error: insertError } = await supabase
    .from('payments')
    .insert({
      type,
      user_id: user.id,
      memorial_id: target.memorialId ?? null,
      organization_id: target.organizationId ?? null,
      amount_clp: catalogEntry.amountClp,
    })
    .select('id')
    .single()

  if (insertError || !payment) {
    console.error('createUnlockPreference insert error:', insertError)
    return { success: false, error: 'No se pudo iniciar el pago.' }
  }

  // 2. Crear la preferencia en Mercado Pago (Checkout Pro)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://memorial-digital-lac.vercel.app'
  const returnPath = target.memorialId ? `/admin/memorials/${target.memorialId}/gallery` : `/admin`

  try {
    const preference = await getMpPreferenceClient().create({
      body: {
        items: [
          {
            id: type,
            title: `Dorzera Memorial Digital — ${catalogEntry.title}`,
            quantity: 1,
            unit_price: catalogEntry.amountClp,
            currency_id: 'CLP',
          },
        ],
        external_reference: payment.id,
        notification_url: `${siteUrl}/api/webhooks/mercadopago`,
        back_urls: {
          success: `${siteUrl}${returnPath}?pago=exitoso`,
          pending: `${siteUrl}${returnPath}?pago=pendiente`,
          failure: `${siteUrl}${returnPath}?pago=fallido`,
        },
        auto_return: 'approved',
        statement_descriptor: 'DORZERA MEMORIAL',
      },
    })

    const checkoutUrl = preference.init_point ?? preference.sandbox_init_point
    if (!checkoutUrl) {
      throw new Error('Mercado Pago no devolvió una URL de checkout.')
    }

    // 3. Guardar el id de la preferencia en el pago (best-effort; el webhook no depende de esto)
    await supabase.from('payments').update({ mp_preference_id: preference.id }).eq('id', payment.id)

    return { success: true, checkoutUrl }
  } catch (mpError) {
    console.error('createUnlockPreference MercadoPago error:', mpError)
    return { success: false, error: 'No se pudo conectar con Mercado Pago. Intenta nuevamente.' }
  }
}
