"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = { error: null };

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/admin";
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-ink-700 dark:text-stone-100">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-ash bg-transparent px-4 py-2 text-sm dark:border-ash-night"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-ink-700 dark:text-stone-100">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-ash bg-transparent px-4 py-2 text-sm dark:border-ash-night"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-flame-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-moss-600 px-5 py-2 text-sm text-stone-50 transition-colors hover:bg-moss-800 disabled:opacity-60"
      >
        {pending ? "Ingresando…" : "Ingresar"}
      </button>

      <p className="text-center text-sm text-ink-400 dark:text-ash-night">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-moss-600 underline underline-offset-2">
          Crea una
        </Link>
      </p>
    </form>
  );
}
