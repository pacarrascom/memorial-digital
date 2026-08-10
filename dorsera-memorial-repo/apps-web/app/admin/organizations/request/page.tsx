import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { OrganizationRequestForm } from '@/components/admin/OrganizationRequestForm';

export default async function RequestOrganizationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?next=/admin/organizations/request');
  }

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700"
      >
        ← Volver al panel
      </Link>

      <h1 className="mb-1 font-display text-2xl text-ink-900">
        Solicitar cuenta de funeraria
      </h1>
      <p className="mb-6 text-sm text-ink-500">
        Para gestionar memoriales de tus clientes en un solo panel.
      </p>

      <OrganizationRequestForm />
    </main>
  );
}
