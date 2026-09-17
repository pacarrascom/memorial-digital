'use client'

import { useState } from 'react'
import { generateQrCode } from '@/lib/actions/qr'
import { generateQrPdf } from '@/lib/actions/qr-pdf'

type QrResult = { pngUrl: string; svgUrl: string; shortCode: string; publicUrl: string }

export function QrGenerator({
  memorialId,
  initialQr,
}: {
  memorialId: string
  initialQr: QrResult | null
}) {
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [result, setResult] = useState<
    { success: true } & QrResult | { success: false; error: string } | null
  >(initialQr ? { success: true, ...initialQr } : null)

  async function handleGenerate() {
    setLoading(true)
    setResult(null)
    const res = await generateQrCode(memorialId)
    setResult(res)
    setLoading(false)
  }

  async function handleDownloadPdf() {
    setPdfLoading(true)
    setPdfError(null)
    const res = await generateQrPdf(memorialId)
    if (!res.success) {
      setPdfError(res.error)
      setPdfLoading(false)
      return
    }
    const byteChars = atob(res.pdfBase64)
    const byteNumbers = new Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = res.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setPdfLoading(false)
  }

  return (
    <>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="rounded-lg bg-ink-900 px-4 py-2.5 font-medium text-white transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Generando…' : result?.success ? 'Regenerar código QR' : 'Generar código QR'}
      </button>

      {result && result.success && (
        <div className="mt-8 space-y-4 rounded-lg border border-moss-400 bg-moss-50 p-5">
          <p className="text-sm text-moss-800">QR generado correctamente</p>
          <p className="text-xs text-ink-400">Código corto: {result.shortCode}</p>
          <p className="break-all text-xs text-ink-400">URL destino: {result.publicUrl}</p>
          <img src={result.pngUrl} alt="Código QR generado" className="w-48 rounded-lg border border-stone-300" />
          <div className="flex gap-4 text-sm">
            <a href={result.pngUrl} target="_blank" rel="noopener noreferrer" className="text-ink-700 underline hover:text-ink-900">
              Descargar PNG
            </a>
            <a href={result.svgUrl} target="_blank" rel="noopener noreferrer" className="text-ink-700 underline hover:text-ink-900">
              Descargar SVG
            </a>
          </div>
        </div>
      )}

      <button
        onClick={handleDownloadPdf}
        disabled={pdfLoading}
        className="mt-4 block rounded-lg border border-ink-900 px-4 py-2 text-sm font-medium text-ink-900 transition hover:bg-stone-100 disabled:opacity-60"
      >
        {pdfLoading ? 'Generando PDF...' : 'Descargar PDF para imprimir'}
      </button>
      {pdfError && <p className="mt-2 text-sm text-flame-600">{pdfError}</p>}

      {result && !result.success && (
        <div className="mt-8 rounded-lg border border-flame-400 bg-white p-5">
          <p className="text-sm text-flame-600">{result.error}</p>
        </div>
      )}
    </>
  )
}
