'use client'
 
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
 
type AccountType = 'natural' | 'funeraria'
 
export function RegisterForm() {
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/admin'
 
  const [accountType, setAccountType] = useState<AccountType>('natural')
 
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
 
  const [funerariaName, setFunerariaName] = useState('')
  const [funerariaRut, setFunerariaRut] = useState('')
  const [funerariaContactEmail, setFunerariaContactEmail] = useState('')
  const [funerariaContactPhone, setFunerariaContactPhone] = useState('')
 
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
 
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
 
    if (accountType === 'funeraria') {
      if (
        !funerariaName.trim() ||
        !funerariaRut.trim() ||
        !funerariaContactEmail.trim() ||
        !funerariaContactPhone.trim()
      ) {
        setError('Completa todos los datos de la funeraria.')
        return
      }
    }
 
    setLoading(true)
 
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          account_type: accountType,
          ...(accountType === 'funeraria'
            ? {
                funeraria_name: funerariaName.trim(),
                funeraria_rut: funerariaRut.trim(),
                funeraria_contact_email: funerariaContactEmail.trim(),
                funeraria_contact_phone: funerariaContactPhone.trim(),
              }
            : {}),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
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
          {accountType === 'funeraria' &&
            ' Tu solicitud de cuenta institucional quedará enviada apenas confirmes.'}
        </p>
      </div>
    )
  }
 
  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
      <div className="flex gap-2 rounded-lg border border-stone-300 bg-stone-100 p-1">
        <button
          type="button"
          onClick={() => setAccountType('natural')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
            accountType === 'natural' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'
          }`}
        >
          Persona natural
        </button>
        <button
          type="button"
          onClick={() => setAccountType('funeraria')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
            accountType === 'funeraria' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'
          }`}
        >
          Funeraria
        </button>
      </div>
 
      <div className="space-y-1.5">
        <label htmlFor="fullName" className="block text-sm font-medium text-stone-700">
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
        <label htmlFor="email" className="block text-sm font-medium text-stone-700">
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
        <label htmlFor="password" className="block text-sm font-medium text-stone-700">
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
 
      {accountType === 'funeraria' && (
        <div className="space-y-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
            Datos de la funeraria
          </p>
 
          <div className="space-y-1.5">
            <label htmlFor="funerariaName" className="block text-sm font-medium text-stone-700">
              Nombre de la funeraria
            </label>
            <input
              id="funerariaName"
              type="text"
              required
              value={funerariaName}
              onChange={(e) => setFunerariaName(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900 placeholder:text-stone-400 focus:border-moss-400 focus:outline-none focus:ring-1 focus:ring-moss-400"
              placeholder="Funeraria San José"
            />
          </div>
 
          <div className="space-y-1.5">
            <label htmlFor="funerariaRut" className="block text-sm font-medium text-stone-700">
              RUT de la funeraria
            </label>
            <input
              id="funerariaRut"
              type="text"
              required
              value={funerariaRut}
              onChange={(e) => setFunerariaRut(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900 placeholder:text-stone-400 focus:border-moss-400 focus:outline-none focus:ring-1 focus:ring-moss-400"
              placeholder="76.123.456-7"
            />
          </div>
 
          <div className="space-y-1.5">
            <label htmlFor="funerariaContactEmail" className="block text-sm font-medium text-stone-700">
              Correo de contacto
            </label>
            <input
              id="funerariaContactEmail"
              type="email"
              required
              value={funerariaContactEmail}
              onChange={(e) => setFunerariaContactEmail(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900 placeholder:text-stone-400 focus:border-moss-400 focus:outline-none focus:ring-1 focus:ring-moss-400"
              placeholder="contacto@funeraria.cl"
            />
          </div>
 
          <div className="space-y-1.5">
            <label htmlFor="funerariaContactPhone" className="block text-sm font-medium text-stone-700">
              Teléfono de contacto
            </label>
            <input
              id="funerariaContactPhone"
              type="tel"
              required
              value={funerariaContactPhone}
              onChange={(e) => setFunerariaContactPhone(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900 placeholder:text-stone-400 focus:border-moss-400 focus:outline-none focus:ring-1 focus:ring-moss-400"
              placeholder="+56 9 1234 5678"
            />
          </div>
        </div>
      )}
 
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
