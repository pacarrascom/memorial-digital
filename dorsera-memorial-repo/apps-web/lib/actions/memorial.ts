'use server'

import { createClient } from '@/lib/supabase/server'

type CreateMemorialResult =
  | { success: true; slug: string }
  | { success: false; error: string }

type CreateMemorialInput = {
  fullName: string
  birthDate?: string
  deathDate?: string
  birthPlace?: string
  biography?: string
}

export async function createMemorial(input: CreateMemorialInput): Promise<CreateMemorialResult> {
  const supabase = await createClient()

  const fullName = input.fullName?.trim()
  if (!fullName) {
    return { success: false, error: 'El nombre completo es obligatorio.' }
  }

  const { data, error } = await supabase.rpc('create_memorial', {
    p_full_name: fullName,
    p_birth_date: input.birthDate || null,
    p_death_date: input.deathDate || null,
    p_birth_place: input.birthPlace?.trim() || null,
    p_biography: input.biography?.trim() || null,
  })

  if (error) {
    return { success: false, error: `No se pudo crear el memorial: ${error.message}` }
  }

  const created = Array.isArray(data) ? data[0] : data
  if (!created?.slug) {
    return { success: false, error: 'El memorial se creó pero no se pudo obtener su URL.' }
  }

  return { success: true, slug: created.slug }
}
