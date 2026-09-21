"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ReactionType } from "@/types/database";

const REACTIONS: { type: ReactionType; label: string; icon: string }[] = [
  { type: "flor", label: "Dejar una flor", icon: "🌸" },
  { type: "corazon", label: "Enviar cariño", icon: "🤍" },
];

export function ReactionButtons({ memorialId }: { memorialId: string }) {
  const [counts, setCounts] = useState<Record<ReactionType, number>>({ flor: 0, corazon: 0 });
  const [sent, setSent] = useState<Record<ReactionType, boolean>>({ flor: false, corazon: false });
  const [pending, setPending] = useState<ReactionType | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("reactions")
      .select("type")
      .eq("memorial_id", memorialId)
      .then(({ data }) => {
        if (!data) return;
        setCounts((prev) => {
          const next = { ...prev };
          for (const row of data as { type: ReactionType }[]) {
            if (row.type === "flor" || row.type === "corazon") next[row.type] += 1;
          }
          return next;
        });
      });
  }, [memorialId]);

  async function react(type: ReactionType) {
    if (sent[type] || pending) return;
    setPending(type);
    const supabase = createClient();
    const { error } = await supabase.from("reactions").insert({
      memorial_id: memorialId,
      type,
    });
    setPending(null);
    if (!error) {
      setSent((prev) => ({ ...prev, [type]: true }));
      setCounts((prev) => ({ ...prev, [type]: prev[type] + 1 }));
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {REACTIONS.map(({ type, label, icon }) => (
        <button
          key={type}
          onClick={() => react(type)}
          disabled={pending !== null}
          aria-pressed={sent[type]}
          className="flex items-center gap-2 rounded-full border border-ash px-4 py-2 text-sm text-ink-700 transition-colors hover:border-flame-400 disabled:opacity-60 dark:border-ash-night dark:text-stone-100"
        >
          <span aria-hidden="true">{icon}</span>
          {sent[type] ? "Gracias" : label}
          {counts[type] > 0 && (
            <span className="font-mono text-xs text-ink-400">{counts[type]}</span>
          )}
        </button>
      ))}
    </div>
  );
}
