import Image from "next/image";
import type { MediaItem } from "@/types/database";

const typeLabels: Record<string, string> = {
  photo: "Fotografías",
  video: "Videos",
  audio: "Audios",
  letter: "Cartas",
  document: "Documentos",
};

export function Gallery({ items }: { items: MediaItem[] }) {
  if (items.length === 0) return null;

  const grouped = items.reduce<Record<string, MediaItem[]>>((acc, item) => {
    (acc[item.type] ??= []).push(item);
    return acc;
  }, {});

  return (
    <section aria-labelledby="gallery-heading" className="px-8 py-16 md:px-16">
      <h2 id="gallery-heading" className="mb-10 text-2xl font-display text-ink-900 dark:text-stone-50">
        Galería
      </h2>

      {Object.entries(grouped).map(([type, media]) => (
        <div key={type} className="mb-10">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-ink-400 dark:text-ash-night">
            {typeLabels[type] ?? type}
          </h3>

          {type === "photo" ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {media.map((m) => (
                <div key={m.id} className="aspect-square overflow-hidden rounded-xl bg-stone-200 dark:bg-ink-700">
                  <Image
                    src={m.thumbnail_path ?? m.storage_path}
                    alt={m.alt_text}
                    width={300}
                    height={300}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                </div>
              ))}
            </div>
          ) : type === "video" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {media.map((m) => (
                <video key={m.id} controls className="w-full rounded-xl" aria-label={m.alt_text}>
                  <source src={m.storage_path} />
                </video>
              ))}
            </div>
          ) : type === "audio" ? (
            <ul className="space-y-3">
              {media.map((m) => (
                <li key={m.id}>
                  <p className="mb-1 text-sm text-ink-700 dark:text-stone-100">{m.caption}</p>
                  <audio controls src={m.storage_path} className="w-full" aria-label={m.alt_text} />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-2">
              {media.map((m) => (
                <li key={m.id}>
                  <a
                    href={m.storage_path}
                    className="text-moss-600 underline underline-offset-2 hover:text-moss-800"
                  >
                    {m.caption ?? m.alt_text}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}
