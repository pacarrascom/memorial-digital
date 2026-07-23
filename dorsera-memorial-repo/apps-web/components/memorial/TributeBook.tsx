"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tribute } from "@/types/database";
import { CandleButton } from "./CandleButton";

export function TributeBook({
  memorialId,
  initialTributes,
}: {
  memorialId: string;
  initialTributes: Tribute[];
}) {
  const [tributes] = useState(initialTributes);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submitTribute(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.from("tributes").insert({
      memorial_id: memorialId,
      author_name: name.trim() || null,
      type: "message",
      content: message.trim(),
    });

    if (error) {
      setStatus("error");
      return;
    }
    setMessage("");
    setStatus("sent");
  }

  return (
    <section aria-labelledby="tributes-heading" className="px-8 py-16 md:px-16">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h2 id="tributes-heading" className="text-2xl font-display text-ink-900 dark:text-stone-50">
          Libro de recuerdos
        </h2>
        <CandleButton memorialId={memorialId} />
      </div>

      <form onSubmit={submitTribute} className="mb-12 max-w-xl space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre (opcional)"
          className="w-full rounded-lg border border-ash bg-transparent px-4 py-2 text-sm dark:border-ash-night"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Comparte un recuerdo, una anécdota o unas palabras..."
          rows={4}
          required
          className="w-full rounded-lg border border-ash bg-transparent px-4 py-2 text-sm dark:border-ash-night"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-full bg-moss-600 px-5 py-2 text-sm text-stone-50 transition-colors hover:bg-moss-800 disabled:opacity-60"
        >
          {status === "sending" ? "Enviando…" : "Dejar un recuerdo"}
        </button>
        {status === "sent" && (
          <p className="text-sm text-moss-600" role="status">
            Gracias. Tu mensaje quedará visible una vez que la familia lo revise.
          </p>
        )}
        {status === "error" && (
          <p className="text-sm text-flame-600" role="alert">
            No pudimos guardar tu mensaje. Intenta de nuevo en un momento.
          </p>
        )}
      </form>

      {tributes.length === 0 ? (
        <p className="text-sm italic text-ink-400 dark:text-ash-night">
          Sé la primera persona en dejar un recuerdo.
        </p>
      ) : (
        <ul className="space-y-6">
          {tributes.map((t) => (
            <li key={t.id} className="border-b border-ash pb-6 dark:border-ash-night">
              <p className="text-ink-700 dark:text-stone-100">{t.content}</p>
              <p className="mt-2 font-mono text-xs text-ink-400 dark:text-ash-night">
                {t.author_name ?? "Anónimo"} ·{" "}
                {new Date(t.created_at).toLocaleDateString("es", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
