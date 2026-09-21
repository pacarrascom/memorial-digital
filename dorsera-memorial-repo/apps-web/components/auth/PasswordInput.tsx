'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  required,
  minLength,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  placeholder?: string
  required?: boolean
  minLength?: number
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 pr-11 text-ink-900 placeholder:text-stone-400 focus:border-moss-400 focus:outline-none focus:ring-1 focus:ring-moss-400"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-stone-400 transition-colors hover:text-stone-600"
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}
