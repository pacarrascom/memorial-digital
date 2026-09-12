export type PaymentType =
  | 'individual_fotos'
  | 'individual_timeline'
  | 'individual_bundle'
  | 'org_subscription'
  | 'org_extra_block'

export const PAYMENT_CATALOG: Record<
  PaymentType,
  { amountClp: number; title: string; scope: 'memorial' | 'organization' }
> = {
  individual_fotos: {
    amountClp: 4990,
    title: 'Fotos ilimitadas',
    scope: 'memorial',
  },
  individual_timeline: {
    amountClp: 2990,
    title: 'Línea de tiempo ilimitada',
    scope: 'memorial',
  },
  individual_bundle: {
    amountClp: 6990,
    title: 'Pack todo incluido',
    scope: 'memorial',
  },
  org_subscription: {
    amountClp: 49990,
    title: 'Suscripción mensual funeraria (25 memoriales)',
    scope: 'organization',
  },
  org_extra_block: {
    amountClp: 99990,
    title: 'Bloque adicional de 25 memoriales',
    scope: 'organization',
  },
}
