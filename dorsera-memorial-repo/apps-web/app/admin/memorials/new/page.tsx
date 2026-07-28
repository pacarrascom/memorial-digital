'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMemorial } from '@/lib/actions/memorial'

export default function NewMemorialPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createMemorial({
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

    router.push(`/m/${result.slug}`)
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <a href="/admin" className="mb-4 inline-block text-sm text-ink-400 hover:text-ink-700">
        ← Volver al panel
      </a>
      <h1 className="mb-2 font-display text-2xl text-ink-900">Crear un memorial</h1>
      <p className="mb-8 text-sm text-ink-400">
        Solo necesitas el nombre para empezar — puedes completar el resto después.
      </p>

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
            className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900 placeholder:text-stone-400 focus:border-moss-400 focus:outline-none focus:ring-1 focus:ring-moss-400"
            placeholder="María González"
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
            className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900 placeholder:text-stone-400 focus:border-moss-400 focus:outline-none focus:ring-1 focus:ring-moss-400"
            placeholder="Santiago, Chile"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="biography" className="block text-sm font-medium text-stone-700">
            Biografía breve
          </label>
          <textarea
            id="biography"
            name="biography"
            rows={4}
            className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900 placeholder:text-stone-400 focus:border-moss-400 focus:outline-none focus:ring-1 focus:ring-moss-400"
            placeholder="Una vida dedicada a..."
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
          className="w-full rounded-lg bg-ink-900 px-4 py-2.5 font-medium text-white transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Creando…' : 'Crear memorial'}
        </button>
      </form>
    </main>
  )
}
