import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Memorial, TimelineEvent, MediaItem, Tribute } from "@/types/database";
import { MemorialHero } from "@/components/memorial/MemorialHero";
import { Timeline } from "@/components/memorial/Timeline";
import { Gallery } from "@/components/memorial/Gallery";
import { TributeBook } from "@/components/memorial/TributeBook";

// ISR: la página se sirve como estática y se revalida cada 5 minutos.
// La mayoría del tráfico viene de escaneos de QR — no necesita ser realtime.
export const revalidate = 300;

type PageProps = { params: Promise<{ slug: string }> };

async function getMemorial(slug: string) {
  const supabase = await createClient();

  // Importante: NO usar !inner en las relaciones opcionales (tributes, media_items).
  // Un memorial nuevo sin tributos o sin fotos debe seguir apareciendo —
  // un !inner aquí produce un 404 falso (bug ya documentado en el proyecto).
  const { data, error } = await supabase
    .from("memorials")
    .select(
      `
      *,
      person:persons(*),
      media_items(*),
      timeline_events(*, cover_media:media_items(*)),
      tributes(*)
    `
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as Memorial & {
    media_items: MediaItem[];
    timeline_events: TimelineEvent[];
    tributes: Tribute[];
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const memorial = await getMemorial(slug);
  if (!memorial) return {};

  const name = memorial.person?.full_name ?? "Memorial";
  const description =
    memorial.headline ?? `Memorial digital en honor a ${name}. Comparte recuerdos y fotografías.`;

  return {
    title: name,
    description,
    openGraph: {
      title: name,
      description,
      images: memorial.cover_photo_url ? [memorial.cover_photo_url] : [],
      type: "profile",
    },
    alternates: { canonical: `/m/${slug}` },
  };
}

export default async function MemorialPage({ params }: PageProps) {
  const { slug } = await params;
  const memorial = await getMemorial(slug);

  if (!memorial) notFound();

  const approvedTributes = (memorial.tributes ?? []).filter((t) => t.status === "approved");
  const sortedEvents = [...(memorial.timeline_events ?? [])].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );

  // Schema.org (Person) para SEO — inyectado como JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: memorial.person?.full_name,
    birthDate: memorial.person?.birth_date ?? undefined,
    deathDate: memorial.person?.death_date ?? undefined,
    birthPlace: memorial.person?.birth_place ?? undefined,
    description: memorial.headline ?? undefined,
  };

  return (
    <main className="mx-auto max-w-3xl">
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <MemorialHero memorial={memorial} />

      {memorial.biography && (
        <section className="px-8 py-10 md:px-16">
          <h2 className="mb-4 text-2xl font-display text-ink-900 dark:text-stone-50">
            Historia de vida
          </h2>
          <p className="max-w-2xl whitespace-pre-line text-ink-700 dark:text-stone-100">
            {memorial.biography}
          </p>
        </section>
      )}

      <Timeline events={sortedEvents} />
      <Gallery items={memorial.media_items ?? []} />
      <TributeBook memorialId={memorial.id} initialTributes={approvedTributes} />
    </main>
  );
}
