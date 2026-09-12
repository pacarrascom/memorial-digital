'use client'

import { useState, useTransition } from 'react'
import { createUnlockPreference } from '@/lib/actions/payments'
import type { PaymentType } from '@/lib/payments/catalog'

const LABELS: Record<PaymentType, string> = {
  individual_fotos: 'Desbloquear fotos ilimitadas — $4.990',
  individual_timeline: 'Desbloquear línea de tiempo ilimitada — $2.990',
  individual_bundle: 'Desbloquear todo — $6.990',
  org_subscription: 'Renovar suscripción — $49.990',
  org_extra_block: 'Comprar bloque de 25 memoriales — $99.990',
}

type Props = {
  type: PaymentType
  memorialId?: string
  organizationId?: string
}

export function UnlockButton({ type, memorialId, organizationId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await createUnlockPreference(type, { memorialId, organizationId })
      if (!result.success) {
        setError(result.error)
        return
      }
      window.location.href = result.checkoutUrl
    })
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-lg bg-moss-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-moss-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Redirigiendo a Mercado Pago…' : LABELS[type]}
      </button>
      <p className="text-xs text-ink-400">
        Al continuar, el servicio se activa de inmediato y no aplica derecho a retracto (art. 3° bis, letra b, Ley
        N° 19.496).
      </p>
      {error && (
        <p role="alert" className="text-xs text-flame-600">
          {error}
        </p>
      )}
    </div>
  )
}
