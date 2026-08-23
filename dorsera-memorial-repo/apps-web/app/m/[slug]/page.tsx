import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Memorial, TimelineEvent, MediaItem, Tribute } from "@/types/database";
import { MemorialHero } from "@/components/memorial/MemorialHero";
import { Timeline } from "@/components/memorial/Timeline";
import { Gallery } from "@/components/memorial/Gallery";
import { TributeBook } from "@/components/memorial/TributeBook";
import { ShareQrSection } from "@/components/memorial/ShareQrSection";
 
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
      person:person_profile(*),
      media_items:media_assets(*),
      timeline_events(*, media_assets(*)),
      tributes:guestbook_entries(*),
      qr_codes(png_path, public_url)
    `
    )
    .eq("slug", slug)
    .eq("visibility", "publico")
    .maybeSingle();
 
  if (error || !data) return null;
 
  const mediaItems = (data.media_items ?? []) as (MediaItem & { is_cover?: boolean })[];
  const coverPhoto = mediaItems.find((m) => m.is_cover);
 
  return {
    ...(data as unknown as Memorial),
    media_items: mediaItems,
    timeline_events: data.timeline_events as TimelineEvent[],
    tributes: data.tributes as Tribute[],
    cover_photo_url: coverPhoto?.storage_path ?? null,
    qr: Array.isArray(data.qr_codes) ? data.qr_codes[0] : data.qr_codes,
  };
}
 
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const memorial = await getMemorial(slug);
  if (!memorial) return {};
 
  const name = memorial.person?.full_name ?? "Memorial";
  const description =
    memorial.person?.biography ?? `Memorial digital en honor a ${name}. Comparte recuerdos y fotografías.`;
 
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
 
  const approvedTributes = (memorial.tributes ?? []).filter((t) => t.moderation_status === "aprobado");
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
    description: memorial.person?.biography ?? undefined,
  };
 
  return (
    <main className="mx-auto max-w-3xl">
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
 
      <MemorialHero memorial={memorial as unknown as Memorial} />
 
      {memorial.person?.biography && (
        <section className="px-8 py-10 md:px-16">
          <h2 className="mb-4 text-2xl font-display text-ink-900 dark:text-stone-50">
            Historia de vida
          </h2>
          <p className="max-w-2xl whitespace-pre-line text-ink-700 dark:text-stone-100">
            {memorial.person.biography}
          </p>
        </section>
      )}
 
      <Timeline events={sortedEvents} />
      <Gallery items={memorial.media_items ?? []} />
 
      {memorial.qr?.png_path && (
        <ShareQrSection pngUrl={memorial.qr.png_path} publicUrl={memorial.qr.public_url} />
      )}
 
      <TributeBook
        memorialId={memorial.id}
        initialTributes={approvedTributes}
        personName={memorial.person?.full_name}
      />
    </main>
  );
}
