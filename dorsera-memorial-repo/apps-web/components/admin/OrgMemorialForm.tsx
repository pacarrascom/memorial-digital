'use client';
 
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createMemorialForOrg } from '@/lib/actions/organization';
 
export function OrgMemorialForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
 
  function handleSubmit(formData: FormData) {
    const fullName = String(formData.get('fullName') || '').trim();
    if (!fullName) {
      setError('El nombre completo es obligatorio.');
      return;
    }
 
    setError(null);
    startTransition(async () => {
      const result = await createMemorialForOrg(organizationId, {
        fullName,
        birthDate: String(formData.get('birthDate') || ''),
        deathDate: String(formData.get('deathDate') || ''),
        birthPlace: String(formData.get('birthPlace') || ''),
        biography: String(formData.get('biography') || ''),
        familyContactName: String(formData.get('familyContactName') || ''),
        familyContactEmail: String(formData.get('familyContactEmail') || ''),
        familyContactPhone: String(formData.get('familyContactPhone') || ''),
      });
 
      if (result?.error) {
        setError(result.error);
        return;
      }
 
      router.push('/admin');
    });
  }
 
  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-flame-200 bg-flame-50 px-4 py-3 text-sm text-flame-700">
          {error}
        </div>
      )}
 
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-500">Nombre completo</label>
        <input
          type="text"
          name="fullName"
          required
          placeholder="María González"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-ink-900"
        />
      </div>
 
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-500">Fecha de nacimiento</label>
          <input
            type="date"
            name="birthDate"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-ink-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-500">Fecha de fallecimiento</label>
          <input
            type="date"
            name="deathDate"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-ink-900"
          />
        </div>
      </div>
 
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-500">Lugar de nacimiento (opcional)</label>
        <input
          type="text"
          name="birthPlace"
          placeholder="Santiago, Chile"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-ink-900"
        />
      </div>
 
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-500">Biografía breve (opcional)</label>
        <textarea
          name="biography"
          rows={4}
          placeholder="Una breve reseña de su vida..."
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-ink-900"
        />
      </div>
 
      <div className="space-y-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
          Familiar que solicita el memorial
        </p>
 
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-500">Nombre del familiar</label>
          <input
            type="text"
            name="familyContactName"
            placeholder="Juan Pérez"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-ink-900"
          />
        </div>
 
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-500">Correo del familiar</label>
          <input
            type="email"
            name="familyContactEmail"
            placeholder="familiar@correo.com"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-ink-900"
          />
        </div>
 
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-500">Teléfono del familiar</label>
          <input
            type="tel"
            name="familyContactPhone"
            placeholder="+56 9 1234 5678"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-ink-900"
          />
        </div>
      </div>
 
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-ink-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-ink-700 disabled:opacity-50"
      >
        {isPending ? 'Creando...' : 'Crear memorial'}
      </button>
    </form>
  );
}
