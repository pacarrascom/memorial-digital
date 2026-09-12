import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMpPaymentClient } from '@/lib/mercadopago'

function isValidSignature(request: NextRequest, dataId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  const signatureHeader = request.headers.get('x-signature')
  const requestId = request.headers.get('x-request-id')

  if (!secret || !signatureHeader || !requestId) {
    return false
  }

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, value] = part.split('=')
      return [key?.trim(), value?.trim()]
    })
  )

  const ts = parts['ts']
  const receivedHash = parts['v1']
  if (!ts || !receivedHash) {
    return false
  }

  // Formato exigido por Mercado Pago: id:{data.id};request-id:{x-request-id};ts:{ts};
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`
  const computedHash = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(receivedHash))
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url)
  const dataIdFromQuery = url.searchParams.get('data.id') ?? url.searchParams.get('id')
  const topic = url.searchParams.get('type') ?? url.searchParams.get('topic')

  let body: { data?: { id?: string } } | null = null
  try {
    body = await request.json()
  } catch {
    // cuerpo vacío o no-JSON; seguimos con los query params
  }

  const paymentId = dataIdFromQuery ?? body?.data?.id
  if (!paymentId) {
    return NextResponse.json({ error: 'Falta el id del pago' }, { status: 400 })
  }

  if (!isValidSignature(request, String(paymentId))) {
    console.error('mercadopago webhook: firma inválida', { paymentId })
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  if (topic && topic !== 'payment') {
    // Ignoramos otros tipos de notificación (merchant_order, etc.)
    return NextResponse.json({ received: true })
  }

  const admin = createAdminClient()

  try {
    // Nunca confiamos en el estado que viene en la notificación: siempre se
    // vuelve a consultar el pago directamente a la API de Mercado Pago.
    const mpPayment = await getMpPaymentClient().get({ id: String(paymentId) })

    const externalReference = mpPayment.external_reference
    const status = mpPayment.status // 'approved' | 'rejected' | 'pending' | 'in_process' | ...

    if (!externalReference) {
      console.error('mercadopago webhook: pago sin external_reference', paymentId)
      return NextResponse.json({ received: true })
    }

    if (status === 'pending' || status === 'in_process') {
      // Todavía no hay nada que confirmar; Mercado Pago volverá a notificar.
      return NextResponse.json({ received: true })
    }

    // confirm_payment solo acepta 'aprobado' | 'rechazado' (masculino, concuerda
    // con "pago"). No confundir con organizations.status, que sí usa formas
    // femeninas ('aprobada'/'rechazada') porque concuerda con "solicitud".
    const mappedStatus = status === 'approved' ? 'aprobado' : 'rechazado'

    const { error: rpcError } = await admin.rpc('confirm_payment', {
      p_payment_id: externalReference,
      p_mp_payment_id: String(paymentId),
      p_status: mappedStatus,
    })

    if (rpcError) {
      console.error('mercadopago webhook: error en confirm_payment', rpcError)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('mercadopago webhook: error consultando el pago', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// Mercado Pago a veces valida el endpoint con un GET antes de guardar la URL en el panel.
export async function GET() {
  return NextResponse.json({ ok: true })
}
