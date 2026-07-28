'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { generateQrCode } from '@/lib/actions/qr'

export default function MemorialQrPage() {
  const params = useParams<{ id: string }>()
  const memorialId = params.id

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<
    | { success: true; pngUrl: string; svgUrl: string; shortCode: string; publicUrl: string }
    | { success: false; error: string }
    | null
  >(null)

  async function handleGenerate() {
    setLoading(true)
    setResult(null)
    const res = await generateQrCode(memorialId)
    setResult(res)
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-8 font-display text-2xl text-ink-900 dark:text-stone-50">
        Código QR del memorial
      </h1>

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
            <a href={result.pngUrl} target="_blank">Descargar PNG</a>
            <a href={result.svgUrl} target="_blank">Descargar SVG</a>
          </div>
        </div>
      )}

      {result && !result.success && (
        <div className="mt-8 rounded-lg border border-flame-400 bg-white p-5">
          <p className="text-sm text-flame-600">{result.error}</p>
        </div>
      )}
    </div>
  )
}
