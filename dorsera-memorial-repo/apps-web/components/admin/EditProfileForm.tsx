'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateMemorialProfile } from '@/lib/actions/updateMemorial'

type Props = {
  memorialId: string
  slug: string
  initial: {
    full_name: string
    birth_date: string | null
    death_date: string | null
    birth_place: string | null
    biography: string | null
  }
}

export function EditProfileForm({ memorialId, slug, initial }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await updateMemorialProfile({
      memorialId,
      fullName: formData.get('full_name') as string,
      birthDate: (formData.get('birth_date') as string) || undefined,
      deathDate: (formData.get('death_date') as string) || undefined,
      birthPlace: (formData.get('birth_place') as string) || undefined,
      biography: (formData.get('biography') as string) || undefined,
    })

    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setSuccess(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="full_name" className="block text-sm font-medium text-stone-700">
          Nombre completo *
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          defaultValue={initial.full_name}
          className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900 focus:border-moss-400 focus:outline-none focus:ring-1 focus:ring-moss-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="birth_date" className="block text-sm font-medium text-stone-700">
            Fecha de nacimiento
          </label>
          <input
            id="birth_date"
            name="birth_date"
            type="date"
            defaultValue={initial.birth_date ?? ''}
            className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900 focus:border-moss-400 focus:outline-none focus:ring-1 focus:ring-moss-400"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="death_date" className="block text-sm font-medium text-stone-700">
            Fecha de fallecimiento
          </label>
          <input
            id="death_date"
            name="death_date"
            type="date"
            defaultValue={initial.death_date ?? ''}
            className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900 focus:border-moss-400 focus:outline-none focus:ring-1 focus:ring-moss-400"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="birth_place" className="block text-sm font-medium text-stone-700">
          Lugar de nacimiento
        </label>
        <input
          id="birth_place"
          name="birth_place"
          type="text"
          defaultValue={initial.birth_place ?? ''}
          className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900 focus:border-moss-400 focus:outline-none focus:ring-1 focus:ring-moss-400"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="biography" className="block text-sm font-medium text-stone-700">
          Biografía
        </label>
        <textarea
          id="biography"
          name="biography"
          rows={5}
          defaultValue={initial.biography ?? ''}
          className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900 focus:border-moss-400 focus:outline-none focus:ring-1 focus:ring-moss-400"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-flame-600">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-moss-800">
          Guardado. <a href={`/m/${slug}`} target="_blank">Ver la página pública</a>
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-ink-900 px-4 py-2.5 font-medium text-white transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}
