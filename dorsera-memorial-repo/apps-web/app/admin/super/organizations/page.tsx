import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { OrganizationApprovalList } from '@/components/admin/OrganizationApprovalList';
 
export default async function SuperAdminOrganizationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
 
  const { data: isSuperAdmin } = await supabase.rpc('is_super_admin');
 
  if (!isSuperAdmin) {
    redirect('/admin');
  }
 
  const { data: requests } = await supabase
    .from('organizations')
    .select('id, name, contact_email, contact_phone, rut, status, requested_at')
    .not('requested_by', 'is', null)
    .order('requested_at', { ascending: false });
 
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700"
      >
        ← Volver al panel
      </Link>
 
      <h1 className="mb-6 font-display text-2xl text-ink-900">
        Solicitudes de funerarias
      </h1>
 
      <OrganizationApprovalList initialRequests={requests ?? []} />
    </main>
  );
}
