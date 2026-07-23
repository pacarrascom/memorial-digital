"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = { error: null };

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="mb-1 block text-sm text-ink-700 dark:text-stone-100">
          Nombre completo
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          className="w-full rounded-lg border border-ash bg-transparent px-4 py-2 text-sm dark:border-ash-night"
        />
      </div>

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
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full rounded-lg border border-ash bg-transparent px-4 py-2 text-sm dark:border-ash-night"
        />
        <p className="mt-1 text-xs text-ink-400 dark:text-ash-night">Mínimo 8 caracteres.</p>
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
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </button>

      <p className="text-center text-sm text-ink-400 dark:text-ash-night">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-moss-600 underline underline-offset-2">
          Ingresa
        </Link>
      </p>
    </form>
  );
}
