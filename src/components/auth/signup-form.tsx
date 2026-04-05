"use client";

import { useActionState, useMemo } from "react";
import type { AuthFormState } from "@/lib/actions/auth";
import { signUpAction } from "@/lib/actions/auth";
import { usePrivacyPolicy } from "@/components/app/privacy-policy-context";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { TextField } from "@/components/ui/text-field";

const initial: AuthFormState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initial);
  const { openPrivacyPolicy } = usePrivacyPolicy();
  const browserTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="timezone" value={browserTimeZone} />
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
        autoComplete="new-password"
        required
        minLength={6}
        label="Password"
        labelClassName="text-sm font-semibold text-foreground"
        hintAfter="At least 6 characters for local Supabase defaults."
      />
      <label className="flex gap-3 text-sm leading-6 text-muted">
        <input
          type="checkbox"
          name="privacy_accepted"
          required
          className="mt-1 h-4 w-4 shrink-0 rounded border-border-soft text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <span>
          I have read and agree to the{" "}
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openPrivacyPolicy();
            }}
            className="inline cursor-pointer border-0 bg-transparent p-0 font-inherit font-semibold text-foreground underline-offset-4 hover:underline"
          >
            Privacy Policy
          </button>
          .
        </span>
      </label>
      <Button type="submit" variant="primary" size="lg" fullWidth disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
