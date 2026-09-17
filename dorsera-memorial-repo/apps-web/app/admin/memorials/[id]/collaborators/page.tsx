import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { listCollaborators } from '@/lib/actions/collaborators';
import { CollaboratorsManager } from '@/components/admin/CollaboratorsManager';

export default async function CollaboratorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: memorialId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: canManage } = await supabase.rpc('can_manage_memorial_collaborators', {
    p_memorial_id: memorialId,
  });
  if (!canManage) {
    redirect('/admin');
  }

  const { data: memorial } = await supabase
    .from('memorials')
    .select('id, collaborator_limit, person_profile(full_name)')
    .eq('id', memorialId)
    .maybeSingle();

  if (!memorial) {
    notFound();
  }

  const { data: collaborators, error } = await listCollaborators(memorialId);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700"
      >
        ← Volver al panel
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-2xl text-ink-900">Colaboradores</h1>
        <p className="mt-1 text-sm text-ink-500">
          {(memorial as any).person_profile?.full_name ?? 'Memorial'}
        </p>
      </div>

      <CollaboratorsManager
        memorialId={memorialId}
        initialCollaborators={collaborators ?? []}
        collaboratorLimit={memorial.collaborator_limit}
        loadError={error}
      />
    </div>
  );
}
