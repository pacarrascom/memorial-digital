import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { GuestbookModerator } from '@/components/guestbook/GuestbookModerator';

export default async function GuestbookModerationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: memorialId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: person } = await supabase
    .from('person_profile')
    .select('full_name')
    .eq('memorial_id', memorialId)
    .maybeSingle();

  if (!person) {
    notFound();
  }

  const { data: entries } = await supabase
    .from('guestbook_entries')
    .select('id, author_display_name, entry_type, content, moderation_status, created_at')
    .eq('memorial_id', memorialId)
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700"
        >
          ← Volver al panel
        </Link>

        <div className="mb-6">
          <h1 className="font-display text-2xl text-ink-900">Libro de recuerdos</h1>
          <p className="mt-1 text-sm text-ink-500">{person.full_name}</p>
        </div>

        <GuestbookModerator memorialId={memorialId} initialEntries={entries ?? []} />
      </div>
    </main>
  );
}
