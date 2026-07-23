import Image from "next/image";
import type { TimelineEvent } from "@/types/database";

export function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) return null;

  return (
    <section aria-labelledby="timeline-heading" className="px-8 py-16 md:px-16">
      <h2 id="timeline-heading" className="mb-10 text-2xl font-display text-ink-900 dark:text-stone-50">
        Historia de vida
      </h2>

      <ol className="relative border-l border-ash dark:border-ash-night">
        {events.map((event) => (
          <li key={event.id} className="mb-10 ml-6">
            <span
              className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-moss-600"
              aria-hidden="true"
            />
            <time className="font-mono text-xs text-ink-400 dark:text-ash-night">
              {new Date(event.event_date).toLocaleDateString("es", {
                year: "numeric",
                month: "long",
              })}
            </time>
            <h3 className="mt-1 font-display text-lg text-ink-900 dark:text-stone-50">
              {event.title}
            </h3>
            {event.location && (
              <p className="text-sm text-ink-400 dark:text-ash-night">{event.location}</p>
            )}
            {event.description && (
              <p className="mt-2 max-w-xl text-ink-700 dark:text-stone-100">
                {event.description}
              </p>
            )}
            {event.cover_media && (
              <Image
                src={event.cover_media.storage_path}
                alt={event.cover_media.alt_text}
                width={480}
                height={320}
                className="mt-3 rounded-xl"
              />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
