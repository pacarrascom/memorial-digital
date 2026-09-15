'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserMinus, UserPlus } from 'lucide-react';
import {
  inviteCollaborator,
  removeCollaborator,
  type Collaborator,
} from '@/lib/actions/collaborators';

type Props = {
  memorialId: string;
  initialCollaborators: Collaborator[];
  collaboratorLimit: number;
  loadError: string | null;
};

const roleLabels: Record<Collaborator['role_name'], string> = {
  admin_familiar: 'Dueño',
  colaborador_familiar: 'Colaborador',
};

export function CollaboratorsManager({
  memorialId,
  initialCollaborators,
  collaboratorLimit,
  loadError,
}: Props) {
  const router = useRouter();
  const [collaborators, setCollaborators] = useState(initialCollaborators);
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(loadError);

  const activeCount = collaborators.filter((c) => c.role_name === 'colaborador_familiar').length;
  const atLimit = activeCount >= collaboratorLimit;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInviting(true);

    const result = await inviteCollaborator(memorialId, email);

    setInviting(false);

    if (!result.success) {
      setError(result.error ?? 'No se pudo invitar al colaborador.');
      return;
    }

    setEmail('');
    router.refresh();
  }

  async function handleRemove(userId: string) {
    setError(null);
    setRemovingId(userId);

    const result = await removeCollaborator(memorialId, userId);

    setRemovingId(null);

    if (!result.success) {
      setError(result.error ?? 'No se pudo quitar al colaborador.');
      return;
    }

    setCollaborators((prev) => prev.filter((c) => c.user_id !== userId));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base text-ink-900">Con acceso a este memorial</h2>
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-ink-600">
            {activeCount} de {collaboratorLimit} colaborador{collaboratorLimit === 1 ? '' : 'es'}
          </span>
        </div>

        <ul className="mt-4 space-y-2">
          {collaborators.map((c) => (
            <li
              key={c.user_id}
              className="flex items-center justify-between gap-3 rounded-lg border border-stone-100 bg-stone-50 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-ink-900">{c.email}</p>
                <span
                  className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    c.role_name === 'admin_familiar'
                      ? 'bg-moss-600/10 text-moss-800'
                      : 'bg-ink-900/5 text-ink-600'
                  }`}
                >
                  {roleLabels[c.role_name]}
                </span>
              </div>

              {c.role_name === 'colaborador_familiar' && (
                <button
                  onClick={() => handleRemove(c.user_id)}
                  disabled={removingId === c.user_id}
                  aria-label={`Quitar a ${c.email}`}
                  className="shrink-0 rounded-md p-2 text-ink-400 transition hover:bg-flame-600/10 hover:text-flame-600 disabled:opacity-50"
                >
                  <UserMinus size={16} strokeWidth={1.75} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="mb-1 font-display text-base text-ink-900">Invitar colaborador</h2>
        <p className="mb-4 text-sm text-ink-500">
          La persona debe tener ya una cuenta creada. Podrá editar la galería, la línea de tiempo
          y el resto del contenido de este memorial.
        </p>

        {atLimit ? (
          <p className="rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-ink-500">
            Ya alcanzaste el límite de {collaboratorLimit} colaborador
            {collaboratorLimit === 1 ? '' : 'es'} para este memorial.
          </p>
        ) : (
          <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colaborador@correo.com"
              className="flex-1 rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-ink-900 placeholder:text-stone-400 focus:border-moss-400 focus:outline-none focus:ring-1 focus:ring-moss-400"
            />
            <button
              type="submit"
              disabled={inviting}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserPlus size={16} strokeWidth={1.75} />
              {inviting ? 'Invitando…' : 'Invitar'}
            </button>
          </form>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm text-flame-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
