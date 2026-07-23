"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function CandleButton({ memorialId }: { memorialId: string }) {
  const [lit, setLit] = useState(false);
  const [pending, setPending] = useState(false);

  async function lightCandle() {
    if (lit || pending) return;
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.from("tributes").insert({
      memorial_id: memorialId,
      type: "candle",
    });
    setPending(false);
    if (!error) setLit(true);
  }

  return (
    <button
      onClick={lightCandle}
      disabled={pending}
      aria-pressed={lit}
      className="flex items-center gap-2 rounded-full border border-ash px-4 py-2 text-sm text-ink-700 transition-colors hover:border-flame-400 disabled:opacity-60 dark:border-ash-night dark:text-stone-100"
    >
      <span
        className={
          lit
            ? "inline-block h-3 w-1.5 rounded-full bg-flame-600 animate-candle-flicker"
            : "inline-block h-3 w-1.5 rounded-full bg-ink-400/40"
        }
        aria-hidden="true"
      />
      {lit ? "Vela encendida" : "Encender una vela"}
    </button>
  );
}
