"use client";
 
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
 
export function CandleButton({ memorialId }: { memorialId: string }) {
  const [lit, setLit] = useState(false);
  const [pending, setPending] = useState(false);
  const [count, setCount] = useState<number | null>(null);
 
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("candles")
      .select("id", { count: "exact", head: true })
      .eq("memorial_id", memorialId)
      .then(({ count }) => setCount(count ?? 0));
  }, [memorialId]);
 
  async function lightCandle() {
    if (lit || pending) return;
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.from("candles").insert({
      memorial_id: memorialId,
    });
    setPending(false);
    if (!error) {
      setLit(true);
      setCount((c) => (c ?? 0) + 1);
    }
  }
 
  return (
    <div className="flex flex-wrap items-center gap-3">
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
      {count !== null && count > 0 && (
        <span className="font-mono text-xs text-ink-400">
          {count} {count === 1 ? "persona encendió una vela" : "personas encendieron una vela"}
        </span>
      )}
    </div>
  );
}
