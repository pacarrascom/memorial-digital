import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

let mpClient: MercadoPagoConfig | null = null

function getClient() {
  if (!mpClient) {
    const accessToken = process.env.MP_ACCESS_TOKEN
    if (!accessToken) {
      throw new Error('Falta la variable de entorno MP_ACCESS_TOKEN.')
    }
    mpClient = new MercadoPagoConfig({ accessToken })
  }
  return mpClient
}

export function getMpPreferenceClient() {
  return new Preference(getClient())
}

export function getMpPaymentClient() {
  return new Payment(getClient())
}
