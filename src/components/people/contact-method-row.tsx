"use client";

import { useActionState, useState } from "react";
import type { Tables } from "@/lib/db/database.types";
import type { ActionResult } from "@/lib/actions/contact-methods";
import {
  deleteContactMethodForm,
  setPrimaryContactMethodForm,
  updateContactMethod,
} from "@/lib/actions/contact-methods";
import { CONTACT_METHOD_TYPES } from "@/lib/domain/constants";
import { formatContactType } from "@/lib/domain/labels";
import { Button } from "@/components/ui/button";

const initial: ActionResult = {};

type ContactMethodRowProps = {
  personId: string;
  method: Tables<"contact_methods">;
};

export function ContactMethodRow({ personId, method }: ContactMethodRowProps) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateContactMethod.bind(null, personId, method.id),
    initial,
  );

  if (editing) {
    return (
      <li className="rounded-2xl border border-border-soft bg-white/60 px-4 py-3 text-sm">
        <form action={formAction} className="space-y-3">
          {state.error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900" role="alert">
              {state.error}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted" htmlFor={`edit-type-${method.id}`}>
                Type
              </label>
              <select
                id={`edit-type-${method.id}`}
                name="type"
                required
                defaultValue={method.type}
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
              <label className="text-xs font-semibold text-muted" htmlFor={`edit-value-${method.id}`}>
                Value
              </label>
              <input
                id={`edit-value-${method.id}`}
                name="value"
                required
                defaultValue={method.value}
                className="w-full rounded-xl border border-border-soft bg-white/90 px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-muted" htmlFor={`edit-notes-${method.id}`}>
                Notes
              </label>
              <input
                id={`edit-notes-${method.id}`}
                name="notes"
                defaultValue={method.notes ?? ""}
                className="w-full rounded-xl border border-border-soft bg-white/90 px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={pending}
            >
              {pending ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="rounded-2xl border border-border-soft bg-white/60 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {formatContactType(method.type)}
            {method.is_primary ? (
              <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[0.65rem] text-accent">
                Primary
              </span>
            ) : null}
          </p>
          <p className="mt-1 font-medium">{method.value}</p>
          {method.notes ? <p className="mt-1 text-xs text-muted">{method.notes}</p> : null}
        </div>
        <div className="flex flex-col items-end gap-2 text-xs">
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
          {!method.is_primary ? (
            <form action={setPrimaryContactMethodForm}>
              <input type="hidden" name="person_id" value={personId} />
              <input type="hidden" name="method_id" value={method.id} />
              <Button type="submit" variant="link" size="sm">
                Make primary
              </Button>
            </form>
          ) : null}
          <form action={deleteContactMethodForm}>
            <input type="hidden" name="person_id" value={personId} />
            <input type="hidden" name="method_id" value={method.id} />
            <Button type="submit" variant="dangerLink" size="sm">
              Remove
            </Button>
          </form>
        </div>
      </div>
    </li>
  );
}
