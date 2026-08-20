'use client';
 
import { useState, useTransition } from 'react';
import { approveOrganization, rejectOrganization } from '@/lib/actions/organization-request';
 
type OrgRequest = {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  rut: string | null;
  status: string;
  requested_at: string;
};
 
export function OrganizationApprovalList({ initialRequests }: { initialRequests: OrgRequest[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
 
  function handleDecision(id: string, decision: 'aprobar' | 'rechazar') {
    setError(null);
    startTransition(async () => {
      const result = decision === 'aprobar'
        ? await approveOrganization(id)
        : await rejectOrganization(id);
 
      if (result?.error) {
        setError(result.error);
        return;
      }
 
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: decision === 'aprobar' ? 'aprobada' : 'rechazada' } : r))
      );
    });
  }
 
  const pending = requests.filter((r) => r.status === 'pendiente');
  const resolved = requests.filter((r) => r.status !== 'pendiente');
 
  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-flame-200 bg-flame-50 px-4 py-3 text-sm text-flame-700">
          {error}
        </div>
      )}
 
      <section>
        <h2 className="mb-3 font-display text-lg text-ink-900">
          Pendientes {pending.length > 0 && `(${pending.length})`}
        </h2>
 
        {pending.length === 0 ? (
          <p className="text-sm text-ink-400">No hay solicitudes pendientes.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((r) => (
              <li key={r.id} className="rounded-lg border border-stone-200 bg-white p-4">
                <p className="font-display text-base text-ink-900">{r.name}</p>
                <div className="mt-1 space-y-0.5 text-xs text-ink-400">
                  {r.rut && <p>RUT: {r.rut}</p>}
                  {r.contact_email && <p>{r.contact_email}</p>}
                  {r.contact_phone && <p>{r.contact_phone}</p>}
                  <p className="font-mono">Solicitado el {new Date(r.requested_at).toLocaleDateString('es-CL')}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleDecision(r.id, 'aprobar')}
                    disabled={isPending}
                    className="rounded-lg bg-moss-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-moss-700 disabled:opacity-50"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleDecision(r.id, 'rechazar')}
                    disabled={isPending}
                    className="rounded-lg border border-stone-300 px-4 py-1.5 text-xs font-medium text-ink-600 hover:bg-stone-50 disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
 
      {resolved.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg text-ink-900">Resueltas</h2>
          <ul className="space-y-2">
            {resolved.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-stone-200 bg-white p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{r.name}</p>
                    <div className="mt-0.5 space-y-0.5 text-xs text-ink-400">
                      {r.rut && <p>RUT: {r.rut}</p>}
                      {r.contact_email && <p>{r.contact_email}</p>}
                      {r.contact_phone && <p>{r.contact_phone}</p>}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.status === 'aprobada' ? 'bg-moss-600/10 text-moss-800' : 'bg-flame-600/10 text-flame-600'
                    }`}
                  >
                    {r.status === 'aprobada' ? 'Aprobada' : 'Rechazada'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
