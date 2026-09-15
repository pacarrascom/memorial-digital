'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminCreateOrganization } from '@/lib/actions/organization-request';

export function AdminCreateOrganizationForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [userEmail, setUserEmail] = useState('');
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await adminCreateOrganization(userEmail, name, rut, contactEmail, contactPhone);

    setLoading(false);

    if (!result.success) {
      setError(result.error ?? 'No se pudo crear la cuenta.');
      return;
    }

    setSuccess(true);
    setUserEmail('');
    setName('');
    setRut('');
    setContactEmail('');
    setContactPhone('');
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-8 rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-ink-700"
      >
        + Activar cuenta de funeraria para un usuario
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 space-y-4 rounded-lg border border-stone-200 bg-white p-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base text-ink-900">Activar cuenta de funeraria</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-ink-400 hover:text-ink-700"
        >
          Cerrar
        </button>
      </div>
      <p className="text-xs text-ink-500">
        El usuario debe tener ya una cuenta creada (persona natural). Se le asignará el rol de
        funeraria de inmediato, sin pasar por revisión.
      </p>

      <div className="space-y-1.5">
        <label htmlFor="userEmail" className="block text-sm font-medium text-stone-700">
          Correo del usuario
        </label>
        <input
          id="userEmail"
          type="email"
          required
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900 placeholder:text-stone-400"
          placeholder="usuario@correo.com"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="orgName" className="block text-sm font-medium text-stone-700">
          Nombre de la funeraria
        </label>
        <input
          id="orgName"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900 placeholder:text-stone-400"
          placeholder="Funeraria San José"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="orgRut" className="block text-sm font-medium text-stone-700">
          RUT (opcional)
        </label>
        <input
          id="orgRut"
          type="text"
          value={rut}
          onChange={(e) => setRut(e.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900 placeholder:text-stone-400"
          placeholder="76.123.456-7"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="orgContactEmail" className="block text-sm font-medium text-stone-700">
          Correo de contacto (opcional)
        </label>
        <input
          id="orgContactEmail"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900 placeholder:text-stone-400"
          placeholder="contacto@funeraria.cl"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="orgContactPhone" className="block text-sm font-medium text-stone-700">
          Teléfono de contacto (opcional)
        </label>
        <input
          id="orgContactPhone"
          type="tel"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900 placeholder:text-stone-400"
          placeholder="+56 9 1234 5678"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-flame-600">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-moss-700">Cuenta de funeraria creada y activada.</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Creando…' : 'Activar cuenta'}
      </button>
    </form>
  );
}
