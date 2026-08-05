'use client';

import { useState, useTransition } from 'react';
import { requestOrganization } from '@/lib/actions/organization-request';

export function OrganizationRequestForm() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();

    if (!name) {
      setError('El nombre de la funeraria es obligatorio.');
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await requestOrganization(name, email);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-moss-400 bg-moss-600/10 p-5">
        <p className="text-sm text-moss-800">
          Tu solicitud fue enviada. Un administrador la revisará y te notificaremos
          cuando esté activa.
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-flame-200 bg-flame-50 px-4 py-3 text-sm text-flame-700">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-500">
          Nombre de la funeraria
        </label>
        <input
          type="text"
          name="name"
          required
          placeholder="Funeraria San José"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-ink-900"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-500">
          Correo de contacto (opcional)
        </label>
        <input
          type="email"
          name="email"
          placeholder="contacto@funeraria.cl"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-ink-900"
        />
      </div>

      <p className="text-xs text-ink-400">
        Esta es una cuenta institucional de pago. Al enviar tu solicitud, un administrador
        la revisará y se pondrá en contacto contigo para completar la activación.
      </p>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-ink-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-ink-700 disabled:opacity-50"
      >
        {isPending ? 'Enviando...' : 'Enviar solicitud'}
      </button>
    </form>
  );
}
