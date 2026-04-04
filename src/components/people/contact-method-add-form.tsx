"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/actions/contact-methods";
import { createContactMethod } from "@/lib/actions/contact-methods";
import { CONTACT_METHOD_TYPES } from "@/lib/domain/constants";
import { formatContactType } from "@/lib/domain/labels";

const initial: ActionResult = {};

type ContactMethodAddFormProps = {
  personId: string;
};

export function ContactMethodAddForm({ personId }: ContactMethodAddFormProps) {
  const [state, formAction, pending] = useActionState(
    createContactMethod.bind(null, personId),
    initial,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-[1.5rem] border border-border-soft bg-white/50 p-5">
      <p className="text-sm font-semibold">Add a way to reach them</p>
      {state.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted" htmlFor={`cm-type-${personId}`}>
            Type
          </label>
          <select
            id={`cm-type-${personId}`}
            name="type"
            required
            className="w-full rounded-xl border border-border-soft bg-white/90 px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
          >
            {CONTACT_METHOD_TYPES.map((t) => (
              <option key={t} value={t}>
                {formatContactType(t)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted" htmlFor={`cm-value-${personId}`}>
            Value
          </label>
          <input
            id={`cm-value-${personId}`}
            name="value"
            required
            className="w-full rounded-xl border border-border-soft bg-white/90 px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted" htmlFor={`cm-notes-${personId}`}>
            Notes
          </label>
          <input
            id={`cm-notes-${personId}`}
            name="notes"
            className="w-full rounded-xl border border-border-soft bg-white/90 px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_primary" className="h-4 w-4 rounded border-border-soft text-accent" />
          Primary
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition enabled:hover:-translate-y-0.5 disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add contact method"}
      </button>
    </form>
  );
}
