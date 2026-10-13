"use client";

import { useActionState } from "react";
import { signIn } from "../actions";

export function SignInForm() {
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-xl border border-seaglass bg-shell px-4 py-3 text-base outline-none focus:border-seaglass-deep focus:ring-2 focus:ring-seaglass"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-xl border border-seaglass bg-shell px-4 py-3 text-base outline-none focus:border-seaglass-deep focus:ring-2 focus:ring-seaglass"
        />
      </label>
      {state?.error && (
        <p role="alert" className="text-sm font-medium text-coral-orange">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn mt-2 px-6 py-3 text-lg"
      >
        {pending ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
