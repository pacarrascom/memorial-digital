import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { OrgMemorialForm } from '@/components/admin/OrgMemorialForm';

export default async function NewOrgMemorialPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', orgId)
    .maybeSingle();

  if (!org) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700"
      >
        ← Volver al panel
      </Link>

      <h1 className="mb-1 font-display text-2xl text-ink-900">
        Crear memorial
      </h1>
      <p className="mb-6 text-sm text-ink-500">para {org.name}</p>

      <OrgMemorialForm organizationId={org.id} />
    </main>
  );
}
