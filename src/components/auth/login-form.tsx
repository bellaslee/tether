"use client";

import { useActionState } from "react";
import type { AuthFormState } from "@/lib/actions/auth";
import { signInAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { TextField } from "@/components/ui/text-field";

const initial: AuthFormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, initial);

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? <FieldError>{state.error}</FieldError> : null}
      <TextField
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        label="Email"
        labelClassName="text-sm font-semibold text-foreground"
      />
      <TextField
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        label="Password"
        labelClassName="text-sm font-semibold text-foreground"
      />
      <Button type="submit" variant="primary" size="lg" fullWidth disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
