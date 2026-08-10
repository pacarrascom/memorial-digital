'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export function RegisterForm() {
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/admin'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}${next}`,
      },
    })

    setLoading(false)

    if (error) {
      setError(
        error.message.includes('already registered')
          ? 'Ese correo ya está registrado. Intenta iniciar sesión.'
          : 'Ocurrió un error al crear la cuenta. Intenta nuevamente.'
      )
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="w-full max-w-sm space-y-3 rounded-lg border border-moss-200 bg-moss-50 p-5 text-center">
        <p className="font-medium text-moss-800">¡Cuenta creada!</p>
        <p className="text-sm text-moss-700">
          Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="fullName"
          className="block text-sm font-medium text-stone-700"
        >
          Nombre completo
        </label>
        <input
          id="fullName"
          type="text"
          required
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900 placeholder:text-stone-400 focus:border-moss-400 focus:outline-none focus:ring-1 focus:ring-moss-400"
          placeholder="María González"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-stone-700"
        >
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900 placeholder:text-stone-400 focus:border-moss-400 focus:outline-none focus:ring-1 focus:ring-moss-400"
          placeholder="tu@correo.com"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-stone-700"
        >
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900 placeholder:text-stone-400 focus:border-moss-400 focus:outline-none focus:ring-1 focus:ring-moss-400"
          placeholder="Mínimo 8 caracteres"
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
        {loading ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>
      <p className="text-center text-sm text-ink-500">
        ¿Ya tienes cuenta?{' '}
        <Link
          href={next !== '/admin' ? `/login?next=${encodeURIComponent(next)}` : '/login'}
          className="font-medium text-ink-900 underline"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  )
}
