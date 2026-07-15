import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { GuestbookForm } from '@/components/GuestbookForm';
import { Timeline } from '@/components/Timeline';
import { Gallery } from '@/components/Gallery';
import type { Metadata } from 'next';

// ISR: el contenido de un memorial cambia poco; regenerar cada hora es suficiente
// y mantiene el excelente SEO exigido en el brief sin sacrificar frescura.
export const revalidate = 3600;

interface MemorialPageProps {
  params: { slug: string };
}

// Tipos explícitos: sin un archivo de tipos generado por Supabase, el cliente
// no sabe que person_profile es una relación uno-a-uno (no un arreglo), lo que
// hace fallar el chequeo de tipos en el build. Estos tipos resuelven eso.
interface PersonProfile {
  full_name: string;
  birth_date: string | null;
  death_date: string | null;
  biography: string | null;
  favorite_quotes: string[] | null;
  main_photo_url?: string | null;
}

interface TimelineEventRow {
  id: string;
  event_date: string | null;
  title: string;
  description: string | null;
}

interface MediaAssetRow {
  id: string;
  type: 'foto' | 'video' | 'audio' | 'documento' | 'carta';
  storage_path: string;
  caption: string | null;
}

interface MemorialData {
  id: string;
  slug: string;
  visibility: string;
  person_profile: PersonProfile;
  timeline_events: TimelineEventRow[];
  media_assets: MediaAssetRow[];
}

async function getMemorial(slug: string): Promise<MemorialData | null> {
  const supabase = createSupabaseServerClient();

  const { data: memorial, error } = await supabase
    .from('memorials')
    .select(
      `
      id, slug, visibility,
      person_profile (*),
      timeline_events (*),
      media_assets (*),
      guestbook_entries!inner (*)
    `
    )
    .eq('slug', slug)
    .eq('guestbook_entries.moderation_status', 'aprobado')
    .single();

  if (error || !memorial) return null;

  // Supabase devuelve la relación uno-a-uno como arreglo de un elemento
  // cuando no hay tipos generados; la normalizamos aquí a un solo objeto.
  const rawProfile = memorial.person_profile as unknown;
  const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;

  return {
    ...memorial,
    person_profile: profile,
  } as MemorialData;
}

// Metadata dinámica: cada memorial genera sus propios meta tags, Open Graph
// y datos estructurados Schema.org, tal como exige el brief de SEO.
export async function generateMetadata({ params }: MemorialPageProps): Promise<Metadata> {
  const memorial = await getMemorial(params.slug);
  if (!memorial) return {};

  const profile = memorial.person_profile;
  const title = `${profile.full_name} · Dorsera Memorial`;
  const description = profile.biography?.slice(0, 160) ?? `En memoria de ${profile.full_name}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      images: profile.main_photo_url ? [profile.main_photo_url] : [],
    },
    other: {
      // JSON-LD se inyecta desde el componente para mantener el tipo Person de Schema.org
    },
  };
}

export default async function MemorialPage({ params }: MemorialPageProps) {
  const memorial = await getMemorial(params.slug);
  if (!memorial) notFound();

  const profile = memorial.person_profile;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.full_name,
    birthDate: profile.birth_date,
    deathDate: profile.death_date,
    description: profile.biography,
  };

  return (
    <main className="mx-auto max-w-2xl px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="text-center py-14">
        <h1 className="font-display text-4xl text-ink">{profile.full_name}</h1>
        <p className="font-mono text-sm text-moss mt-1">
          {profile.birth_date} — {profile.death_date}
        </p>
        {profile.favorite_quotes?.[0] && (
          <p className="font-display italic text-lg text-ink/85 max-w-md mx-auto mt-6">
            “{profile.favorite_quotes[0]}”
          </p>
        )}
      </section>

      <div className="relative border-l border-ash pl-8 space-y-10">
        <section>
          <h2 className="font-display text-2xl mb-3">Biografía</h2>
          <p className="text-ink/85">{profile.biography}</p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-3">Línea de tiempo</h2>
          <Timeline events={memorial.timeline_events} />
        </section>

        <section>
          <h2 className="font-display text-2xl mb-3">Galería</h2>
          <Gallery assets={memorial.media_assets} />
        </section>

        <section>
          <h2 className="font-display text-2xl mb-3">Libro de recuerdos</h2>
          <GuestbookForm memorialId={memorial.id} />
        </section>
      </div>
    </main>
  );
}
