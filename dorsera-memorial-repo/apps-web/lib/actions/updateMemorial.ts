'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type UpdateProfileResult = { success: true } | { success: false; error: string }

type UpdateProfileInput = {
  memorialId: string
  fullName: string
  birthDate?: string
  deathDate?: string
  birthPlace?: string
  biography?: string
}

export async function updateMemorialProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
  const supabase = await createClient()

  const fullName = input.fullName?.trim()
  if (!fullName) {
    return { success: false, error: 'El nombre completo es obligatorio.' }
  }

  const { error, count } = await supabase
    .from('person_profile')
    .update(
      {
        full_name: fullName,
        birth_date: input.birthDate || null,
        death_date: input.deathDate || null,
        birth_place: input.birthPlace?.trim() || null,
        biography: input.biography?.trim() || null,
      },
      { count: 'exact' }
    )
    .eq('memorial_id', input.memorialId)

  if (error) {
    return { success: false, error: `No se pudo actualizar: ${error.message}` }
  }

  if (count === 0) {
    return { success: false, error: 'No tienes permiso para editar este memorial.' }
  }

  revalidatePath(`/admin`)
  revalidatePath(`/m`)

  return { success: true }
}
