import QRCode from 'qrcode'

export async function generateQrAssets(targetUrl: string) {
  const pngBuffer = await QRCode.toBuffer(targetUrl, {
    type: 'png',
    width: 1024,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#1C1B18',
      light: '#FFFFFF',
    },
  })

  const svgString = await QRCode.toString(targetUrl, {
    type: 'svg',
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#1C1B18',
      light: '#FFFFFF',
    },
  })

  return { pngBuffer, svgString }
}

export function generateShortCode(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}
