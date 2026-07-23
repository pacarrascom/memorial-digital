"use client";

import { signOut } from "@/lib/actions/auth";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="text-sm text-ink-400 underline underline-offset-2 hover:text-ink-700 dark:text-ash-night dark:hover:text-stone-100"
    >
      Cerrar sesión
    </button>
  );
}
