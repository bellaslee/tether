"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/actions/contact-methods";
import { createContactMethod } from "@/lib/actions/contact-methods";
import { CONTACT_METHOD_TYPES } from "@/lib/domain/constants";
import { formatContactType } from "@/lib/domain/labels";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Picklist } from "@/components/ui/picklist";
import { FormInput } from "@/components/ui/form-input";

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
        <FieldError size="compact">{state.error}</FieldError>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted" htmlFor={`cm-type-${personId}`}>
            Type
          </label>
          <Picklist
            id={`cm-type-${personId}`}
            name="type"
            required
            autoFocus
            fieldSize="compact"
          >
            {CONTACT_METHOD_TYPES.map((t) => (
              <option key={t} value={t}>
                {formatContactType(t)}
              </option>
            ))}
          </Picklist>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted" htmlFor={`cm-value-${personId}`}>
            Value
          </label>
          <FormInput
            id={`cm-value-${personId}`}
            name="value"
            required
            fieldSize="compact"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted" htmlFor={`cm-notes-${personId}`}>
            Notes
          </label>
          <FormInput
            id={`cm-notes-${personId}`}
            name="notes"
            fieldSize="compact"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_primary" className="h-4 w-4 rounded border-border-soft text-accent" />
          Primary
        </label>
      </div>
      <Button type="submit" variant="primary" size="md" disabled={pending}>
        {pending ? "Adding…" : "Add contact method"}
      </Button>
    </form>
  );
}
