'use server';
 
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
 
export async function createMemorialForOrg(
  organizationId: string,
  input: {
    fullName: string;
    birthDate?: string | null;
    deathDate?: string | null;
    birthPlace?: string | null;
    biography?: string | null;
    familyContactName?: string | null;
    familyContactEmail?: string | null;
    familyContactPhone?: string | null;
  }
) {
  const supabase = await createClient();
 
  const { data, error } = await supabase.rpc('create_memorial_for_org', {
    p_organization_id: organizationId,
    p_full_name: input.fullName,
    p_birth_date: input.birthDate || null,
    p_death_date: input.deathDate || null,
    p_birth_place: input.birthPlace || null,
    p_biography: input.biography || null,
    p_family_contact_name: input.familyContactName || null,
    p_family_contact_email: input.familyContactEmail || null,
    p_family_contact_phone: input.familyContactPhone || null,
  });
 
  if (error) {
    console.error('createMemorialForOrg error:', error);
    return { error: 'No se pudo crear el memorial. Verifica que tengas permisos en esta organización.' };
  }
 
  revalidatePath('/admin');
  return { success: true, memorial: data?.[0] };
}
