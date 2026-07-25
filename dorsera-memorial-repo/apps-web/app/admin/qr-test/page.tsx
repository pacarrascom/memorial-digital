'use client'

import { useState } from 'react'
import { generateQrCode } from '@/lib/actions/qr'

const TEST_MEMORIAL_ID = '9786faef-6288-486d-89cb-1ca04b8a2161'

export default function QrTestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<
    | { success: true; pngUrl: string; svgUrl: string; shortCode: string; publicUrl: string }
    | { success: false; error: string }
    | null
  >(null)

  async function handleGenerate() {
    setLoading(true)
    setResult(null)
    const res = await generateQrCode(TEST_MEMORIAL_ID)
    setResult(res)
    setLoading(false)
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="mb-2 font-display text-2xl text-ink-900">Prueba de generación de QR</h1>
      <p className="mb-8 text-sm text-ink-400">
        Memorial de prueba: <code>maria-gonzalez-test</code>
      </p>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="rounded-lg bg-ink-900 px-4 py-2.5 font-medium text-white transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Generando…' : 'Generar código QR'}
      </button>

      {result && result.success && (
        <div className="mt-8 space-y-4 rounded-lg border border-moss-400 bg-moss-50 p-5">
          <p className="text-sm text-moss-800">QR generado correctamente</p>
          <p className="text-xs text-ink-400">Código corto: {result.shortCode}</p>
          <p className="break-all text-xs text-ink-400">URL destino: {result.publicUrl}</p>
          <img src={result.pngUrl} alt="Código QR generado" className="w-48 rounded-lg border border-stone-300" />
          <div className="flex gap-3 text-sm">
            <a href={result.pngUrl} target="_blank">Ver PNG</a>
            <a href={result.svgUrl} target="_blank">Ver SVG</a>
          </div>
        </div>
      )}

      {result && !result.success && (
        <div className="mt-8 rounded-lg border border-flame-400 bg-white p-5">
          <p className="text-sm text-flame-600">{result.error}</p>
        </div>
      )}
    </main>
  )
}
