import Image from "next/image";
import type { Memorial } from "@/types/database";

function formatLifespan(birth: string | null, death: string | null) {
  const y = (d: string | null) => (d ? new Date(d).getFullYear() : "—");
  return `${y(birth)} – ${y(death)}`;
}

export function MemorialHero({ memorial }: { memorial: Memorial }) {
  const person = memorial.person;

  return (
    <header className="ribbon-of-light relative pl-8 pt-16 pb-12 md:pl-16 md:pt-24">
      {memorial.cover_photo_url && (
        <div className="mb-8 h-64 w-full overflow-hidden rounded-2xl md:h-96">
          <Image
            src={memorial.cover_photo_url}
            alt={`Fotografía de ${person?.full_name ?? "la persona homenajeada"}`}
            width={1200}
            height={800}
            className="h-full w-full object-cover"
            priority
          />
        </div>
      )}

      <h1 className="text-4xl font-display leading-tight text-ink-900 dark:text-stone-50 md:text-6xl">
        {person?.full_name}
      </h1>

      <p className="mt-2 font-mono text-sm tracking-wide text-ink-400 dark:text-ash-night">
        {formatLifespan(person?.birth_date ?? null, person?.death_date ?? null)}
      </p>

      {memorial.headline && (
        <p className="mt-6 max-w-2xl font-display text-xl italic text-moss-800 dark:text-moss-400">
          "{memorial.headline}"
        </p>
      )}
    </header>
  );
}
