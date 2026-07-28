import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { TimelineManager } from '@/components/timeline/TimelineManager';

export default async function TimelinePage({
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

  const { data: canEdit } = await supabase.rpc('has_memorial_role', {
    p_memorial_id: memorialId,
    p_roles: ['admin_familiar', 'colaborador_familiar'],
  });

  const { data: person } = await supabase
    .from('person_profile')
    .select('full_name')
    .eq('memorial_id', memorialId)
    .maybeSingle();

  if (!person) {
    notFound();
  }

  const { data: events } = await supabase
    .from('timeline_events')
    .select('*')
    .eq('memorial_id', memorialId)
    .order('event_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

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
          <h1 className="font-display text-2xl text-ink-900">Línea de tiempo</h1>
          <p className="mt-1 text-sm text-ink-500">{person.full_name}</p>
        </div>

        <TimelineManager
          memorialId={memorialId}
          initialEvents={events ?? []}
          canEdit={Boolean(canEdit)}
        />
      </div>
    </main>
  );
}
