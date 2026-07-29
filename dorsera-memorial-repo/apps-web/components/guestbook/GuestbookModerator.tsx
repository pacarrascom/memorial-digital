'use client';

import { useState, useTransition } from 'react';
import { moderateGuestbookEntry } from '@/lib/actions/guestbook';

type GuestbookEntry = {
  id: string;
  author_display_name: string | null;
  entry_type: string;
  content: string;
  moderation_status: 'pendiente' | 'aprobado' | 'rechazado';
  created_at: string;
};

const statusStyles: Record<string, string> = {
  pendiente: 'bg-stone-300 text-ink-700',
  aprobado: 'bg-moss-600/10 text-moss-800',
  rechazado: 'bg-flame-600/10 text-flame-600',
};

const statusLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

export function GuestbookModerator({
  memorialId,
  initialEntries,
}: {
  memorialId: string;
  initialEntries: GuestbookEntry[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleModerate(entryId: string, status: 'aprobado' | 'rechazado') {
    setError(null);
    setPendingId(entryId);
    startTransition(async () => {
      const result = await moderateGuestbookEntry(entryId, memorialId, status);
      if (result?.error) {
        setError(result.error);
        setPendingId(null);
        return;
      }
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, moderation_status: status } : e))
      );
      setPendingId(null);
    });
  }

  const pending = entries.filter((e) => e.moderation_status === 'pendiente');
  const resolved = entries.filter((e) => e.moderation_status !== 'pendiente');

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-flame-200 bg-flame-50 px-4 py-3 text-sm text-flame-700">
          {error}
        </div>
      )}

      <section>
        <h2 className="mb-3 font-display text-lg text-ink-900">
          Pendientes de revisión {pending.length > 0 && `(${pending.length})`}
        </h2>

        {pending.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-ink-400">
            No hay mensajes esperando revisión.
          </p>
        ) : (
          <ul className="space-y-3">
            {pending.map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm text-ink-900">
                      {entry.author_display_name || 'Anónimo'}
                    </p>
                    <p className="font-mono text-xs text-ink-400">
                      {new Date(entry.created_at).toLocaleDateString('es-CL', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="mt-2 text-sm text-ink-700">{entry.content}</p>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleModerate(entry.id, 'aprobado')}
                    disabled={isPending && pendingId === entry.id}
                    className="rounded-lg bg-moss-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-moss-700 disabled:opacity-50"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleModerate(entry.id, 'rechazado')}
                    disabled={isPending && pendingId === entry.id}
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
          <h2 className="mb-3 font-display text-lg text-ink-900">Ya revisados</h2>
          <ul className="space-y-2">
            {resolved.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-stone-200 bg-white p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink-900">
                    <span className="font-medium">{entry.author_display_name || 'Anónimo'}</span>{' '}
                    <span className="text-ink-500">— {entry.content}</span>
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[entry.moderation_status]}`}
                >
                  {statusLabels[entry.moderation_status]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
