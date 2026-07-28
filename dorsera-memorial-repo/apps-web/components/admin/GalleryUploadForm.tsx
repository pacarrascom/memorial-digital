'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadMemorialPhoto } from '@/lib/actions/uploadPhoto'

type ExistingPhoto = { id: string; storage_path: string; caption: string | null }

type Props = {
  memorialId: string
  existingPhotos: ExistingPhoto[]
}

export function GalleryUploadForm({ memorialId, existingPhotos }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await uploadMemorialPhoto(memorialId, formData)

    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setPreview(null)
    ;(e.target as HTMLFormElement).reset()
    router.refresh()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setPreview(URL.createObjectURL(file))
    } else {
      setPreview(null)
    }
  }

  return (
    <div className="space-y-10">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="file" className="block text-sm font-medium text-stone-700">
            Foto *
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            required
            onChange={handleFileChange}
            className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900"
          />
        </div>

        {preview && (
          <img src={preview} alt="Vista previa" className="h-48 w-48 rounded-lg object-cover border border-stone-300" />
        )}

        <div className="space-y-1.5">
          <label htmlFor="caption" className="block text-sm font-medium text-stone-700">
            Descripción (opcional)
          </label>
          <input
            id="caption"
            name="caption"
            type="text"
            placeholder="En el jardín de la casa, 1980"
            className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900 placeholder:text-stone-400"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-flame-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-ink-900 px-4 py-2.5 font-medium text-white transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Subiendo…' : 'Subir foto'}
        </button>
      </form>

      <div>
        <h2 className="mb-4 font-display text-lg text-ink-900">
          Fotos actuales ({existingPhotos.length})
        </h2>
        {existingPhotos.length === 0 ? (
          <p className="text-sm text-ink-400">Aún no hay fotos.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {existingPhotos.map((photo) => (
              <div key={photo.id}>
                <img
                  src={photo.storage_path}
                  alt={photo.caption ?? ''}
                  className="aspect-square w-full rounded-lg object-cover border border-stone-300"
                />
                {photo.caption && <p className="mt-1 text-xs text-ink-400">{photo.caption}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
