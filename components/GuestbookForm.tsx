'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface GuestbookFormProps {
  memorialId: string;
}

export function GuestbookForm({ memorialId }: GuestbookFormProps) {
  const [content, setContent] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setStatus('sending');
    const { error } = await supabase.from('guestbook_entries').insert({
      memorial_id: memorialId,
      entry_type: 'mensaje',
      content: content.trim(),
      author_display_name: displayName.trim() || 'Anónimo',
      moderation_status: 'pendiente',
    });

    setStatus(error ? 'error' : 'sent');
    if (!error) setContent('');
  }

  if (status === 'sent') {
    return (
      <p className="text-sm text-moss">
        Gracias. Tu mensaje fue enviado y se publicará luego de ser revisado por la familia.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Tu nombre (opcional)"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        className="rounded border border-ash bg-mist px-4 py-2 text-sm"
      />
      <textarea
        placeholder="Escribe un mensaje en su memoria..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="rounded border border-ash bg-mist px-4 py-2 text-sm"
        required
      />
      <button
        type="submit"
        disabled={status === 'sending'}
        className="self-start rounded bg-flame px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {status === 'sending' ? 'Enviando...' : 'Enviar mensaje'}
      </button>
      {status === 'error' && (
        <p className="text-sm text-red-700">
          No se pudo enviar el mensaje. Intenta de nuevo en unos minutos.
        </p>
      )}
    </form>
  );
}
